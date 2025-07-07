"use client";

import { useState } from "react";
import { ChevronDown, Info, ExternalLink, AlertTriangle } from "lucide-react";
import { Modal } from "@/shared/components/Modal";
import { cn } from "@/shared/lib/utils/cn";
import { ToggleButton } from "@/shared/components/buttons";
import { SupportedProtocols } from "@soroswap/sdk";
import { isDecimalInRange } from "@/shared/lib/utils/validators";
import { useSwapSettingsStore } from "@/contexts/store/swap-settings";

interface SwapSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwapSettingsModal = ({
  isOpen,
  onClose,
}: SwapSettingsModalProps) => {
  const [isProtocolExpanded, setIsProtocolExpanded] = useState<boolean>(true);
  const { swapSettings: settings, setSwapSettings } = useSwapSettingsStore();

  const slippageNum = Number(settings.customSlippage);
  const slippageLevel =
    slippageNum >= 20 ? "veryHigh" : slippageNum >= 5 ? "high" : null;

  const slippageColor =
    slippageLevel === "veryHigh"
      ? "text-red-400"
      : slippageLevel === "high"
        ? "text-yellow-400"
        : "text-gray-400";

  const handleSlippageModeChange = (mode: "auto" | "custom") => {
    setSwapSettings({
      ...settings,
      slippageMode: mode,
      customSlippage: mode === "auto" ? "1" : settings.customSlippage,
    });
  };

  const handleCustomSlippageChange = (value: string) => {
    // Auto-prepend leading zero so ".5" becomes "0.5"
    const normalized = value.startsWith(".") ? `0${value}` : value;

    if (isDecimalInRange(normalized, 0, 100, 2)) {
      setSwapSettings({
        ...settings,
        customSlippage: normalized,
      });
    }
  };

  const handleProtocolToggle = (protocol: SupportedProtocols) => {
    const isActive = settings.protocols.includes(protocol);

    if (isActive && settings.protocols.length === 1) {
      return;
    }

    const updatedProtocols = isActive
      ? settings.protocols.filter((p) => p !== protocol)
      : [...settings.protocols, protocol];

    setSwapSettings({
      ...settings,
      protocols: updatedProtocols,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" className="px-4">
      <div className="flex h-full flex-col gap-4">
        {/* Max Slippage */}
        <div className="flex h-full flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-[#A0A3C4]">
                Max slippage
              </span>
              <Info size={14} className="text-gray-400" />
            </div>
            {slippageLevel && (
              <div className={cn("flex items-center gap-2", slippageColor)}>
                <AlertTriangle size={14} />
                <span className="text-sm">
                  {slippageLevel === "high"
                    ? "High slippage"
                    : "Very high slippage"}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleSlippageModeChange("auto")}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                settings.slippageMode === "auto"
                  ? "bg-brand text-white"
                  : "bg-[#23243a] text-gray-400 hover:bg-[#2a2b3f]",
              )}
            >
              Auto
            </button>
            <button
              onClick={() => handleSlippageModeChange("custom")}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                settings.slippageMode === "custom"
                  ? "bg-brand text-white"
                  : "bg-[#23243a] text-gray-400 hover:bg-[#2a2b3f]",
              )}
            >
              Custom
            </button>
            <div className="relative flex items-center gap-1 border border-transparent">
              <input
                type="text"
                value={
                  settings.slippageMode === "auto"
                    ? "1"
                    : settings.customSlippage
                }
                onChange={(e) => handleCustomSlippageChange(e.target.value)}
                onFocus={() => {
                  if (settings.slippageMode === "auto") {
                    handleSlippageModeChange("custom");
                  }
                }}
                readOnly={settings.slippageMode === "auto"}
                className={cn(
                  "w-[70px] rounded-lg border border-transparent bg-[#23243a] p-2 text-center text-sm text-white outline-none",
                  settings.slippageMode === "auto" && "opacity-50",
                  slippageColor,
                )}
                placeholder="0"
              />
              <span
                className={cn(
                  "pointer-events-none absolute inset-y-0 right-2 flex items-center text-sm text-gray-400",
                  settings.slippageMode === "auto" && "opacity-50",
                  slippageColor,
                )}
              >
                %
              </span>
            </div>
          </div>
        </div>

        {/* Protocols */}
        <div className="flex h-full flex-col gap-2">
          <button
            onClick={() => setIsProtocolExpanded(!isProtocolExpanded)}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-[#A0A3C4]">
                Protocols
              </span>
              <Info size={14} className="text-gray-400" />
            </div>
            <ChevronDown
              size={24}
              className={cn(
                "text-gray-400 transition-transform duration-500",
                isProtocolExpanded ? "rotate-180" : "rotate-0",
              )}
            />
          </button>

          {isProtocolExpanded && (
            <div className="flex h-full flex-col gap-2">
              {Object.values(SupportedProtocols)
                .filter((protocol) => protocol !== SupportedProtocols.COMET)
                .map((protocol) => (
                  <div
                    key={protocol}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#A0A3C4]/70 uppercase">
                        {protocol}
                      </span>
                      <ExternalLink size={12} className="text-gray-400" />
                    </div>

                    <ToggleButton
                      isActive={settings.protocols.includes(protocol)}
                      onClick={() => handleProtocolToggle(protocol)}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
