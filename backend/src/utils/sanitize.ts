// ============================================================
// SANITIZE HELPERS
// Complete sanitization utility functions for the application
// ============================================================

// ============================================================
// TYPES
// ============================================================

/**
 * Sanitization options
 */
export interface SanitizeOptions {
  trim?: boolean;
  lowerCase?: boolean;
  upperCase?: boolean;
  escapeHtml?: boolean;
  stripTags?: boolean;
  allowSpaces?: boolean;
  allowedCharacters?: string;
  maxLength?: number;
  minLength?: number;
}

/**
 * HTML sanitization options
 */
export interface HtmlSanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripComments?: boolean;
  stripScripts?: boolean;
}

/**
 * Email sanitization options
 */
export interface EmailSanitizeOptions {
  normalize?: boolean;
  lowerCase?: boolean;
  trim?: boolean;
}

/**
 * Phone sanitization options
 */
export interface PhoneSanitizeOptions {
  format?: "e164" | "national" | "international";
  countryCode?: string;
  trim?: boolean;
}

// ============================================================
// STRING SANITIZATION
// ============================================================

/**
 * Sanitize a string with options
 */
export function sanitizeString(
  input: string,
  options: SanitizeOptions = {},
): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  let result = input;

  // Trim
  if (options.trim !== false) {
    result = result.trim();
  }

  // Lower case
  if (options.lowerCase) {
    result = result.toLowerCase();
  }

  // Upper case
  if (options.upperCase) {
    result = result.toUpperCase();
  }

  // Strip HTML tags
  if (options.stripTags) {
    result = stripHtmlTags(result);
  }

  // Escape HTML
  if (options.escapeHtml) {
    result = escapeHtml(result);
  }

  // Remove spaces if not allowed
  if (options.allowSpaces === false) {
    result = result.replace(/\s/g, "");
  }

  // Filter allowed characters
  if (options.allowedCharacters) {
    const regex = new RegExp(`[^${options.allowedCharacters}]`, "g");
    result = result.replace(regex, "");
  }

  // Enforce max length
  if (options.maxLength && result.length > options.maxLength) {
    result = result.substring(0, options.maxLength);
  }

  return result;
}

/**
 * Trim all fields in an object
 */
export function trimObjectFields<T extends Record<string, any>>(
  obj: T,
  fields?: string[],
): T {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const result = { ...obj };
  const keys = fields || Object.keys(result);

  for (const key of keys) {
    if (typeof result[key] === "string") {
      result[key] = result[key].trim();
    }
  }

  return result;
}

/**
 * Strip HTML tags from a string
 */
export function stripHtmlTags(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Remove extra whitespace
 */
export function normalizeWhitespace(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }
  return input.replace(/\s+/g, " ").trim();
}

/**
 * Remove line breaks
 */
export function removeLineBreaks(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }
  return input.replace(/[\r\n]+/g, " ");
}

// ============================================================
// HTML SANITIZATION
// ============================================================

/**
 * Escape HTML special characters
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return input.replace(/[&<>"'/]/g, (match) => map[match]);
}

/**
 * Unescape HTML entities
 */
export function unescapeHtml(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  const map: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#x27;": "'",
    "&#x2F;": "/",
  };

  return input.replace(
    /&amp;|&lt;|&gt;|&quot;|&#x27;|&#x2F;/g,
    (match) => map[match],
  );
}

/**
 * Sanitize HTML content (basic)
 */
