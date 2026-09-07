import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Crosshair,
  Play,
  Square,
  Camera,
  CameraOff,
  Settings as SettingsIcon,
  Activity,
  Zap,
  AlertCircle,
  ScanLine,
  KeyRound,
  ChevronRight,
} from "lucide-react";
import { useCamera } from "./hooks/useCamera";
import { useDetection } from "./hooks/useDetection";
import { isGeminiConfigured } from "./services/gemini";
import { DEFAULT_SETTINGS } from "./types";
import type { AssistantSettings, LogEntry, SessionStats, DetectionResult } from "./types";
import DetectionOverlay from "./components/DetectionOverlay";
import SettingsPanel from "./components/SettingsPanel";
import ActivityLog from "./components/ActivityLog";
import StatsBar from "./components/StatsBar";

function loadSettings(): AssistantSettings {
  try {
    const raw = localStorage.getItem("tta_settings");
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* noop */ }
  return DEFAULT_SETTINGS;
}

function loadLog(): LogEntry[] {
  try {
    const raw = localStorage.getItem("tta_log");
    if (raw) return JSON.parse(raw).slice(0, 50);
  } catch { /* noop */ }
  return [];
}

function genId(): string {
  return Math.random().toString(36).substring(2, 11);
}

type View = "dashboard" | "settings" | "log";

