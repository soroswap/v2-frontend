// Format with thousand separators while preserving decimal input
export const formatNumber = (value: string): string => {
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
