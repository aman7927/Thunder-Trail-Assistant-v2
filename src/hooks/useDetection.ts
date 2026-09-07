import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeFrame } from "../services/gemini";
import type { DetectionResult } from "../types";

export type ScanState = "idle" | "scanning" | "success" | "error";

export function useDetection(
  captureFrame: () => string | null,
  enabled: boolean,
  scanInterval: number,
) {
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanError, setScanError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanningRef = useRef(false);
  const enabledRef = useRef(enabled);
  const intervalRef = useRef(scanInterval);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    intervalRef.current = scanInterval;
  }, [scanInterval]);

  const scan = useCallback(async () => {
    if (scanningRef.current) return;
    const frame = captureFrame();
    if (!frame) return;
    scanningRef.current = true;
    setScanState("scanning");
    setScanError(null);
    try {
      const r = await analyzeFrame(frame);
      setResult(r);
      setScanState("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setScanError(msg);
      setScanState("error");
    } finally {
      scanningRef.current = false;
    }
  }, [captureFrame]);

  useEffect(() => {
    if (!enabled) {
      setScanState("idle");
      return;
    }
    const tick = async () => {
      if (!enabledRef.current || scanningRef.current) {
        timerRef.current = setTimeout(tick, intervalRef.current);
        return;
      }
      await scan();
      timerRef.current = setTimeout(tick, intervalRef.current);
    };
    timerRef.current = setTimeout(tick, intervalRef.current);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, scanInterval, scan]);

  return { result, scanState, scanError, scan, setScanState };
}
