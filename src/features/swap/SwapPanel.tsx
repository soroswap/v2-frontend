"use client";

import { TokenSelector } from "@/features/swap/TokenSelector";
import { AssetInfo } from "@soroswap/sdk";
import { cn } from "@/shared/lib/utils/cn";
import { PricePanel } from "@/features/swap/PricePanel";
import { TokenAmountInput } from "@/features/swap/TokenAmountInput";

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
}: {
  label: string;
  amount: string | undefined;
  setAmount: (v: string | undefined) => void;
  variant?: "default" | "outline";
  onSelectToken?: (token: AssetInfo | null) => void;
  isLoading: boolean;
  currentToken: AssetInfo | null;
  oppositeToken: AssetInfo | null;
}) => {
  const token = currentToken;

  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        variant === "outline"
          ? "border-[#2e294a] dark:bg-transparent"
          : "border-[#23243a] bg-white dark:bg-[#10121A]",
      )}
    >
      {/* Panel header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-base font-medium text-[#A0A3C4]">{label}</span>
        {/* 25% / 50% / MAX controls could live here later */}
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
        />
      </div>

      {/* USD helper */}
      <div className="flex items-end justify-between">
        <PricePanel isLoading={isLoading} token={token} amount={amount} />
      </div>
    </div>
  );
};
