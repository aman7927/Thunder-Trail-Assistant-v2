import { GoogleGenAI } from "@google/genai";
import type { DetectionResult, TargetDetection, TrapDetection, PathGuidance, Direction } from "../types";

const VISION_MODEL = "gemini-2.5-flash";

function getApiKey(): string | null {
  const key = import.meta.env.GEMINI_API_KEY;
  if (key && key.length > 10) return key;
  return null;
}

let aiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const key = getApiKey();
  if (!key) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export function isGeminiConfigured(): boolean {
  return getApiKey() !== null;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function parseDirection(text: string): Direction {
  const lower = text.toLowerCase();
  if (lower.includes("left")) return "left";
  if (lower.includes("right")) return "right";
  if (lower.includes("up") || lower.includes("forward") || lower.includes("ahead") || lower.includes("straight")) return "forward";
  if (lower.includes("down")) return "down";
  if (lower.includes("stop") || lower.includes("wait") || lower.includes("halt")) return "stop";
  return "forward";
}

function parseJSON(text: string): unknown | null {
  try {
    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function extractBoundingBox(raw: unknown): { x: number; y: number; width: number; height: number } | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const x = Number(obj.x ?? obj.left ?? 0);
  const y = Number(obj.y ?? obj.top ?? 0);
  const width = Number(obj.width ?? obj.w ?? 0);
  const height = Number(obj.height ?? obj.h ?? 0);
  if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) return null;
  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
    width: Math.max(0, Math.min(100, width)),
    height: Math.max(0, Math.min(100, height)),
  };
}

export async function analyzeFrame(imageBase64: string): Promise<DetectionResult> {
  const client = getClient();
  if (!client) {
    throw new Error("Gemini API key not configured. Set GEMINI_API_KEY in your environment.");
  }

  const prompt = `You are a tactical trail assistant analyzing a live camera frame from a first-person perspective.
Analyze the scene and respond with ONLY a JSON object (no markdown, no extra text) in this exact format:

{
  "targets": [
    { "label": "description of object/creature/player", "confidence": 0.85, "box": { "x": 25, "y": 30, "width": 15, "height": 20 } }
  ],
  "traps": [
    { "label": "description of hazard/trap/obstacle", "confidence": 0.80, "box": { "x": 50, "y": 60, "width": 20, "height": 15 } }
  ],
  "guidance": {
    "direction": "left|right|forward|stop",
    "confidence": 0.75,
    "description": "brief reason for the suggested direction"
  },
  "sceneDescription": "one sentence summary of what you see"
}

Rules:
- Coordinates are percentages (0-100) relative to the image, where (0,0) is top-left.
- box.x and box.y are the top-left corner of the bounding box.
- Only include targets and traps you are confident about (confidence > 0.5).
- Guidance direction should be one of: "left", "right", "forward", "stop".
- If no targets or traps are visible, return empty arrays.
- If no clear guidance, set guidance to null.
- Respond with raw JSON only, no code fences.`;

  const response = await client.models.generateContent({
    model: VISION_MODEL,
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64,
          },
        },
      ],
    },
  });

  const text = response.text ?? "";
  const parsed = parseJSON(text);

  if (!parsed || typeof parsed !== "object") {
    return {
      targets: [],
      traps: [],
      guidance: null,
      sceneDescription: "Unable to parse analysis results.",
      timestamp: Date.now(),
    };
  }

  const data = parsed as Record<string, unknown>;
  const targets: TargetDetection[] = [];
  const traps: TrapDetection[] = [];

  if (Array.isArray(data.targets)) {
    for (const t of data.targets) {
      const box = extractBoundingBox((t as Record<string, unknown>).box);
      if (!box) continue;
      const label = String((t as Record<string, unknown>).label ?? "Unknown");
      const confidence = Number((t as Record<string, unknown>).confidence ?? 0.5);
      targets.push({ id: generateId(), label, confidence: Math.max(0, Math.min(1, confidence)), box });
    }
  }

  if (Array.isArray(data.traps)) {
    for (const tr of data.traps) {
      const box = extractBoundingBox((tr as Record<string, unknown>).box);
      if (!box) continue;
      const label = String((tr as Record<string, unknown>).label ?? "Unknown");
      const confidence = Number((tr as Record<string, unknown>).confidence ?? 0.5);
      traps.push({ id: generateId(), label, confidence: Math.max(0, Math.min(1, confidence)), box });
    }
  }

  let guidance: PathGuidance | null = null;
  if (data.guidance && typeof data.guidance === "object") {
    const g = data.guidance as Record<string, unknown>;
    guidance = {
      direction: parseDirection(String(g.direction ?? "forward")),
      confidence: Math.max(0, Math.min(1, Number(g.confidence ?? 0.5))),
      description: String(g.description ?? ""),
    };
  }

  return {
    targets,
    traps,
    guidance,
    sceneDescription: String(data.sceneDescription ?? "Scene analyzed."),
    timestamp: Date.now(),
  };
}
