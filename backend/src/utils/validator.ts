// ============================================================
// VALIDATION UTILITIES
// ============================================================

/**
 * Regular expression patterns for validation
 */
export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^\+[1-9]\d{1,14}$/,
  ETHIOPIAN_PHONE: /^09\d{8}$/,
  PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};:'",.<>?/]).{8,72}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  OTP: /^[0-9]{6}$/,
  POSTAL_CODE: /^[0-9]{4,6}$/,
  LATITUDE: /^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,6}$/,
  LONGITUDE: /^-?(([1-9]?[0-9]|1[0-7][0-9])\.{1}\d{1,6}|180\.{1}0{1,6})$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  DATETIME: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
};

// ============================================================
// EMAIL VALIDATION
// ============================================================

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }
  return VALIDATION_PATTERNS.EMAIL.test(email.trim());
}

/**
 * Validate email and return error message
 */
export function validateEmail(email: string): {
  isValid: boolean;
  message?: string;
} {
  if (!email) {
    return { isValid: false, message: "Email is required" };
  }
  if (!isValidEmail(email)) {
    return { isValid: false, message: "Invalid email format" };
  }
  if (email.length > 255) {
    return { isValid: false, message: "Email exceeds maximum length" };
  }
  return { isValid: true };
}

// ============================================================
// PHONE VALIDATION
// ============================================================

/**
 * Validate international phone number (E.164 format)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") {
    return false;
  }
  return VALIDATION_PATTERNS.PHONE.test(phone.trim());
}

/**
 * Validate Ethiopian phone number
 */
export function isValidEthiopianPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") {
    return false;
  }
  return VALIDATION_PATTERNS.ETHIOPIAN_PHONE.test(phone.trim());
}

/**
 * Validate phone number (international or Ethiopian)
 */
export function isValidPhoneAny(phone: string): boolean {
  if (!phone || typeof phone !== "string") {
    return false;
  }
  const cleaned = phone.replace(/[^0-9+]/g, "");
  return isValidPhone(cleaned) || isValidEthiopianPhone(cleaned);
}

/**
 * Validate phone and return error message
 */
export function validatePhone(phone: string): {
  isValid: boolean;
  message?: string;
} {
  if (!phone) {
    return { isValid: false, message: "Phone number is required" };
  }
  if (!isValidPhoneAny(phone)) {
    return {
      isValid: false,
      message: "Invalid phone number format. Use +2519xxxxxxxx or 09xxxxxxxx",
    };
  }
  return { isValid: true };
}

/**
 * Format Ethiopian phone number to E.164 format
 */
export function formatPhoneToE164(phone: string): string {
  if (!phone) {
    return "";
  }
  let cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("09") && cleaned.length === 10) {
    cleaned = "+251" + cleaned.substring(1);
  }
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "+251" + cleaned.substring(1);
  }
  if (cleaned.startsWith("9") && cleaned.length === 9) {
    cleaned = "+251" + cleaned;
  }
  return cleaned;
}

// ============================================================
// PASSWORD VALIDATION
// ============================================================

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== "string") {
    return false;
  }
  return VALIDATION_PATTERNS.PASSWORD.test(password);
}

/**
 * Validate password and return detailed feedback
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password) {
    return { isValid: false, errors: ["Password is required"] };
  }

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (password.length > 72) {
    errors.push("Password must not exceed 72 characters");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};:'",.<>?/]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================
// UUID VALIDATION
// ============================================================

/**
 * Validate UUID
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== "string") {
    return false;
  }
  return VALIDATION_PATTERNS.UUID.test(uuid.trim());
}

// ============================================================
// URL VALIDATION
// ============================================================

/**
 * Validate URL
 */
export function isValidURL(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }
  return VALIDATION_PATTERNS.URL.test(url.trim());
}

// ============================================================
// SLUG VALIDATION
// ============================================================

/**
 * Validate slug
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== "string") {
    return false;
  }
  return VALIDATION_PATTERNS.SLUG.test(slug.trim());
}

// ============================================================
// ALPHANUMERIC VALIDATION
// ============================================================

/**
 * Validate alphanumeric string
 */
export function isAlphanumeric(value: string): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }
  return VALIDATION_PATTERNS.ALPHANUMERIC.test(value.trim());
}

// ============================================================
// OTP VALIDATION
// ============================================================

/**
 * Validate OTP (6-digit numeric)
 */
export function isValidOTP(otp: string): boolean {
  if (!otp || typeof otp !== "string") {
    return false;
  }
  return VALIDATION_PATTERNS.OTP.test(otp.trim());
}

// ============================================================
// COORDINATE VALIDATION
// ============================================================

/**
 * Validate latitude
 */
export function isValidLatitude(lat: number): boolean {
  if (typeof lat !== "number") {
    return false;
  }
  return lat >= -90 && lat <= 90;
}

