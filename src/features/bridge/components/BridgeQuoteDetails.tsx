"use client";

import { cn } from "@/shared/lib/utils/cn";
import { getChainName } from "@rozoai/intent-common";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

interface BridgeQuoteDetailsProps {
  amount: string | undefined;
  fromChain: number | null;
  toChain: number;
  fee: number;
  isTokenSwitched: boolean;
  destinationChainId: number;
  className?: string;
}

export const BridgeQuoteDetails = ({
  amount,
  fromChain,
  toChain,
  fee,
  isTokenSwitched,
  destinationChainId,
  className,
}: BridgeQuoteDetailsProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  if (!amount || parseFloat(amount) <= 0) {
    return null;
  }

  const conversionRate = 1; // 1:1 for USDC bridge

  // isTokenSwitched === false: Stellar Deposit (From Any Chains to Stellar)
  // isTokenSwitched === true: Stellar Withdraw (From Stellar to {Selected Chain})
  const isStellarDeposit = !isTokenSwitched;
  const isStellarWithdraw = isTokenSwitched;

  // Determine header text based on direction
  const headerText = isStellarDeposit
    ? "From Any Chains, To Stellar"
    : isStellarWithdraw
      ? `${amount} USDC From Stellar = ${amount} USDC ${getChainName(destinationChainId)}`
      : fromChain !== null
        ? `1 USDC on ${getChainName(fromChain)} = ${conversionRate.toFixed(6)} USDC on ${getChainName(toChain)}`
        : `1 USDC = ${conversionRate.toFixed(6)} USDC on ${getChainName(toChain)}`;

  const fromChainName = isStellarDeposit
    ? "Any Chains"
    : isStellarWithdraw
      ? "Stellar"
      : fromChain !== null
        ? getChainName(fromChain)
        : "Unknown";
  const toChainName = isStellarDeposit
    ? "Stellar"
    : isStellarWithdraw
      ? getChainName(destinationChainId)
      : getChainName(toChain);

  return (
    <div
      className={cn(
        "bg-surface overflow-hidden rounded-2xl border border-[#23243a]",
        className,
      )}
    >
      {/* Header - Always visible and clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-brand/5 flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors"
      >
        <p className="text-secondary text-sm">{headerText}</p>
        <div
          className={cn(
            "transition-transform duration-200",
            isOpen ? "rotate-180" : "rotate-0",
          )}
        >
          <ChevronDownIcon className="text-secondary size-4" />
        </div>
      </button>

      {/* Details - Smooth expansion that pushes content below */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96" : "max-h-0",
        )}
      >
        <div className="space-y-3 border-t border-[#23243a] p-4">
          {/* Bridge Amount */}
          <div className="flex items-center justify-between">
            <p className="text-secondary text-sm">Bridge Amount</p>
            <p className="text-primary text-sm">
              {new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              }).format(parseFloat(amount))}{" "}
              USDC
            </p>
          </div>

          {/* Fee */}
          <div className="flex items-center justify-between">
            <p className="text-secondary text-sm">Fee</p>
            <p className="text-primary text-sm">
              {new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              }).format(fee)}{" "}
              USDC
            </p>
          </div>

          {/* Expected Output */}
          <div className="flex items-center justify-between">
            <p className="text-secondary text-sm">Expected output</p>
            <p className="text-primary text-sm">
              {new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              }).format(parseFloat(amount) - fee)}{" "}
              USDC
            </p>
          </div>

          {/* Bridge Time */}
          <div className="flex items-center justify-between">
            <p className="text-secondary text-sm">Estimated time</p>
            <p className="text-primary text-sm">~1 minute</p>
          </div>

          {/* From Chain */}
          <div className="flex items-center justify-between">
            <p className="text-secondary text-sm">From</p>
            <p className="text-primary text-sm capitalize">{fromChainName}</p>
          </div>

          {/* To Chain */}
          <div className="flex items-center justify-between">
            <p className="text-secondary text-sm">To</p>
            <p className="text-primary text-sm capitalize">{toChainName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
