/**
 * Converts a human-readable value (string) to the smallest unit (BigInt).
 * Example: parseUnits("1.5", 7) → 15000000n
 */
export const parseUnits = ({
  value,
  decimals = 7,
}: {
  value: string;
  decimals?: number;
}): bigint => {
  // separates integer and fractional parts
  const [wholePart, fractionPart = ""] = value.split(".");
  const factor = BigInt(10) ** BigInt(decimals);

  // bigInt of integer part: whole * 10^decimals
  const wholeBI = BigInt(wholePart) * factor;

  // fraction padded/truncated with trailing zeros
  const padded = (fractionPart + "0".repeat(decimals)).slice(0, decimals);
  const fractionBI = BigInt(padded);

  return wholeBI + fractionBI;
};

/**
 * Converts from smallest unit (BigInt) to readable string.
 * Example: formatUnits(15000000n, 7) → "1.5"
 */
export const formatUnits = ({
  value,
  decimals = 7,
}: {
  value: bigint | number | string;
  decimals?: number;
}): string => {
  const bigIntValue = BigInt(value);
  const factor = BigInt(10) ** BigInt(decimals);

  const wholePart = bigIntValue / factor;
  const fractionPart = (bigIntValue % factor)
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, ""); // remove trailing zeros

  // if there's no fractional part (or only zeros remain), return just the integer part
  return fractionPart
    ? `${wholePart.toString()}.${fractionPart}`
    : wholePart.toString();
};
