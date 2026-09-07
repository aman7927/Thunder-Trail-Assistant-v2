import { Target, OctagonAlert, ScanLine, Clock } from "lucide-react";
import type { SessionStats } from "../types";

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface StatsBarProps {
  stats: SessionStats;
  isActive: boolean;
}

export default function StatsBar({ stats, isActive }: StatsBarProps) {
  const duration = isActive ? Date.now() - stats.startTime : 0;

  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="bg-base-850 border border-base-700 rounded-lg p-2 text-center">
        <Target className="w-4 h-4 text-accent-400 mx-auto mb-1" />
        <div className="text-lg font-bold text-accent-400 font-mono">{stats.targetsFound}</div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Targets</div>
      </div>
      <div className="bg-base-850 border border-base-700 rounded-lg p-2 text-center">
        <OctagonAlert className="w-4 h-4 text-danger-400 mx-auto mb-1" />
        <div className="text-lg font-bold text-danger-400 font-mono">{stats.trapsDetected}</div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Traps</div>
      </div>
      <div className="bg-base-850 border border-base-700 rounded-lg p-2 text-center">
        <ScanLine className="w-4 h-4 text-slate-300 mx-auto mb-1" />
        <div className="text-lg font-bold text-slate-300 font-mono">{stats.scansCompleted}</div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Scans</div>
      </div>
      <div className="bg-base-850 border border-base-700 rounded-lg p-2 text-center">
        <Clock className="w-4 h-4 text-success-400 mx-auto mb-1" />
        <div className="text-lg font-bold text-success-400 font-mono">{formatDuration(duration)}</div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Time</div>
      </div>
    </div>
  );
}
