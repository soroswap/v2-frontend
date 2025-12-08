"use client";

import { TokenIcon } from "@/shared/components";
import { cn } from "@/shared/lib/utils/cn";
import {
  base,
  getChainById,
  rozoStellar,
  solana,
  supportedPayoutTokens,
  TokenLogo,
} from "@rozoai/intent-common";
import { Check, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { chainToLogo } from "./BridgeChainStacked";

interface BridgeChainSelectorProps {
  value: number;
  onChange: (chainId: number) => void;
  className?: string;
}

// Supported chains (excluding Stellar and Solana)
export const supportedPayoutChains = Array.from(supportedPayoutTokens.entries())
  .filter(
    ([chainId]) => ![rozoStellar.chainId, solana.chainId].includes(chainId),
  )
  .map(([chainId]) => getChainById(chainId));

export const BridgeChainSelector = ({
  value,
  onChange,
  className,
}: BridgeChainSelectorProps) => {
  const [open, setOpen] = useState(false);

  const selectedChain = useMemo(() => {
    return supportedPayoutChains.find((c) => c.chainId === value) || base;
  }, [value]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "border-surface-alt bg-surface-alt text-primary flex h-[33.5px] min-w-fit cursor-pointer items-center gap-2 rounded-full border px-1.5 py-1.5 text-xs font-bold whitespace-nowrap sm:h-[43.5px] sm:text-sm",
          className,
        )}
      >
        <TokenIcon
          src={TokenLogo.USDC}
          alt="USDC"
          name="USDC"
          code="USDC"
          className="z-10 size-5 bg-transparent sm:size-6"
        />
        <p className="text-primary text-xs font-bold sm:text-sm">USDC</p>
        <span className="text-secondary text-xs">on</span>
        <div className="flex size-5 items-center justify-center overflow-hidden rounded-full sm:size-6">
          {chainToLogo[selectedChain.chainId]}
        </div>
        <ChevronDown className="size-4" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown Content */}
          <div className="bg-surface-page border-brand absolute top-full left-0 z-50 mt-2 w-52 rounded-2xl border p-1 shadow-xl">
            <div className="flex flex-col gap-0.5">
              {supportedPayoutChains.map((chain) => (
                <button
                  key={chain.chainId}
                  onClick={() => {
                    onChange(chain.chainId);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                    "hover:bg-surface-hover transition-colors",
                    selectedChain.chainId === chain.chainId &&
                      "bg-surface-hover",
                  )}
                >
                  <div className="border-surface-alt flex size-5 items-center justify-center overflow-hidden rounded-full border">
                    {chainToLogo[chain.chainId]}
                  </div>
                  <span className="text-primary flex-1 text-left">
                    {chain.name}
                  </span>
                  {selectedChain.chainId === chain.chainId && (
                    <Check className="text-brand size-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
