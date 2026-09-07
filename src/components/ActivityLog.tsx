import { motion, AnimatePresence } from "motion/react";
import { Target, OctagonAlert, Navigation, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { LogEntry } from "../types";

const typeIcon = {
  target: Target,
  trap: OctagonAlert,
  guidance: Navigation,
  system: Info,
  error: AlertTriangle,
};

const severityColor = {
  info: "text-slate-400",
  warning: "text-warn-400",
  danger: "text-danger-400",
  success: "text-success-400",
};

const severityIcon = {
  info: Info,
  warning: AlertTriangle,
  danger: XCircle,
  success: CheckCircle,
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

interface ActivityLogProps {
  entries: LogEntry[];
  onClear: () => void;
}

export default function ActivityLog({ entries, onClear }: ActivityLogProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">Activity Log</h3>
        {entries.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-slate-500 hover:text-danger-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0 scrollbar-thin">
        <AnimatePresence initial={false}>
          {entries.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-slate-600 text-xs py-8"
            >
              No activity yet. Start scanning to see detections.
            </motion.div>
          )}
          {entries.map((entry) => {
            const TypeIcon = typeIcon[entry.type] ?? Info;
            const SevIcon = severityIcon[entry.severity] ?? Info;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex items-start gap-2 p-2 rounded bg-base-850/50 border border-base-800"
              >
                <TypeIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${severityColor[entry.severity]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-600 flex-shrink-0">{formatTime(entry.timestamp)}</span>
                    <SevIcon className={`w-3 h-3 flex-shrink-0 ${severityColor[entry.severity]}`} />
                  </div>
                  <p className={`text-xs ${severityColor[entry.severity]} leading-snug`}>{entry.message}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
