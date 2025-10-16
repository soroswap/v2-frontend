"use client";

import { cn } from "@/shared/lib/utils/cn";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { BridgeMode } from "../types";

interface BridgeToggleProps {
  bridgeMode: BridgeMode;
  onModeChange: (mode: BridgeMode) => void;
}

export const BridgeToggle = ({
  bridgeMode,
  onModeChange,
}: BridgeToggleProps) => {
  return (
    <div className="bg-surface-subtle flex rounded-full p-2 [&>button]:cursor-pointer">
      <button
        onClick={() => onModeChange("deposit")}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition-colors",
          bridgeMode === "deposit"
            ? "bg-brand text-white shadow-sm"
            : "text-secondary hover:text-primary",
        )}
      >
        {/* <ArrowUpRight size={16} /> */}
        Deposit from any chains
      </button>
      <button
        onClick={() => onModeChange("withdraw")}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition-colors",
          bridgeMode === "withdraw"
            ? "bg-brand text-white shadow-sm"
            : "text-secondary hover:text-primary",
        )}
      >
        {/* <ArrowDownLeft size={16} /> */}
        Withdraw to Base
      </button>
    </div>
  );
};
