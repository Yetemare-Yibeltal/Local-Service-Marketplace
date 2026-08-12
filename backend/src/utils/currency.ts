// ============================================================
// CURRENCY HELPERS
// Complete currency utility functions for the application
// ============================================================

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Currency codes supported
 */
export const CURRENCIES = {
  ETB: "ETB",
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
  AED: "AED",
  CNY: "CNY",
  INR: "INR",
  JPY: "JPY",
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

/**
 * Currency symbols
 */
export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  ETB: "Br",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  CNY: "¥",
  INR: "₹",
  JPY: "¥",
};

/**
 * Currency decimal places
 */
export const CURRENCY_DECIMALS: Record<CurrencyCode, number> = {
  ETB: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  AED: 2,
  CNY: 2,
  INR: 2,
  JPY: 0,
};

/**
 * Currency exchange rates (base: ETB) - approximate values
 * In production, these should be fetched from an external API
 */
export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  ETB: 1,
  USD: 55.0,
  EUR: 60.0,
  GBP: 70.0,
  AED: 15.0,
  CNY: 7.6,
  INR: 0.66,
  JPY: 0.38,
};

// ============================================================
// FORMATTING FUNCTIONS
// ============================================================

/**
 * Format amount with currency
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "ETB",
  locale: string = "en-US",
): string {
  try {
    if (!isValidAmount(amount)) {
      return `${getCurrencySymbol(currency)}0.00`;
    }

    const decimals = CURRENCY_DECIMALS[currency] || 2;
    const symbol = CURRENCY_SYMBOLS[currency] || currency;

    // Use Intl.NumberFormat for proper formatting
    if (locale) {
      const formatter = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      return formatter.format(amount);
    }

    // Fallback formatting
    const formatted = amount.toFixed(decimals);
    return `${symbol} ${formatted}`;
  } catch (error) {
    console.error("Currency formatting error:", error);
    return `${amount.toFixed(2)}`;
  }
}

/**
 * Format amount with Ethiopian Birr
 */
export function formatETB(amount: number, locale: string = "en-US"): string {
  return formatCurrency(amount, "ETB", locale);
}

/**
 * Format amount with USD
 */
export function formatUSD(amount: number, locale: string = "en-US"): string {
  return formatCurrency(amount, "USD", locale);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Get currency decimal places
 */
export function getCurrencyDecimals(currency: CurrencyCode): number {
  return CURRENCY_DECIMALS[currency] || 2;
}

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Check if amount is valid
 */
export function isValidAmount(amount: any): boolean {
  if (typeof amount !== "number") return false;
  if (isNaN(amount)) return false;
  if (!isFinite(amount)) return false;
  if (amount < 0) return false;
  return true;
}

/**
 * Validate currency code
 */
export function isValidCurrency(currency: string): currency is CurrencyCode {
  return Object.values(CURRENCIES).includes(currency as any);
}

/**
 * Validate amount range
 */
export function isValidAmountRange(
  amount: number,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER,
): boolean {
  if (!isValidAmount(amount)) return false;
  return amount >= min && amount <= max;
}

// ============================================================
// CONVERSION FUNCTIONS
// ============================================================

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rates: Record<CurrencyCode, number> = EXCHANGE_RATES,
): number {
  if (!isValidAmount(amount)) {
    throw new Error("Invalid amount");
  }

  if (!isValidCurrency(fromCurrency) || !isValidCurrency(toCurrency)) {
    throw new Error("Invalid currency");
  }

  // Same currency
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];

  if (!fromRate || !toRate) {
    throw new Error("Exchange rate not available");
  }

  // Convert to base currency (ETB) first
  const baseAmount = amount * fromRate;

  // Convert from base to target currency
  return baseAmount / toRate;
}

/**
 * Convert amount from ETB to other currency
 */
export function fromETB(amount: number, toCurrency: CurrencyCode): number {
  return convertCurrency(amount, "ETB", toCurrency);
}

/**
 * Convert amount from other currency to ETB
 */
export function toETB(amount: number, fromCurrency: CurrencyCode): number {
  return convertCurrency(amount, fromCurrency, "ETB");
}

// ============================================================
// ROUNDING FUNCTIONS
// ============================================================

/**
 * Round amount to currency decimal places
 */
export function roundCurrency(
  amount: number,
  currency: CurrencyCode = "ETB",
): number {
  const decimals = CURRENCY_DECIMALS[currency] || 2;
  const factor = Math.pow(10, decimals);
  return Math.round(amount * factor) / factor;
}

/**
 * Round to nearest Ethiopian Birr
 */
export function roundETB(amount: number): number {
  return roundCurrency(amount, "ETB");
}

/**
 * Ceiling to currency decimal places
 */
export function ceilCurrency(
  amount: number,
  currency: CurrencyCode = "ETB",
): number {
  const decimals = CURRENCY_DECIMALS[currency] || 2;
  const factor = Math.pow(10, decimals);
  return Math.ceil(amount * factor) / factor;
}

/**
 * Floor to currency decimal places
 */
export function floorCurrency(
  amount: number,
  currency: CurrencyCode = "ETB",
): number {
  const decimals = CURRENCY_DECIMALS[currency] || 2;
  const factor = Math.pow(10, decimals);
  return Math.floor(amount * factor) / factor;
}

// ============================================================
// OPERATION FUNCTIONS
// ============================================================

/**
 * Add amounts safely
 */
export function addAmounts(...amounts: number[]): number {
  return amounts.reduce((sum, amount) => {
    if (!isValidAmount(amount)) {
      throw new Error(`Invalid amount: ${amount}`);
    }
    return sum + amount;
  }, 0);
}

/**
 * Subtract amounts safely
 */
