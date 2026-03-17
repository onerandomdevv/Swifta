/**
 * JSON replacer to handle BigInt serialization
 */
export const bigIntReplacer = (key: string, value: any) => {
  return typeof value === "bigint" ? value.toString() : value;
};

/**
 * JSON reviver to handle BigInt deserialization from strings matching Kobo fields
 */
export const bigIntReviver = (key: string, value: any) => {
  if (typeof value === "string" && key.toLowerCase().endsWith("kobo")) {
    try {
      return BigInt(value);
    } catch {
      return value;
    }
  }
  return value;
};

/**
 * Simple utility to mask NIN numbers for display
 */
export const maskNin = (nin?: string): string => {
  if (!nin) return "";
  if (nin.length < 4) return nin;
  return nin.slice(0, 2) + "*".repeat(nin.length - 4) + nin.slice(-2);
};
