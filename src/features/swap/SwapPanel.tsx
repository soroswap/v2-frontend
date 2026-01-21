"use client";

import { useState, useEffect } from "react";
import { TokenSelector } from "@/features/swap/TokenSelector";
import { AssetInfo } from "@soroswap/sdk";
import { cn } from "@/shared/lib/utils/cn";
import { PricePanel } from "@/features/swap/PricePanel";
import { TokenAmountInput } from "@/features/swap/TokenAmountInput";

interface SwapPanelProps {
  label: string;
  amount: string | undefined;
  setAmount: (v: string | undefined) => void;
  variant?: "default" | "outline";
  onSelectToken?: (token: AssetInfo | null) => void;
  isLoading: boolean;
  currentToken: AssetInfo | null;
  oppositeToken: AssetInfo | null;
  /** User's available balance for current token */
  balance?: string;
  /** Whether balance is currently loading */
  isBalanceLoading?: boolean;
  /** Show percentage buttons (25%, 50%, 75%, MAX) */
  showPercentageButtons?: boolean;
  /** Callback when percentage button is clicked */
  onPercentageClick?: (percentage: number) => void;
}

/* -------------------------------------------------------------------------- */
/*                                Components                                  */
/* -------------------------------------------------------------------------- */
/** Generic panel used for both "Sell" & "Buy" */
export const SwapPanel = ({
  label,
  amount,
  setAmount,
  variant = "default",
  onSelectToken,
  isLoading,
  currentToken,
  oppositeToken,
  balance,
  isBalanceLoading,
  showPercentageButtons = false,
  onPercentageClick,
}: SwapPanelProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [animationState, setAnimationState] = useState<
    "hidden" | "entering" | "leaving"
  >("hidden");
  const token = currentToken;

  const canShowButtons =
    showPercentageButtons && balance && Number(balance) > 0;

  useEffect(() => {
    if (isHovered && canShowButtons) {
      setAnimationState("entering");
    } else if (!isHovered && animationState === "entering") {
      setAnimationState("leaving");
      // Hide after exit animation completes (longest delay + animation duration)
      const exitDuration = 120 + 90; // 0.12s animation + 0.09s max delay
      const timer = setTimeout(() => setAnimationState("hidden"), exitDuration);
      return () => clearTimeout(timer);
    }
  }, [isHovered, canShowButtons, animationState]);

  const formatBalance = (bal: string): string => {
    const num = Number(bal);
    if (isNaN(num)) return "0";
    // Show up to 4 decimal places, remove trailing zeros
    return num.toLocaleString(undefined, {
      maximumFractionDigits: 4,
      minimumFractionDigits: 0,
    });
  };

  // Stagger delays: Max appears first (0ms), then 75%, 50%, 25%
  // Buttons render as [25, 50, 75, 100], so reverse the delay order
  const getAnimationDelay = (index: number, isEntering: boolean): string => {
    const reverseIndex = 3 - index; // 0->3, 1->2, 2->1, 3->0
    const delayStep = isEntering ? 40 : 30; // faster exit
    return `${reverseIndex * delayStep}ms`;
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "rounded-2xl border p-5",
        variant === "outline"
          ? "border-[#2e294a] dark:bg-transparent"
          : "border-[#23243a] bg-white dark:bg-[#10121A]",
      )}
    >
      {/* Header: Label + Percentage buttons (on hover) */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-base font-medium text-[#A0A3C4]">{label}</p>

        {/* Percentage buttons - staggered chain animation on hover */}
        {animationState !== "hidden" && canShowButtons && (
          <div className="flex gap-1.5">
            {[25, 50, 75, 100].map((pct, index) => (
              <button
                key={pct}
                type="button"
                onClick={() => onPercentageClick?.(pct)}
                style={{
                  animationDelay: getAnimationDelay(
                    index,
                    animationState === "entering",
                  ),
                }}
                className={cn(
                  "percentage-btn rounded-lg border px-2 py-0.5 text-xs font-medium transition-colors",
                  "border-brand/40 text-brand hover:border-brand hover:bg-brand/10",
                  animationState === "entering"
                    ? "percentage-btn-enter"
                    : "percentage-btn-exit",
                )}
              >
                {pct === 100 ? "Max" : `${pct}%`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Amount + token */}
      <div className="flex max-h-[43.5px] items-end justify-between">
        <TokenAmountInput
          amount={amount}
          setAmount={setAmount}
          isLoading={isLoading}
          token={token}
        />

        <TokenSelector
          currentToken={currentToken}
          oppositeToken={oppositeToken}
          onSelect={onSelectToken}
          onModalOpen={() => setIsHovered(false)}
        />
      </div>

      {/* Bottom row: USD price + Balance */}
      <div className="flex items-end justify-between">
        <PricePanel isLoading={isLoading} token={token} amount={amount} />

        {/* Balance display (bottom-right) */}
        {token && (
          <>
            {isBalanceLoading ? (
              <div className="h-4 w-20 animate-pulse rounded bg-gray-300/20" />
            ) : balance !== undefined ? (
              <p className="text-sm text-[#A0A3C4]">
                {formatBalance(balance)} {token.code}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};