/**
 * Validate longitude
 */
export function isValidLongitude(lng: number): boolean {
  if (typeof lng !== "number") {
    return false;
  }
  return lng >= -180 && lng <= 180;
}

// ============================================================
// DATE VALIDATION
// ============================================================

/**
 * Validate date string (YYYY-MM-DD)
 */
export function isValidDate(date: string): boolean {
  if (!date || typeof date !== "string") {
    return false;
  }
  return VALIDATION_PATTERNS.DATE.test(date.trim());
}

/**
 * Validate datetime string (ISO format)
 */
export function isValidDateTime(datetime: string): boolean {
  if (!datetime || typeof datetime !== "string") {
    return false;
  }
  return VALIDATION_PATTERNS.DATETIME.test(datetime.trim());
}

/**
 * Validate if date is not in the past
 */
export function isDateInFuture(date: Date): boolean {
  return date > new Date();
}

/**
 * Validate if date is not in the past (date string)
 */
export function isDateStringInFuture(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return false;
  }
  return date > new Date();
}

// ============================================================
// RANGE VALIDATION
// ============================================================

/**
 * Validate if value is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate if value is within range and return error message
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string = "Value",
): { isValid: boolean; message?: string } {
  if (typeof value !== "number") {
    return { isValid: false, message: `${fieldName} must be a number` };
  }
  if (value < min) {
    return { isValid: false, message: `${fieldName} must be at least ${min}` };
  }
  if (value > max) {
    return { isValid: false, message: `${fieldName} must be at most ${max}` };
  }
  return { isValid: true };
}

// ============================================================
// LENGTH VALIDATION
// ============================================================

/**
 * Validate string length
 */
export function isValidLength(
  value: string,
  min: number,
  max: number,
): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }
  const length = value.length;
  return length >= min && length <= max;
}

/**
 * Validate string length and return error message
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string = "Field",
): { isValid: boolean; message?: string } {
  if (!value) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  const length = value.length;
  if (length < min) {
    return {
      isValid: false,
      message: `${fieldName} must be at least ${min} characters`,
    };
  }
  if (length > max) {
    return {
      isValid: false,
      message: `${fieldName} must not exceed ${max} characters`,
    };
  }
  return { isValid: true };
}

// ============================================================
// REQUIRED FIELD VALIDATION
// ============================================================

/**
 * Validate required field
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }
  return true;
}

/**
 * Validate required field and return error message
 */
export function validateRequired(
  value: any,
  fieldName: string = "Field",
): { isValid: boolean; message?: string } {
  if (!isRequired(value)) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  return { isValid: true };
}

// ============================================================
// ARRAY VALIDATION
// ============================================================

/**
 * Validate if value is a non-empty array
 */
export function isValidArray(value: any): boolean {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Validate array and return error message
 */
export function validateArray(
  value: any,
  fieldName: string = "Array",
): { isValid: boolean; message?: string } {
  if (!Array.isArray(value)) {
    return { isValid: false, message: `${fieldName} must be an array` };
  }
  if (value.length === 0) {
    return { isValid: false, message: `${fieldName} cannot be empty` };
  }
  return { isValid: true };
}

// ============================================================
// ENUM VALIDATION
// ============================================================

/**
 * Validate if value is in enum
 */
export function isInEnum<T>(value: any, enumObject: T): boolean {
  const enumValues = Object.values(enumObject);
  return enumValues.includes(value);
}

/**
 * Validate enum and return error message
 */
export function validateEnum<T>(
  value: any,
  enumObject: T,
  fieldName: string = "Field",
): { isValid: boolean; message?: string } {
  if (!isInEnum(value, enumObject)) {
    const allowedValues = Object.values(enumObject).join(", ");
    return {
      isValid: false,
      message: `${fieldName} must be one of: ${allowedValues}`,
    };
  }
  return { isValid: true };
}

// ============================================================
// OBJECT VALIDATION
// ============================================================

/**
 * Validate if value is an object (not null, not array)
 */
export function isObject(value: any): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  VALIDATION_PATTERNS,
  isValidEmail,
  validateEmail,
  isValidPhone,
  isValidEthiopianPhone,
  isValidPhoneAny,
  validatePhone,
  formatPhoneToE164,
  isValidPassword,
  validatePassword,
  isValidUUID,
  isValidURL,
  isValidSlug,
  isAlphanumeric,
  isValidOTP,
  isValidLatitude,
  isValidLongitude,
  isValidDate,
  isValidDateTime,
  isDateInFuture,
  isDateStringInFuture,
  isInRange,
  validateRange,
  isValidLength,
  validateLength,
  isRequired,
  validateRequired,
  isValidArray,
  validateArray,
  isInEnum,
  validateEnum,
  isObject,
};
