export const isDecimalInRange = (
  text: string,
  min: number,
  max: number,
  maxDecimals = 2,
): boolean => {
  // 1. Only numbers and decimal point, no more than one decimal point
  if (!/^\d*\.?\d*$/.test(text)) return false;

  // 2. Allow empty string while user is typing
  if (text === "") return true;

  // 3. Limit decimal places
  const [, decimals = ""] = text.split(".");
  if (decimals.length > maxDecimals) return false;

  // 4. Check numerical range
  const n = Number(text);
  return n >= min && n <= max;
};
