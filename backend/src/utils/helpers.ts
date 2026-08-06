// ============================================================
// OBJECT HELPERS
// ============================================================

/**
 * Omit specified keys from an object
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
}

/**
 * Pick specified keys from an object
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue &&
        typeof sourceValue === "object" &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === "object" &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue) as any;
      } else {
        result[key] = sourceValue as any;
      }
    }
  }

  return result;
}

/**
 * Check if object is empty
 */
export function isEmptyObject(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Remove undefined and null values from object
 */
export function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== undefined && value !== null) {
        result[key] = value;
      }
    }
  }
  return result;
}

// ============================================================
// STRING HELPERS
// ============================================================

/**
 * Truncate string to specified length
 */
export function truncate(
  str: string,
  length: number,
  suffix: string = "...",
): string {
  if (!str) {
    return "";
  }
  if (str.length <= length) {
    return str;
  }
  return str.substring(0, length) + suffix;
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  if (!str) {
    return "";
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert string to title case
 */
export function toTitleCase(str: string): string {
  if (!str) {
    return "";
  }
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Generate slug from string
 */
export function generateSlug(str: string): string {
  if (!str) {
    return "";
  }
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Mask sensitive data (e.g., phone, email)
 */
export function maskString(
  str: string,
  visibleStart: number = 2,
  visibleEnd: number = 2,
): string {
  if (!str) {
    return "";
  }
  if (str.length <= visibleStart + visibleEnd) {
    return "*".repeat(str.length);
  }
  const start = str.substring(0, visibleStart);
  const end = str.substring(str.length - visibleEnd);
  const masked = "*".repeat(str.length - visibleStart - visibleEnd);
  return start + masked + end;
}

/**
 * Mask email address
 */
export function maskEmail(email: string): string {
  if (!email) {
    return "";
  }
  const parts = email.split("@");
  if (parts.length !== 2) {
    return maskString(email, 2, 2);
  }
  const maskedLocal = maskString(parts[0], 2, 2);
  return `${maskedLocal}@${parts[1]}`;
}

/**
 * Mask phone number
 */
export function maskPhone(phone: string): string {
  if (!phone) {
    return "";
  }
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.length <= 4) {
    return "*".repeat(cleaned.length);
  }
  const visibleStart = 2;
  const visibleEnd = 2;
  const start = cleaned.substring(0, visibleStart);
  const end = cleaned.substring(cleaned.length - visibleEnd);
  const masked = "*".repeat(cleaned.length - visibleStart - visibleEnd);
  return start + masked + end;
}

/**
 * Escape HTML characters
 */
export function escapeHtml(str: string): string {
  if (!str) {
    return "";
  }
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Unescape HTML characters
 */
export function unescapeHtml(str: string): string {
  if (!str) {
    return "";
  }
  const map: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#039;": "'",
  };
  return str.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, (m) => map[m]);
}

// ============================================================
// ARRAY HELPERS
// ============================================================

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  if (!Array.isArray(array)) {
    return [];
  }
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Get unique values from array
 */
export function uniqueArray<T>(array: T[]): T[] {
  if (!Array.isArray(array)) {
    return [];
  }
  return [...new Set(array)];
}

/**
 * Group array by key
 */
export function groupBy<T extends Record<string, any>>(
  array: T[],
  key: keyof T,
): Record<string, T[]> {
  if (!Array.isArray(array)) {
    return {};
  }
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>,
  );
}

/**
 * Shuffle array
 */
export function shuffleArray<T>(array: T[]): T[] {
  if (!Array.isArray(array)) {
    return [];
  }
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ============================================================
// NUMBER HELPERS
// ============================================================

/**
 * Format number with commas
 */
export function formatNumber(num: number, decimals: number = 0): string {
  if (typeof num !== "number" || isNaN(num)) {
    return "0";
  }
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Format currency
 */
export function formatCurrency(
  amount: number,
  currency: string = "ETB",
  locale: string = "en-US",
): string {
  if (typeof amount !== "number" || isNaN(amount)) {
    return `${currency} 0.00`;
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Random number between min and max
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Clamp number between min and max
 */
export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================
// DATE HELPERS
// ============================================================

/**
 * Format date to string
 */
export function formatDate(
  date: Date | string,
  format: string = "YYYY-MM-DD HH:mm:ss",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return "";
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return format
    .replace("YYYY", String(year))
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return "";
  }

  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

  const intervals: Record<string, number> = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const count = Math.floor(diff / seconds);
    if (count >= 1) {
      const plural = count > 1 ? "s" : "";
      return `${count} ${unit}${plural} ago`;
    }
  }

  return "Just now";
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return false;
  }
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

/**
 * Get start and end of day
 */
export function getDayRange(date: Date | string): { start: Date; end: Date } {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    const now = new Date();
    return {
      start: new Date(now.setHours(0, 0, 0, 0)),
      end: new Date(now.setHours(23, 59, 59, 999)),
    };
  }
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ============================================================
// ASYNC HELPERS
// ============================================================

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error("Retry failed");
}

/**
 * Timeout wrapper for async functions
 */
export function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 30000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    fn()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Execute async functions in sequence
 */
export async function sequence<T>(fns: (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = [];
  for (const fn of fns) {
    results.push(await fn());
  }
  return results;
}

// ============================================================
// TYPE CHECK HELPERS
// ============================================================

/**
 * Check if value is a string
 */
export function isString(value: any): value is string {
  return typeof value === "string";
}

/**
 * Check if value is a number
 */
export function isNumber(value: any): value is number {
  return typeof value === "number" && !isNaN(value);
}

/**
 * Check if value is a boolean
 */
export function isBoolean(value: any): value is boolean {
  return typeof value === "boolean";
}

/**
 * Check if value is a function
 */
export function isFunction(value: any): value is Function {
  return typeof value === "function";
}

/**
 * Check if value is null or undefined
 */
export function isNil(value: any): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Check if value is a valid date
 */
export function isValidDate(value: any): boolean {
  if (!(value instanceof Date)) {
    return false;
  }
  return !isNaN(value.getTime());
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  omit,
  pick,
  deepMerge,
  isEmptyObject,
  cleanObject,
  truncate,
  capitalize,
  toTitleCase,
  generateSlug,
  maskString,
  maskEmail,
  maskPhone,
  escapeHtml,
  unescapeHtml,
  chunkArray,
  uniqueArray,
  groupBy,
  shuffleArray,
  formatNumber,
  formatCurrency,
  randomNumber,
  clampNumber,
  formatDate,
  timeAgo,
  isToday,
  getDayRange,
  sleep,
  retry,
  withTimeout,
  sequence,
  isString,
  isNumber,
  isBoolean,
  isFunction,
  isNil,
  isValidDate,
};
