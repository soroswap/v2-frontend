"use client";

import { TokenAmountInput } from "@/features/swap/TokenAmountInput";
import { cn } from "@/shared/lib/utils/cn";
import { AssetInfo } from "@soroswap/sdk";
import { Loader2 } from "lucide-react";
import { IndependentField } from "../hooks/useBridgeController";
import { BridgeChainDisplay } from "./BridgeChainDisplay";
import { BridgePricePanel } from "./BridgePricePanel";

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
  isTokenSwitched,
  independentField,
}: {
  label: string;
  amount: string | undefined;
  setAmount: (v: string | undefined) => void;
  variant?: "default" | "outline";
  chain: "stellar" | "base";
  isLoading: boolean;
  token: AssetInfo | null;
  isTokenSwitched: boolean;
  independentField: IndependentField;
}) => {
  return (
    <div
      className={cn(
        "relative rounded-2xl border p-5",
        variant === "outline"
          ? "border-[#2e294a] dark:bg-transparent"
          : "border-[#23243a] bg-white dark:bg-[#10121A]",
      )}
    >
      {/* Panel header */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-base font-medium text-[#A0A3C4]">{label}</p>
        {isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-[#A0A3C4]">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Calculating...</span>
          </div>
        )}
      </div>

      {/* Amount + chain */}
      <div className="flex max-h-[43.5px] items-end justify-between">
        <TokenAmountInput
          amount={amount}
          setAmount={setAmount}
          isLoading={isLoading}
          token={token}
        />
      </div>

      {/* USD helper */}
      <div className="flex items-end justify-between">
        <BridgePricePanel amount={amount} />
      </div>

      <BridgeChainDisplay
        className="absolute top-2 right-2"
        isTokenSwitched={isTokenSwitched}
        independentField={independentField}
      />
    </div>
  );
};