export default function App() {
  const [settings, setSettings] = useState<AssistantSettings>(loadSettings);
  const [logs, setLogs] = useState<LogEntry[]>(loadLog);
  const [view, setView] = useState<View>("dashboard");
  const [isActive, setIsActive] = useState(false);
  const [stats, setStats] = useState<SessionStats>({ targetsFound: 0, trapsDetected: 0, startTime: 0, scansCompleted: 0 });
  const [now, setNow] = useState(Date.now());
  const geminiReady = useMemo(() => isGeminiConfigured(), []);

  const { videoRef, status: camStatus, error: camError, start: startCam, stop: stopCam, captureFrame } = useCamera();
  const { result, scanState, scanError, scan } = useDetection(captureFrame, isActive && settings.autoScan, settings.scanInterval);

  const lastResultRef = useRef<DetectionResult | null>(null);

  useEffect(() => {
    localStorage.setItem("tta_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("tta_log", JSON.stringify(logs.slice(0, 50)));
  }, [logs]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  const addLog = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    setLogs((prev) => [{ ...entry, id: genId(), timestamp: Date.now() }, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    if (!result || result === lastResultRef.current) return;
    lastResultRef.current = result;

    setStats((prev) => ({
      ...prev,
      targetsFound: prev.targetsFound + result.targets.length,
      trapsDetected: prev.trapsDetected + result.traps.length,
      scansCompleted: prev.scansCompleted + 1,
    }));

    if (result.targets.length > 0) {
      addLog({
        type: "target",
        message: `${result.targets.length} target(s) detected: ${result.targets.map((t) => t.label).join(", ")}`,
        severity: "info",
      });
    }
    if (result.traps.length > 0) {
      addLog({
        type: "trap",
        message: `WARNING: ${result.traps.length} trap(s) detected: ${result.traps.map((t) => t.label).join(", ")}`,
        severity: "danger",
      });
    }
    if (result.guidance) {
      addLog({
        type: "guidance",
        message: `Direction: ${result.guidance.direction.toUpperCase()} — ${result.guidance.description}`,
        severity: result.guidance.direction === "stop" ? "warning" : "success",
      });
    }
  }, [result, addLog]);

  useEffect(() => {
    if (scanError) {
      addLog({ type: "error", message: scanError, severity: "danger" });
    }
  }, [scanError, addLog]);

  const handleStart = useCallback(async () => {
    if (!geminiReady) {
      addLog({ type: "error", message: "Gemini API key not set. Add GEMINI_API_KEY to your environment.", severity: "danger" });
      return;
    }
    addLog({ type: "system", message: "Activating assistant...", severity: "info" });
    await startCam();
    setStats({ targetsFound: 0, trapsDetected: 0, startTime: Date.now(), scansCompleted: 0 });
    setIsActive(true);
    addLog({ type: "system", message: "Assistant active. Camera feed live.", severity: "success" });
  }, [geminiReady, startCam, addLog]);

  const handleStop = useCallback(() => {
    setIsActive(false);
    stopCam();
    addLog({ type: "system", message: "Assistant stopped.", severity: "info" });
  }, [stopCam, addLog]);

  const handleManualScan = useCallback(async () => {
    if (!isActive) return;
    addLog({ type: "system", message: "Manual scan initiated...", severity: "info" });
    await scan();
  }, [isActive, scan, addLog]);

  const clearLog = useCallback(() => setLogs([]), []);

  const cameraReady = camStatus === "active";
  const scanning = scanState === "scanning";

  return (
    <div className="h-full flex flex-col bg-base-950 scanline">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-base-800 bg-base-900/80 backdrop-blur-md z-20">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? "bg-accent-500/20" : "bg-base-800"}`}>
              <Crosshair className={`w-5 h-5 ${isActive ? "text-accent-400" : "text-slate-500"}`} />
              {isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-success-500 rounded-full border-2 border-base-900 animate-blink" />
              )}
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-100">Thunder Trail</h1>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                {isActive ? "ACTIVE" : "STANDBY"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <NavButton active={view === "dashboard"} onClick={() => setView("dashboard")} icon={Crosshair} label="View" />
            <NavButton active={view === "settings"} onClick={() => setView("settings")} icon={SettingsIcon} label="Settings" />
            <NavButton active={view === "log"} onClick={() => setView("log")} icon={Activity} label="Log" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Camera / Overlay area */}
        <div className={`flex-1 relative ${view === "settings" || view === "log" ? "hidden lg:block" : ""}`}>
          {/* Camera video */}
          <div className="absolute inset-0 flex items-center justify-center bg-base-950">
            {cameraReady ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center px-8">
                {camStatus === "requesting" ? (
                  <>
                    <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
                    <p className="text-slate-500 text-sm">Requesting camera access...</p>
                  </>
                ) : camStatus === "denied" || camStatus === "error" ? (
                  <>
                    <CameraOff className="w-12 h-12 text-danger-500 mx-auto mb-3" />
                    <p className="text-danger-400 text-sm font-medium mb-1">Camera unavailable</p>
                    <p className="text-slate-600 text-xs max-w-xs">{camError}</p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-base-850 border-2 border-base-700 flex items-center justify-center mx-auto mb-4">
                      <Crosshair className="w-10 h-10 text-slate-600" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Assistant Standby</p>
                    <p className="text-slate-600 text-xs">Press Start to activate camera and begin scanning</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Detection overlay */}
          {cameraReady && (
            <DetectionOverlay
              result={result}
              showTargets={settings.targetDetection}
              showTraps={settings.trapDetection}
              showChevrons={settings.directionalChevrons}
              scanning={scanning}
            />
          )}

          {/* HUD corners */}
          {cameraReady && (
            <>
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-accent-400/40 pointer-events-none" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-accent-400/40 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-accent-400/40 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-accent-400/40 pointer-events-none" />
            </>
          )}

          {/* Scene description */}
          {cameraReady && result && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 max-w-md bg-base-950/70 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-base-700/50">
              <p className="text-xs text-slate-300 text-center font-mono">{result.sceneDescription}</p>
            </div>
          )}

          {/* Gemini not configured warning */}
          {!geminiReady && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-warn-500/20 border border-warn-500/50 rounded-lg px-3 py-2 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-warn-400" />
              <span className="text-xs text-warn-400 font-medium">Gemini API key required for vision analysis</span>
            </div>
          )}

          {/* Control bar */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-base-950 via-base-950/80 to-transparent">
            <div className="flex items-center justify-center gap-3">
              {!isActive ? (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-base-950 font-bold px-6 py-2.5 rounded-lg transition-colors shadow-lg"
                >
                  <Play className="w-4 h-4" />
                  START
                </button>
              ) : (
                <>
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-2 bg-danger-600 hover:bg-danger-500 text-white font-bold px-5 py-2.5 rounded-lg transition-colors shadow-lg"
                  >
                    <Square className="w-4 h-4" />
                    STOP
                  </button>
                  <button
                    onClick={handleManualScan}
                    disabled={scanning || !settings.autoScan === false}
                    className="flex items-center gap-2 bg-base-800 hover:bg-base-700 disabled:opacity-40 text-slate-200 font-bold px-4 py-2.5 rounded-lg transition-colors border border-base-600"
                  >
                    <ScanLine className={`w-4 h-4 ${scanning ? "animate-pulse text-accent-400" : ""}`} />
                    {scanning ? "SCANNING" : "SCAN"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <aside className={`w-full max-w-sm flex-shrink-0 border-l border-base-800 bg-base-900 flex flex-col ${view === "dashboard" ? "hidden lg:flex" : "flex"}`}>
          <div className="p-4 border-b border-base-800">
            <StatsBar stats={stats} isActive={isActive} />
          </div>

          <AnimatePresence mode="wait">
            {view === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-2">Detection Settings</h3>
                <SettingsPanel settings={settings} onChange={setSettings} />
              </motion.div>
            )}

            {view === "log" && (
              <motion.div
                key="log"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex-1 overflow-hidden p-4 flex flex-col"
              >
                <ActivityLog entries={logs} onClear={clearLog} />
              </motion.div>
            )}

            {view === "dashboard" && (
              <motion.div
                key="dash"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {/* Status card */}
                <div className="bg-base-850 border border-base-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className={`w-4 h-4 ${isActive ? "text-accent-400" : "text-slate-600"}`} />
                    <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">System Status</h3>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <StatusRow label="Camera" value={camStatus === "active" ? "LIVE" : camStatus === "idle" ? "OFF" : camStatus.toUpperCase()} active={camStatus === "active"} />
                    <StatusRow label="Scanner" value={scanning ? "ANALYZING" : isActive ? "READY" : "OFF"} active={scanning} />
                    <StatusRow label="Vision AI" value={geminiReady ? "CONFIGURED" : "NO API KEY"} active={geminiReady} />
                    <StatusRow label="Auto-Scan" value={settings.autoScan ? "ON" : "OFF"} active={settings.autoScan} />
                  </div>
                </div>

                {/* Latest detection summary */}
                {result && (
                  <div className="bg-base-850 border border-base-700 rounded-lg p-3">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-2">Last Scan</h3>
                    {result.targets.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[10px] text-slate-600 uppercase mb-1">Targets ({result.targets.length})</p>
                        {result.targets.slice(0, 3).map((t) => (
                          <div key={t.id} className="flex items-center justify-between text-xs py-0.5">
                            <span className="text-accent-400 truncate">{t.label}</span>
                            <span className="text-slate-600 font-mono flex-shrink-0">{Math.round(t.confidence * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {result.traps.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[10px] text-slate-600 uppercase mb-1">Traps ({result.traps.length})</p>
                        {result.traps.slice(0, 3).map((t) => (
                          <div key={t.id} className="flex items-center justify-between text-xs py-0.5">
                            <span className="text-danger-400 truncate">{t.label}</span>
                            <span className="text-slate-600 font-mono flex-shrink-0">{Math.round(t.confidence * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {result.guidance && (
                      <div>
                        <p className="text-[10px] text-slate-600 uppercase mb-1">Guidance</p>
                        <div className="flex items-center gap-1.5 text-xs">
                          <ChevronRight className="w-3 h-3 text-success-400" />
                          <span className="text-success-400 font-medium">{result.guidance.direction.toUpperCase()}</span>
                        </div>
                      </div>
                    )}
                    {result.targets.length === 0 && result.traps.length === 0 && (
                      <p className="text-xs text-success-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3" /> Area clear — no threats detected
                      </p>
                    )}
                  </div>
                )}

                {/* Quick settings preview */}
                <div className="bg-base-850 border border-base-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">Active Modules</h3>
                    <button onClick={() => setView("settings")} className="text-[10px] text-accent-400 hover:text-accent-300">Edit</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <ModuleTag active={settings.targetDetection} label="Targets" />
                    <ModuleTag active={settings.trapDetection} label="Traps" />
                    <ModuleTag active={settings.directionalChevrons} label="Chevrons" />
                    <ModuleTag active={settings.swipeSimulation} label="Swipe" />
                    <ModuleTag active={settings.autoScan} label="Auto-Scan" />
                  </div>
                </div>

                {/* Recent activity preview */}
                <div className="bg-base-850 border border-base-700 rounded-lg p-3 flex-1 min-h-0 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">Recent Activity</h3>
                    <button onClick={() => setView("log")} className="text-[10px] text-accent-400 hover:text-accent-300">Full log</button>
                  </div>
                  <div className="space-y-1 flex-1 overflow-y-auto">
                    {logs.length === 0 ? (
                      <p className="text-xs text-slate-600 text-center py-4">No activity yet</p>
                    ) : (
                      logs.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="text-xs text-slate-400 truncate">
                          {entry.message}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>

      {/* Mobile bottom nav for small screens */}
      <nav className="lg:hidden flex-shrink-0 border-t border-base-800 bg-base-900 flex">
        <MobileNavButton active={view === "dashboard"} onClick={() => setView("dashboard")} icon={Crosshair} label="View" />
        <MobileNavButton active={view === "settings"} onClick={() => setView("settings")} icon={SettingsIcon} label="Settings" />
        <MobileNavButton active={view === "log"} onClick={() => setView("log")} icon={Activity} label="Log" />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Crosshair; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        active ? "bg-base-800 text-accent-400" : "text-slate-500 hover:text-slate-300 hover:bg-base-850"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function MobileNavButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Crosshair; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${
        active ? "text-accent-400" : "text-slate-600"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-mono uppercase">{label}</span>
    </button>
  );
}

function StatusRow({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-mono ${active ? "text-success-400" : "text-slate-400"}`}>
        {active && <span className="inline-block w-1.5 h-1.5 rounded-full bg-success-400 mr-1.5 animate-blink" />}
        {value}
      </span>
    </div>
  );
}

function ModuleTag({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
      active ? "bg-accent-500/15 text-accent-400 border border-accent-500/30" : "bg-base-800 text-slate-600 border border-base-700"
    }`}>
      {label}
    </span>
  );
}
