import { motion } from "motion/react";
import { Target, OctagonAlert, Navigation, MousePointerClick, ScanLine, Gauge } from "lucide-react";
import type { AssistantSettings } from "../types";

interface SettingsPanelProps {
  settings: AssistantSettings;
  onChange: (settings: AssistantSettings) => void;
}

function Toggle({
  label,
  description,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  description: string;
  icon: typeof Target;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
        value
          ? "bg-accent-500/10 border-accent-500/40"
          : "bg-base-850 border-base-700 hover:border-base-600"
      }`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${value ? "text-accent-400" : "text-slate-500"}`} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${value ? "text-accent-400" : "text-slate-300"}`}>{label}</div>
        <div className="text-xs text-slate-500 truncate">{description}</div>
      </div>
      <div
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
          value ? "bg-accent-500" : "bg-base-600"
        }`}
      >
        <motion.div
          layout
          className="absolute top-0.5 w-4 h-4 bg-white rounded-full"
          animate={{ left: value ? "1.25rem" : "0.125rem" }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}

export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const update = (key: keyof AssistantSettings, value: boolean | number | string) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-2">
      <Toggle
        label="Target Detection"
        description="Highlight objects and players in view"
        icon={Target}
        value={settings.targetDetection}
        onChange={(v) => update("targetDetection", v)}
      />
      <Toggle
        label="Trap Detection"
        description="Mark hazards and obstacles"
        icon={OctagonAlert}
        value={settings.trapDetection}
        onChange={(v) => update("trapDetection", v)}
      />
      <Toggle
        label="Directional Chevrons"
        description="Show movement guidance arrows"
        icon={Navigation}
        value={settings.directionalChevrons}
        onChange={(v) => update("directionalChevrons", v)}
      />
      <Toggle
        label="Swipe Simulation"
        description="Display simulated gesture paths"
        icon={MousePointerClick}
        value={settings.swipeSimulation}
        onChange={(v) => update("swipeSimulation", v)}
      />
      <Toggle
        label="Auto Scan"
        description="Continuously analyze the camera feed"
        icon={ScanLine}
        value={settings.autoScan}
        onChange={(v) => update("autoScan", v)}
      />

      <div className="p-3 rounded-lg bg-base-850 border border-base-700">
        <div className="flex items-center gap-2 mb-2">
          <Gauge className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Sensitivity</span>
        </div>
        <div className="flex gap-1.5">
          {(["low", "medium", "high"] as const).map((level) => (
            <button
              key={level}
              onClick={() => update("sensitivity", level)}
              className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors capitalize ${
                settings.sensitivity === level
                  ? "bg-accent-500 text-base-950 font-bold"
                  : "bg-base-800 text-slate-400 hover:bg-base-700"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-lg bg-base-850 border border-base-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Scan Interval</span>
          <span className="text-xs font-mono text-accent-400">{(settings.scanInterval / 1000).toFixed(1)}s</span>
        </div>
        <input
          type="range"
          min="2000"
          max="10000"
          step="1000"
          value={settings.scanInterval}
          onChange={(e) => update("scanInterval", Number(e.target.value))}
          className="w-full accent-accent-500"
        />
      </div>
    </div>
  );
}
