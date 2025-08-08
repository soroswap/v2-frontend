export const formatCurrency = (
  amount: string | number = 0,
  symbol = "USDS",
) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M ${symbol}`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K ${symbol}`;
  }
  return `$${num.toFixed(2)} ${symbol}`;
};
