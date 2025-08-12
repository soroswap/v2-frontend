export const formatCurrency = (
  amount: string | number = 0,
  symbol = "USDS",
) => {
  // Convert to string and remove commas for parsing
  const cleanValue = String(amount).replace(/,/g, "");
  const num = typeof amount === "string" ? parseFloat(cleanValue) : amount;

  // Handle edge cases
  if (isNaN(num)) return `$0.00 ${symbol}`;
  if (num === 0) return `$0.00 ${symbol}`;

  // Trillions (T)
  if (num >= 1_000_000_000_000) {
    const trillions = num / 1_000_000_000_000;
    const formattedTrillions = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(trillions);
    return `$${formattedTrillions}T ${symbol}`;
  }

  // Billions (B)
  if (num >= 1_000_000_000) {
    const billions = num / 1_000_000_000;
    const formattedBillions = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(billions);
    return `$${formattedBillions}B ${symbol}`;
  }

  // Millions (M)
  if (num >= 1_000_000) {
    const millions = num / 1_000_000;
    const formattedMillions = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(millions);
    return `$${formattedMillions}M ${symbol}`;
  }

  // Thousands (K)
  if (num >= 1_000) {
    const thousands = num / 1_000;
    const formattedThousands = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(thousands);
    return `$${formattedThousands}K ${symbol}`;
  }

  // Small numbers (less than 1K)
  const formattedNum = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  return `$${formattedNum} ${symbol}`;
};