export function sanitizeHtml(
  input: string,
  options: HtmlSanitizeOptions = {},
): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  let result = input;

  // Default allowed tags (basic)
  const allowedTags = options.allowedTags || [
    "p",
    "br",
    "b",
    "i",
    "u",
    "strong",
    "em",
    "a",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "code",
    "pre",
    "span",
    "div",
  ];

  const allowedAttributes = options.allowedAttributes || [
    "href",
    "title",
    "class",
    "id",
    "style",
  ];

  // Strip comments
  if (options.stripComments !== false) {
    result = result.replace(/<!--[\s\S]*?-->/g, "");
  }

  // Strip scripts
  if (options.stripScripts !== false) {
    result = result.replace(/<script[\s\S]*?<\/script>/gi, "");
    result = result.replace(/javascript:/gi, "");
    result = result.replace(/on\w+\s*=/gi, "");
  }

  // Strip tags not in allowed list
  const tagRegex = /<(\/?)(\w+)([^>]*)>/g;
  result = result.replace(tagRegex, (match, closing, tagName, attrs) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // Strip attributes not in allowed list
      if (attrs) {
        const attrRegex = /(\w+)\s*=\s*["']([^"']*)["']/g;
        let cleanedAttrs = "";
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrs)) !== null) {
          const attrName = attrMatch[1];
          if (allowedAttributes.includes(attrName.toLowerCase())) {
            cleanedAttrs += ` ${attrMatch[0]}`;
          }
        }
        return `<${closing}${tagName}${cleanedAttrs}>`;
      }
      return match;
    }
    return "";
  });

  return result;
}

// ============================================================
// EMAIL SANITIZATION
// ============================================================

/**
 * Sanitize email address
 */
export function sanitizeEmail(
  input: string,
  options: EmailSanitizeOptions = {},
): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  let result = input.trim();

  if (options.lowerCase !== false) {
    result = result.toLowerCase();
  }

  // Remove spaces
  result = result.replace(/\s/g, "");

  // Normalize domain (remove trailing dots, etc.)
  if (options.normalize !== false) {
    const parts = result.split("@");
    if (parts.length === 2) {
      const local = parts[0];
      let domain = parts[1];

      // Remove trailing dots
      domain = domain.replace(/\.+$/, "");

      // Normalize domain
      domain = domain.toLowerCase();

      result = `${local}@${domain}`;
    }
  }

  // Remove invalid characters (keep only valid email chars)
  result = result.replace(/[^a-zA-Z0-9._%+-@]/g, "");

  return result;
}

/**
 * Normalize email domain
 */
export function normalizeEmailDomain(domain: string): string {
  if (!domain || typeof domain !== "string") {
    return "";
  }

  // Handle Gmail aliases
  const gmailDomains = ["gmail.com", "googlemail.com"];
  const lowerDomain = domain.toLowerCase();

  if (gmailDomains.includes(lowerDomain)) {
    return "gmail.com";
  }

  return lowerDomain;
}

// ============================================================
// PHONE SANITIZATION
// ============================================================

/**
 * Sanitize phone number
 */
export function sanitizePhone(
  input: string,
  options: PhoneSanitizeOptions = {},
): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Remove all non-digit characters except plus sign
  let result = input.replace(/[^0-9+]/g, "");

  // If it starts with 0 and country code provided, replace with country code
  if (options.countryCode && result.startsWith("0")) {
    result = options.countryCode + result.substring(1);
  }

  // If no plus sign and starts with digits, add plus if it looks like a country code
  if (!result.startsWith("+") && /^\d{7,15}$/.test(result)) {
    // If it has country code in options, use it
    if (options.countryCode) {
      // Remove leading zeros
      result = result.replace(/^0+/, "");
      // Add country code if not already there
      if (!result.startsWith(options.countryCode.replace("+", ""))) {
        result = options.countryCode + result;
      }
    } else {
      // Check if it's Ethiopian format (09XXXXXXXX)
      if (/^09\d{8}$/.test(result)) {
        result = "+251" + result.substring(1);
      } else if (/^9\d{8}$/.test(result)) {
        result = "+251" + result;
      }
    }
  }

  // Format if requested
  if (options.format === "e164") {
    // E.164 format: +<country><national number>
    if (result.startsWith("+")) {
      // Already valid
    } else {
      // Try to format with country code
      if (options.countryCode) {
        const clean = result.replace(/^0+/, "");
        result = options.countryCode + clean;
      }
    }
  }

  // Trim spaces (none should remain)
  result = result.replace(/\s/g, "");

  return result;
}

