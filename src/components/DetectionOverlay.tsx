import { motion, AnimatePresence } from "motion/react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, OctagonAlert, MapPin, Target } from "lucide-react";
import type { DetectionResult, TargetDetection, TrapDetection, Direction } from "../types";

interface OverlayProps {
  result: DetectionResult | null;
  showTargets: boolean;
  showTraps: boolean;
  showChevrons: boolean;
  scanning: boolean;
}

const directionConfig: Record<Direction, { icon: typeof ChevronUp; label: string; angle: number }> = {
  up: { icon: ChevronUp, label: "UP", angle: 0 },
  down: { icon: ChevronDown, label: "DOWN", angle: 180 },
  left: { icon: ChevronLeft, label: "LEFT", angle: 270 },
  right: { icon: ChevronRight, label: "RIGHT", angle: 90 },
  forward: { icon: ChevronUp, label: "FORWARD", angle: 0 },
  stop: { icon: OctagonAlert, label: "STOP", angle: 0 },
};

function TargetMarker({ target }: { target: TargetDetection }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className="absolute border-2 border-accent-400 rounded-sm pointer-events-none"
      style={{
        left: `${target.box.x}%`,
        top: `${target.box.y}%`,
        width: `${target.box.width}%`,
        height: `${target.box.height}%`,
        boxShadow: "0 0 12px rgba(56, 189, 248, 0.5)",
      }}
    >
      <div className="absolute -top-6 left-0 bg-accent-500/90 text-base-950 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap flex items-center gap-1">
        <Target className="w-2.5 h-2.5" />
        {target.label.toUpperCase()} ({Math.round(target.confidence * 100)}%)
      </div>
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-accent-400" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-accent-400" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-accent-400" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-accent-400" />
    </motion.div>
  );
}

function TrapMarker({ trap }: { trap: TrapDetection }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className="absolute border-2 border-danger-500 rounded-sm pointer-events-none"
      style={{
        left: `${trap.box.x}%`,
        top: `${trap.box.y}%`,
        width: `${trap.box.width}%`,
        height: `${trap.box.height}%`,
        boxShadow: "0 0 12px rgba(239, 68, 68, 0.6)",
      }}
    >
      <div className="absolute -top-6 left-0 bg-danger-600 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap flex items-center gap-1 animate-blink">
        <OctagonAlert className="w-2.5 h-2.5" />
        {trap.label.toUpperCase()} ({Math.round(trap.confidence * 100)}%)
      </div>
      <div className="absolute inset-0 bg-danger-500/10" />
    </motion.div>
  );
}

function DirectionalChevron({ direction, confidence }: { direction: Direction; confidence: number }) {
  const config = directionConfig[direction];
  const Icon = config.icon;

  if (direction === "stop") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      >
        <div className="bg-danger-600/90 rounded-full p-4 flex items-center justify-center shadow-2xl animate-blink">
          <Icon className="w-12 h-12 text-white" />
        </div>
        <div className="text-center mt-2 text-danger-400 font-mono font-bold text-sm tracking-widest">STOP</div>
      </motion.div>
    );
  }

  const positions: Record<string, string> = {
    forward: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    up: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    down: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    left: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    right: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: [1, 1.1, 1] }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 0.5 }}
      className={`absolute ${positions[direction]} pointer-events-none`}
    >
      <div className="flex flex-col items-center">
        <div className="bg-accent-500/80 rounded-full p-4 backdrop-blur-sm shadow-2xl">
          <Icon className="w-10 h-10 text-white" />
        </div>
        <div className="text-accent-400 font-mono font-bold text-xs tracking-widest mt-2 bg-base-950/70 px-2 py-0.5 rounded">
          {config.label} · {Math.round(confidence * 100)}%
        </div>
      </div>
    </motion.div>
  );
}

export default function DetectionOverlay({ result, showTargets, showTraps, showChevrons, scanning }: OverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {scanning && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-0 right-0 h-0.5 bg-accent-400/60 sweep-line" style={{ boxShadow: "0 0 10px rgba(56, 189, 248, 0.8)" }} />
        </div>
      )}

      {showTargets && (
        <AnimatePresence>
          {result?.targets.map((t) => <TargetMarker key={t.id} target={t} />)}
        </AnimatePresence>
      )}

      {showTraps && (
        <AnimatePresence>
          {result?.traps.map((t) => <TrapMarker key={t.id} trap={t} />)}
        </AnimatePresence>
      )}

      {showChevrons && result?.guidance && (
        <AnimatePresence>
          <DirectionalChevron direction={result.guidance.direction} confidence={result.guidance.confidence} />
        </AnimatePresence>
      )}

      {result && result.targets.length === 0 && result.traps.length === 0 && !scanning && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-base-900/70 backdrop-blur-sm rounded px-3 py-1">
          <span className="text-success-400 font-mono text-xs flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> AREA CLEAR
          </span>
        </div>
      )}
    </div>
  );
}
