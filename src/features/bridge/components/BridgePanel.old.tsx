"use client";

import { TokenAmountInput } from "@/features/swap/TokenAmountInput";
import { PricePanel } from "@/features/swap/PricePanel";
import { BridgeChainDisplay } from "./BridgeChainDisplay";
import { AssetInfo } from "@soroswap/sdk";
import { cn } from "@/shared/lib/utils/cn";

/* -------------------------------------------------------------------------- */
/*                                Components                                  */
/* -------------------------------------------------------------------------- */
/** Generic panel used for both "From" & "To" */
export const BridgePanel = ({
  label,
  amount,
  setAmount,
  variant = "default",
  chain,
  isLoading,
  token,
}: {
  label: string;
  amount: string | undefined;
  setAmount: (v: string | undefined) => void;
  variant?: "default" | "outline";
  chain: "stellar" | "base";
  isLoading: boolean;
  token: AssetInfo | null;
}) => {
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
        <p className="text-base font-medium text-[#A0A3C4]">{label}</p>
      </div>

      {/* Amount + chain */}
      <div className="flex max-h-[43.5px] items-end justify-between">
        <TokenAmountInput
          amount={amount}
          setAmount={setAmount}
          isLoading={isLoading}
          token={token}
        />

        <BridgeChainDisplay chain={chain} />
      </div>

      {/* USD helper */}
      <div className="flex items-end justify-between">
        <PricePanel isLoading={isLoading} token={token} amount={amount} />
      </div>
    </div>
  );
};

