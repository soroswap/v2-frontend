"use client";

import { formatNumber } from "@/shared/lib/utils/formatNumber";
import { AssetInfo } from "@soroswap/sdk";
import { cn } from "@/shared/lib/utils";
import { useState } from "react";

export const TokenAmountInput = ({
  amount,
  setAmount,
  formattedAmount,
  isLoading,
  token,
  className,
  disabled,
}: {
  amount: string | undefined;
  setAmount: (v: string | undefined) => void;
  formattedAmount?: string;
  isLoading: boolean;
  token: AssetInfo | null | undefined;
  className?: string;
  disabled?: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Remove all non-numeric characters except decimal point
  const cleanValue = (value: string): string => {
    return value.replace(/[^\d.]/g, "");
  };

  return (
    <input
      className={cn(
        "hide-number-spin text-primary w-full bg-transparent text-3xl leading-none font-bold outline-none",
        className,
      )}
      type="text"
      value={
        isFocused
          ? amount ?? ""
          : formatNumber(formattedAmount ? formattedAmount : amount ? amount : "")
      }
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
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
      readOnly={isLoading}
      disabled={!token || disabled}
    />
  );
};