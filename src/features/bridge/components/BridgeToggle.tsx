"use client";

import { cn } from "@/shared/lib/utils/cn";
import { BridgeMode } from "../types";

interface BridgeToggleProps {
  bridgeMode: BridgeMode;
  disabled?: boolean;
  onModeChange: (mode: BridgeMode) => void;
}

export const BridgeToggle = ({
  bridgeMode,
  disabled = false,
  onModeChange,
}: BridgeToggleProps) => {
  return (
    <div className="bg-surface-subtle flex rounded-full p-2 [&>button]:cursor-pointer">
      <button
        onClick={() => onModeChange("deposit")}
        disabled={disabled}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-medium transition-colors sm:text-sm",
          bridgeMode === "deposit"
            ? "bg-brand text-white shadow-sm"
            : "text-secondary hover:text-primary",
          disabled && "!cursor-not-allowed opacity-60",
        )}
      >
        {/* <ArrowUpRight size={16} /> */}
        Deposit from any chains
      </button>
      <button
        onClick={() => onModeChange("withdraw")}
        disabled={disabled}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-medium transition-colors sm:text-sm",
          bridgeMode === "withdraw"
            ? "bg-brand text-white shadow-sm"
            : "text-secondary hover:text-primary",
          disabled && "!cursor-not-allowed opacity-60",
        )}
      >
        {/* <ArrowDownLeft size={16} /> */}
        Withdraw to Base
      </button>
    </div>
  );
};