/**
 * Format phone number for display
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone || typeof phone !== "string") {
    return "";
  }

  // Clean the number
  const cleaned = phone.replace(/\D/g, "");

  // Ethiopian format: 0912345678 -> 0912 34 56 78
  if (cleaned.startsWith("09") && cleaned.length === 10) {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`;
  }

  // Ethiopian with country code: 251912345678 -> +251 912 34 56 78
  if (cleaned.startsWith("251") && cleaned.length === 12) {
    return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)} ${cleaned.substring(10, 12)}`;
  }

  // Default: just return with spaces every 3 digits
  return phone.replace(/(\d{3})(?=\d)/g, "$1 ");
}

// ============================================================
// INPUT CLEANING
// ============================================================

/**
 * Clean object by removing empty values
 */
export function cleanObject<T extends Record<string, any>>(
  obj: T,
  options: {
    removeEmptyStrings?: boolean;
    removeNull?: boolean;
    removeUndefined?: boolean;
  } = {},
): Partial<T> {
  const {
    removeEmptyStrings = true,
    removeNull = true,
    removeUndefined = true,
  } = options;

  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (removeUndefined && value === undefined) continue;
    if (removeNull && value === null) continue;
    if (removeEmptyStrings && value === "") continue;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const cleaned = cleanObject(value, options);
      if (Object.keys(cleaned).length > 0) {
        result[key as keyof T] = cleaned as any;
      }
    } else {
      result[key as keyof T] = value;
    }
  }

  return result;
}

/**
 * Remove duplicates from array
 */
export function uniqueArray<T>(array: T[]): T[] {
  if (!Array.isArray(array)) {
    return [];
  }
  return [...new Set(array)];
}

/**
 * Normalize text (remove extra spaces, normalize case)
 */
export function normalizeText(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return input
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "")
    .toLowerCase();
}

/**
 * Slugify a string
 */
export function slugify(input: string, separator: string = "-"): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, separator)
    .replace(/^-+|-+$/g, "");
}

/**
 * Truncate string with ellipsis
 */
export function truncate(
  input: string,
  maxLength: number,
  ellipsis: string = "...",
): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  if (input.length <= maxLength) {
    return input;
  }

  return input.substring(0, maxLength) + ellipsis;
}

// ============================================================
// XSS PREVENTION
// ============================================================

/**
 * Basic XSS prevention
 */
export function preventXSS(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return escapeHtml(input)
    .replace(/\n/g, "<br>")
    .replace(/ {2,}/g, (match) => "&nbsp;".repeat(match.length));
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== "string") {
    return "";
  }

  const trimmed = url.trim();

  // Check for javascript: protocol
  if (/^javascript:/i.test(trimmed)) {
    return "";
  }

  // Check for data: protocol (allow only safe data types)
  if (/^data:/i.test(trimmed)) {
    if (
      !/^data:(image\/(jpeg|png|gif|webp|svg\+xml)|text\/plain|application\/json);base64,/.test(
        trimmed,
      )
    ) {
      return "";
    }
  }

  return trimmed;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Types
  SanitizeOptions,
  HtmlSanitizeOptions,
  EmailSanitizeOptions,
  PhoneSanitizeOptions,

  // String sanitization
  sanitizeString,
  trimObjectFields,
  stripHtmlTags,
  normalizeWhitespace,
  removeLineBreaks,

  // HTML sanitization
  escapeHtml,
  unescapeHtml,
  sanitizeHtml,

  // Email sanitization
  sanitizeEmail,
  normalizeEmailDomain,

  // Phone sanitization
  sanitizePhone,
  formatPhoneDisplay,

  // Input cleaning
  cleanObject,
  uniqueArray,
  normalizeText,
  slugify,
  truncate,

  // XSS prevention
  preventXSS,
  sanitizeUrl,
};
