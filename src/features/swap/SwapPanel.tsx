"use client";

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
  const token = currentToken;

  const formatBalance = (bal: string): string => {
    const num = Number(bal);
    if (isNaN(num)) return "0";
    // Show up to 4 decimal places, remove trailing zeros
    return num.toLocaleString(undefined, {
      maximumFractionDigits: 4,
      minimumFractionDigits: 0,
    });
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        variant === "outline"
          ? "border-[#2e294a] dark:bg-transparent"
          : "border-[#23243a] bg-white dark:bg-[#10121A]",
      )}
    >
      {/* Panel header with balance display */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-base font-medium text-[#A0A3C4]">{label}</p>

        {/* Balance display */}
        {token && (
          <div className="flex items-center gap-2">
            {isBalanceLoading ? (
              <div className="h-4 w-20 animate-pulse rounded bg-gray-300/20" />
            ) : balance !== undefined ? (
              <p className="text-sm text-[#A0A3C4]">
                Balance: {formatBalance(balance)} {token.code}
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* Percentage buttons row - only shown for Sell panel */}
      {showPercentageButtons && balance && Number(balance) > 0 && (
        <div className="mb-3 flex gap-2">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => onPercentageClick?.(pct)}
              className="text-brand hover:bg-brand/10 rounded-lg border border-[#2e294a] px-2 py-1 text-xs font-medium transition-colors"
            >
              {pct === 100 ? "MAX" : `${pct}%`}
            </button>
          ))}
        </div>
      )}

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
        />
      </div>

      {/* USD helper */}
      <div className="flex items-end justify-between">
        <PricePanel isLoading={isLoading} token={token} amount={amount} />
      </div>
    </div>
  );
};
