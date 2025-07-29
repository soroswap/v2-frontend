"use client";

import { AssetInfo } from "@soroswap/sdk";

export const TokenAmountInput = ({
  amount,
  setAmount,
  isLoading,
  token,
}: {
  amount: string | undefined;
  setAmount: (v: string | undefined) => void;
  isLoading: boolean;
  token: AssetInfo | null | undefined;
}) => {
  // Format with thousand separators while preserving decimal input
  const formatNumber = (value: string): string => {
    if (!value || value === "") return "";

    // Check if has decimal point
    const hasDecimal = value.includes(".");

    if (hasDecimal) {
      const [integerPart, decimalPart] = value.split(".");

      // Preserve typing state like "0." or "123."
      if (decimalPart === undefined || decimalPart === "") {
        if (integerPart === "" || integerPart === "0") return value;
        const formattedValue =
          new Intl.NumberFormat("en-US").format(parseInt(integerPart)) + ".";
        return formattedValue;
      }

      // Format: "1234.56" -> "1,234.56"
      if (integerPart === "" || integerPart === "0") {
        return `0.${decimalPart}`;
      }

      const formattedInteger = new Intl.NumberFormat("en-US").format(
        parseInt(integerPart),
      );
      return `${formattedInteger}.${decimalPart}`;
    }

    // No decimal - format normally: "1234" -> "1,234"
    const num = parseInt(value);
    if (isNaN(num)) return "";

    return new Intl.NumberFormat("en-US").format(num);
  };

  // Remove all non-numeric characters except decimal point
  const cleanValue = (value: string): string => {
    return value.replace(/[^\d.]/g, "");
  };

  return (
    <input
      className="hide-number-spin text-primary w-full bg-transparent text-3xl leading-none font-bold outline-none"
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
      readOnly={isLoading}
      disabled={!token}
    />
  );
};