export function subtractAmounts(a: number, b: number): number {
  if (!isValidAmount(a) || !isValidAmount(b)) {
    throw new Error("Invalid amount");
  }
  return a - b;
}

/**
 * Multiply amount
 */
export function multiplyAmount(amount: number, multiplier: number): number {
  if (!isValidAmount(amount)) {
    throw new Error("Invalid amount");
  }
  if (!isValidAmount(multiplier)) {
    throw new Error("Invalid multiplier");
  }
  return amount * multiplier;
}

/**
 * Divide amount
 */
export function divideAmount(amount: number, divisor: number): number {
  if (!isValidAmount(amount)) {
    throw new Error("Invalid amount");
  }
  if (!isValidAmount(divisor) || divisor === 0) {
    throw new Error("Invalid divisor");
  }
  return amount / divisor;
}

/**
 * Calculate percentage of amount
 */
export function calculatePercentage(
  amount: number,
  percentage: number,
): number {
  if (!isValidAmount(amount)) {
    throw new Error("Invalid amount");
  }
  if (!isValidAmount(percentage)) {
    throw new Error("Invalid percentage");
  }
  return (amount * percentage) / 100;
}

// ============================================================
// COMPARISON FUNCTIONS
// ============================================================

/**
 * Compare amounts with tolerance
 */
export function amountsEqual(
  a: number,
  b: number,
  tolerance: number = 0.01,
): boolean {
  if (!isValidAmount(a) || !isValidAmount(b)) return false;
  return Math.abs(a - b) < tolerance;
}

/**
 * Check if amount is greater than another
 */
export function amountGreaterThan(
  a: number,
  b: number,
  tolerance: number = 0.01,
): boolean {
  if (!isValidAmount(a) || !isValidAmount(b)) return false;
  return a - b > tolerance;
}

/**
 * Check if amount is less than another
 */
export function amountLessThan(
  a: number,
  b: number,
  tolerance: number = 0.01,
): boolean {
  if (!isValidAmount(a) || !isValidAmount(b)) return false;
  return b - a > tolerance;
}

// ============================================================
// DISPLAY HELPERS
// ============================================================

/**
 * Format amount as string with thousand separators
 */
export function formatNumberWithCommas(amount: number): string {
  if (!isValidAmount(amount)) return "0";
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Format amount for display with currency and commas
 */
export function formatCurrencyDisplay(
  amount: number,
  currency: CurrencyCode = "ETB",
): string {
  const formatted = formatETB(amount);
  const symbol = getCurrencySymbol(currency);
  // Remove symbol and add it back with proper spacing
  const numeric = amount.toFixed(CURRENCY_DECIMALS[currency] || 2);
  return `${symbol} ${formatNumberWithCommas(parseFloat(numeric))}`;
}

/**
 * Format amount as words (for invoices, receipts)
 */
export function amountToWords(amount: number): string {
  if (!isValidAmount(amount)) return "Zero";

  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "Ten",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const numToWords = (n: number): string => {
    if (n === 0) return "";
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10] || "";
    if (n < 100)
      return (
        tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "")
      );
    if (n < 1000) {
      return (
        units[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " and " + numToWords(n % 100) : "")
      );
    }
    if (n < 1000000) {
      return (
        numToWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + numToWords(n % 1000) : "")
      );
    }
    return "";
  };

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  let result = numToWords(integerPart) || "Zero";

  if (decimalPart > 0) {
    result += ` and ${decimalPart.toString().padStart(2, "0")}/100`;
  }

  return result;
}

// ============================================================
// TAX AND FEE FUNCTIONS
// ============================================================

/**
 * Calculate VAT (Value Added Tax)
 */
export function calculateVAT(amount: number, rate: number = 0.15): number {
  if (!isValidAmount(amount)) {
    throw new Error("Invalid amount");
  }
  if (rate < 0 || rate > 1) {
    throw new Error("Invalid VAT rate");
  }
  return amount * rate;
}

/**
 * Calculate price including VAT
 */
export function calculatePriceWithVAT(
  amount: number,
  rate: number = 0.15,
): number {
  return amount + calculateVAT(amount, rate);
}

/**
 * Calculate service fee
 */
export function calculateServiceFee(
  amount: number,
  rate: number = 0.05,
): number {
  if (!isValidAmount(amount)) {
    throw new Error("Invalid amount");
  }
  if (rate < 0 || rate > 1) {
    throw new Error("Invalid service fee rate");
  }
  return amount * rate;
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
  amount: number,
  discountPercent: number,
): number {
  if (!isValidAmount(amount)) {
    throw new Error("Invalid amount");
  }
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error("Invalid discount percentage");
  }
  return (amount * discountPercent) / 100;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Constants
  CURRENCIES,
  CURRENCY_SYMBOLS,
  CURRENCY_DECIMALS,
  EXCHANGE_RATES,

  // Formatting
  formatCurrency,
  formatETB,
  formatUSD,
  getCurrencySymbol,
  getCurrencyDecimals,

  // Validation
  isValidAmount,
  isValidCurrency,
  isValidAmountRange,

  // Conversion
  convertCurrency,
  fromETB,
  toETB,

  // Rounding
  roundCurrency,
  roundETB,
  ceilCurrency,
  floorCurrency,

  // Operations
  addAmounts,
  subtractAmounts,
  multiplyAmount,
  divideAmount,
  calculatePercentage,

  // Comparison
  amountsEqual,
  amountGreaterThan,
  amountLessThan,

  // Display
  formatNumberWithCommas,
  formatCurrencyDisplay,
  amountToWords,

  // Tax and Fees
  calculateVAT,
  calculatePriceWithVAT,
  calculateServiceFee,
  calculateDiscount,
};

