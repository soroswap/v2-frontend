export const formatCurrency = (
  amount: string | number = 0,
  symbol = "USDS",
  prefix = "$",
) => {
  // Handle edge cases
  if (amount === 0 || amount === "0") return `${prefix}0.00 ${symbol}`;

  // Convert to number (amount should already be formatted)
  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(num)) return `${prefix}0.00 ${symbol}`;

  // Format based on magnitude with cleaner logic
  if (num >= 1e12) {
    return `${prefix}${(num / 1e12).toFixed(2)}T ${symbol}`;
  }

  if (num >= 1e9) {
    return `${prefix}${(num / 1e9).toFixed(2)}B ${symbol}`;
  }

  if (num >= 1e6) {
    return `${prefix}${(num / 1e6).toFixed(2)}M ${symbol}`;
  }

  if (num >= 1e3) {
    return `${prefix}${(num / 1e3).toFixed(2)}K ${symbol}`;
  }

  // Small numbers
  return `${prefix}${num.toFixed(2)} ${symbol}`;
};
