"use client";

import { TokenSelector } from "@/components/swap/TokenSelector";
import { TokenType } from "@/components/shared/types/token";
import { cn } from "@/lib/utils/cn";
import { useTokenPrice } from "@/hooks/useTokenPrice";

/* -------------------------------------------------------------------------- */
/*                                Components                                  */
/* -------------------------------------------------------------------------- */
/** Generic panel used for both "Sell" & "Buy" */
export const SwapPanel = ({
  label,
  amount,
  setAmount,
  token,
  variant = "default",
  onSelectToken,
  isLoading,
}: {
  label: string;
  amount: string | undefined;
  setAmount: (v: string | undefined) => void;
  token?: TokenType | null;
  variant?: "default" | "outline";
  onSelectToken?: (token: TokenType | null) => void;
  isLoading: boolean;
}) => {
  const { price } = useTokenPrice(token?.contract ?? null);

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
        <input
          className="hide-number-spin w-full bg-transparent text-3xl leading-none font-bold text-white outline-none sm:text-4xl"
          type="text"
          value={amount !== undefined ? String(amount) : ""}
          onChange={(e) => {
            const value = e.target.value;

            // Allow only numbers and decimal point
            if (value === "" || /^\d*\.?\d*$/.test(value)) {
              if (value === "") {
                setAmount(undefined);
              } else {
                // Store as string to preserve typing state (like "0." while typing "0.5")
                setAmount(value);
              }
            }
          }}
          placeholder="0"
          readOnly={isLoading}
          disabled={!token}
        />

        <TokenSelector
          token={token}
          placeholder="Select token"
          onSelect={onSelectToken}
        />
      </div>

      {/* USD helper */}
      <div className="flex items-end justify-between">
        <div className="mt-1 h-5 min-w-20 text-base text-[#A0A3C4] sm:text-lg">
          {isLoading || price === null ? (
            <div className="skeleton h-full w-20" />
          ) : (
            <span className="flex h-full items-center">
              {`$${Number(price * (Number(amount) || 0)).toFixed(2)}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
