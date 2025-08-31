/**
 * BigInt replacer function to convert BigInt values to strings
 */
export const bigIntReplacer = (key: string, value: unknown): unknown => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
};
