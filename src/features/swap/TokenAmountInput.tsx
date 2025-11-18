"use client";

import { cn } from "@/shared/lib/utils";
import { formatNumber } from "@/shared/lib/utils/formatNumber";
import { AssetInfo } from "@soroswap/sdk";

export const TokenAmountInput = ({
  amount,
  setAmount,
  isLoading,
  token,
  className,
  disabled,
  readonly = false,
}: {
  amount: string | undefined;
  setAmount: (v: string | undefined) => void;
  isLoading: boolean;
  token: AssetInfo | null | undefined;
  className?: string;
  disabled?: boolean;
  readonly?: boolean;
}) => {
  // Remove all non-numeric characters except decimal point
  const cleanValue = (value: string): string => {
    return value.replace(/[^\d.]/g, "");
  };

  return (
    <input
      className={cn(
        "hide-number-spin text-primary w-full bg-transparent text-3xl leading-none font-bold outline-none transition-opacity",
        isLoading && "opacity-50",
        className,
      )}
      type="text"
      value={amount !== undefined ? formatNumber(amount) : ""}
      onChange={(e) => {
        const rawValue = cleanValue(e.target.value);

        // Allow only numbers and decimal point
        if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
          if (rawValue === "") {
            setAmount(undefined);
          } else {
            // Store as string to preserve typing state (like "0." while typing "0.5")
            setAmount(rawValue);
          }
        }
      }}
      placeholder="0"
      readOnly={isLoading || readonly}
      disabled={!token || disabled}
    />
  );
};
