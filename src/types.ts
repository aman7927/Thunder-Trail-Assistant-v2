export type Direction = "up" | "down" | "left" | "right" | "forward" | "stop";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TargetDetection {
  id: string;
  label: string;
  confidence: number;
  box: BoundingBox;
}

export interface TrapDetection {
  id: string;
  label: string;
  confidence: number;
  box: BoundingBox;
}

export interface PathGuidance {
  direction: Direction;
  confidence: number;
  description: string;
}

export interface DetectionResult {
  targets: TargetDetection[];
  traps: TrapDetection[];
  guidance: PathGuidance | null;
  sceneDescription: string;
  timestamp: number;
}

export interface AssistantSettings {
  targetDetection: boolean;
  trapDetection: boolean;
  directionalChevrons: boolean;
  swipeSimulation: boolean;
  autoScan: boolean;
  scanInterval: number;
  sensitivity: "low" | "medium" | "high";
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: "target" | "trap" | "guidance" | "system" | "error";
  message: string;
  severity: "info" | "warning" | "danger" | "success";
}

export interface SessionStats {
  targetsFound: number;
  trapsDetected: number;
  startTime: number;
  scansCompleted: number;
}

export const DEFAULT_SETTINGS: AssistantSettings = {
  targetDetection: true,
  trapDetection: true,
  directionalChevrons: true,
  swipeSimulation: false,
  autoScan: true,
  scanInterval: 4000,
  sensitivity: "medium",
};
