"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Info, ExternalLink } from "lucide-react";
import { Modal } from "@/components/shared/components/Modal";
import { cn } from "@/lib/utils/cn";

interface SwapSettings {
  slippageMode: "auto" | "custom";
  customSlippage: string;
  maxHops: number;
  protocols: {
    sdex: boolean;
    soroswap: boolean;
    phoenix: boolean;
    aqua: boolean;
  };
}

interface SwapSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SwapSettings;
  onSettingsChange: (settings: SwapSettings) => void;
}

export const SwapSettingsModal = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: SwapSettingsModalProps) => {
  const [isProtocolExpanded, setIsProtocolExpanded] = useState(true);

  const handleSlippageModeChange = (mode: "auto" | "custom") => {
    onSettingsChange({
      ...settings,
      slippageMode: mode,
      customSlippage: mode === "auto" ? "1" : settings.customSlippage,
    });
  };

  const handleCustomSlippageChange = (value: string) => {
    // Validate input: only numbers and decimal point, max 2 decimal places
    if (/^\d*\.?\d{0,2}$/.test(value) && parseFloat(value) <= 50) {
      onSettingsChange({
        ...settings,
        customSlippage: value,
      });
    }
  };

  const handleMaxHopsChange = (increment: boolean) => {
    const newHops = increment ? settings.maxHops + 1 : settings.maxHops - 1;
    if (newHops >= 1 && newHops <= 5) {
      onSettingsChange({
        ...settings,
        maxHops: newHops,
      });
    }
  };

  const handleProtocolToggle = (protocol: keyof SwapSettings["protocols"]) => {
    onSettingsChange({
      ...settings,
      protocols: {
        ...settings.protocols,
        [protocol]: !settings.protocols[protocol],
      },
    });
  };

  const protocolList = [
    { key: "sdex" as const, name: "SDEX", enabled: settings.protocols.sdex },
    {
      key: "soroswap" as const,
      name: "Soroswap",
      enabled: settings.protocols.soroswap,
    },
    {
      key: "phoenix" as const,
      name: "Phoenix",
      enabled: settings.protocols.phoenix,
    },
    { key: "aqua" as const, name: "Aqua", enabled: settings.protocols.aqua },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" className="mx-4">
      <div className="space-y-6">
        {/* Max Slippage */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-medium text-[#A0A3C4]">
              Max slippage
            </span>
            <Info size={14} className="text-gray-400" />
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-white">Auto</span>
              <ChevronDown size={16} className="text-gray-400" />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleSlippageModeChange("auto")}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                settings.slippageMode === "auto"
                  ? "bg-[#8866DD] text-white"
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
                  ? "bg-[#8866DD] text-white"
                  : "bg-[#23243a] text-gray-400 hover:bg-[#2a2b3f]",
              )}
            >
              Custom
            </button>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={
                  settings.slippageMode === "auto"
                    ? "1"
                    : settings.customSlippage
                }
                onChange={(e) => handleCustomSlippageChange(e.target.value)}
                disabled={settings.slippageMode === "auto"}
                className={cn(
                  "w-12 rounded-lg bg-[#23243a] px-2 py-2 text-center text-sm text-white outline-none",
                  settings.slippageMode === "auto" && "opacity-50",
                )}
                placeholder="1"
              />
              <span className="text-sm text-gray-400">%</span>
            </div>
          </div>
        </div>

        {/* Max Hops */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#A0A3C4]">
                Max Hops
              </span>
              <Info size={14} className="text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMaxHopsChange(false)}
                disabled={settings.maxHops <= 1}
                className="rounded-full bg-[#23243a] p-1 text-gray-400 transition-colors hover:bg-[#2a2b3f] disabled:opacity-50"
              >
                <ChevronDown size={14} />
              </button>
              <span className="w-8 text-center text-sm text-white">
                {settings.maxHops}
              </span>
              <button
                onClick={() => handleMaxHopsChange(true)}
                disabled={settings.maxHops >= 5}
                className="rounded-full bg-[#23243a] p-1 text-gray-400 transition-colors hover:bg-[#2a2b3f] disabled:opacity-50"
              >
                <ChevronUp size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Protocol */}
        <div>
          <button
            onClick={() => setIsProtocolExpanded(!isProtocolExpanded)}
            className="mb-3 flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#A0A3C4]">
                Protocol
              </span>
              <Info size={14} className="text-gray-400" />
            </div>
            {isProtocolExpanded ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </button>

          {isProtocolExpanded && (
            <div className="space-y-3">
              {protocolList.map(({ key, name, enabled }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{name}</span>
                    <ExternalLink size={12} className="text-gray-400" />
                  </div>
                  <button
                    onClick={() => handleProtocolToggle(key)}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      enabled ? "bg-[#8866DD]" : "bg-[#23243a]",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform",
                        enabled ? "translate-x-6" : "translate-x-1",
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
