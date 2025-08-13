"use client";

import { RiskLevel } from "../types/RiskLevel";

export const ProgressBar = ({ level = "low" }: { level?: RiskLevel }) => {
  const riskLevelProgress: Record<RiskLevel, number> = {
    low: 33,
    medium: 66,
    high: 100,
  };

  const progressWidth = riskLevelProgress[level];

  return (
    <div className="h-6 w-full overflow-hidden rounded-md border border-white/70 bg-transparent">
      <div
        className="h-full bg-green-500 transition-all duration-300 ease-in-out"
        style={{ width: `${progressWidth}%` }}
      />
    </div>
  );
};
