"use client";

import { TokenSelector } from "@/components/swap/TokenSelector";
import { TokenType } from "@/components/shared/types/token";
import { cn } from "@/lib/utils/cn";
import { PricePanel } from "@/components/swap/PricePanel";
import { TokenAmountInput } from "@/components/swap/TokenAmountInput";

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
  onSelectToken?: (token: TokenType | null) => void;
  isLoading: boolean;
  currentToken: TokenType | null;
  oppositeToken: TokenType | null;
}) => {
  const token = currentToken;

  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        variant === "outline"
          ? "border-[#cfffd966] bg-transparent"
          : "border-[#23243a] bg-[#10121A]",
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
