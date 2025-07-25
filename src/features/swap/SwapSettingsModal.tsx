"use client";

import { useState } from "react";
import { ChevronDown, Info, ExternalLink, AlertTriangle } from "lucide-react";
import { Modal } from "@/shared/components/Modal";
import { cn } from "@/shared/lib/utils/cn";
import { ToggleButton } from "@/shared/components/buttons";
import { SupportedProtocols } from "@soroswap/sdk";
import { isDecimalInRange } from "@/shared/lib/utils/validators";
import { useSwapSettingsStore } from "@/contexts/store/swap-settings";
import { Tooltip } from "react-tooltip";

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

  const protocolInfo: Record<
    SupportedProtocols,
    { name: string; url: string }
  > = {
    [SupportedProtocols.SOROSWAP]: {
      name: "Soroswap",
      url: "https://docs.soroswap.finance/soroswap-aggregator/supported-amms",
    },
    [SupportedProtocols.PHOENIX]: {
      name: "Phoenix",
      url: "https://docs.soroswap.finance/soroswap-aggregator/supported-amms",
    },
    [SupportedProtocols.AQUA]: {
      name: "Aqua",
      url: "https://docs.soroswap.finance/soroswap-aggregator/supported-amms",
    },
    [SupportedProtocols.SDEX]: {
      name: "SDEX",
      url: "https://docs.soroswap.finance/soroswap-aggregator/supported-amms",
    },
  };

  const slippageNum = Number(settings.customSlippage);
  const slippageLevel =
    slippageNum >= 20 ? "veryHigh" : slippageNum >= 5 ? "high" : null;

  const slippageColor =
    slippageLevel === "veryHigh"
      ? "text-red-400"
      : slippageLevel === "high"
        ? "text-yellow-400"
        : "text-secondary";

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      className="px-4"
      title="Settings"
    >
      <div className="flex h-full flex-col gap-4">
        {/* Max Slippage */}
        <div className="flex h-full flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-secondary text-lg font-medium">
                Max slippage
              </span>
              <Info
                size={14}
                className="text-secondary"
                data-tooltip-id="max-slippage-tooltip"
              />
              <Tooltip id="max-slippage-tooltip">
                <div className="flex max-w-[350px] flex-col gap-2 text-sm text-white">
                  <p>
                    Your transaction will revert if the price changes
                    unfavorably by more than this percentage.
                  </p>
                </div>
              </Tooltip>
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
                  : "bg-surface text-secondary hover:bg-surface-hover",
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
                  : "bg-surface text-secondary hover:bg-surface-hover",
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
                  "bg-surface text-primary w-[70px] rounded-lg border border-transparent p-2 text-center text-sm outline-none",
                  settings.slippageMode === "auto" && "opacity-50",
                  slippageColor,
                )}
                placeholder="0"
              />
              <span
                className={cn(
                  "text-secondary pointer-events-none absolute inset-y-0 right-2 flex items-center text-sm",
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
              <span className="text-secondary text-lg font-medium">
                Protocols
              </span>
              <Info
                size={14}
                className="text-secondary"
                data-tooltip-id="protocols-tooltip"
              />
              <Tooltip id="protocols-tooltip">
                <div className="flex max-w-[350px] flex-col gap-2 text-sm text-white">
                  <p>
                    The protocols Soroswap.Finance will use to calculate the
                    most efficient path for your transaction.
                  </p>
                </div>
              </Tooltip>
            </div>
            <ChevronDown
              size={24}
              className={cn(
                "text-secondary transition-transform duration-500",
                isProtocolExpanded ? "rotate-180" : "rotate-0",
              )}
            />
          </button>

          {isProtocolExpanded && (
            <div className="flex h-full flex-col gap-2">
              {Object.values(SupportedProtocols).map((protocol) => (
                <div
                  key={protocol}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-secondary text-sm">
                      {protocolInfo[protocol].name}
                    </span>
                    <a
                      href={protocolInfo[protocol].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary hover:text-primary transition-colors"
                    >
                      <ExternalLink size={12} />
                    </a>
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
