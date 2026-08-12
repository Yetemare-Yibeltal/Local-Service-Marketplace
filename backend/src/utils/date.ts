// ============================================================
// DATE HELPERS
// Complete date utility functions for the application
// ============================================================

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Date formats
 */
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DATE_READABLE: 'MMMM D, YYYY',
  TIME_READABLE: 'h:mm A',
  DATETIME_READABLE: 'MMMM D, YYYY h:mm A',
  DATE_SHORT: 'MMM D, YYYY',
  TIME_SHORT: 'HH:mm',
  DATETIME_SHORT: 'MMM D, YYYY HH:mm',
  ISO: "YYYY-MM-DD'T'HH:mm:ss.SSS'Z'",
  ISO_WITHOUT_MS: "YYYY-MM-DD'T'HH:mm:ss'Z'",
  RFC3339: "YYYY-MM-DD'T'HH:mm:ssZ",
  TIMESTAMP: 'X',
} as const;

export type DateFormat = typeof DATE_FORMATS[keyof typeof DATE_FORMATS];

/**
 * Time units in milliseconds
 */
export const TIME_UNITS = {
  MILLISECOND: 1,
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Day names
 */
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/**
 * Short day names
 */
export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * Month names
 */
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/**
 * Short month names
 */
export const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Check if a value is a valid date
 */
export function isValidDate(date: any): boolean {
  if (date === null || date === undefined) return false;
  if (date instanceof Date && !isNaN(date.getTime())) return true;
  if (typeof date === 'string' || typeof date === 'number') {
    const d = new Date(date);
    return !isNaN(d.getTime());
  }
  return false;
}

/**
 * Check if a date string is in ISO format
 */
export function isISOString(dateString: string): boolean {
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  return isoRegex.test(dateString);
}

/**
 * Check if date is in the future
 */
export function isFutureDate(date: Date): boolean {
  if (!isValidDate(date)) return false;
  return date.getTime() > Date.now();
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: Date): boolean {
  if (!isValidDate(date)) return false;
  return date.getTime() < Date.now();
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  if (!isValidDate(date)) return false;
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date): boolean {
  if (!isValidDate(date)) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  );
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(date: Date): boolean {
  if (!isValidDate(date)) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  );
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  if (!isValidDate(date1) || !isValidDate(date2)) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if two dates are in the same month
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
  if (!isValidDate(date1) || !isValidDate(date2)) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

/**
 * Check if date is within a range
 */
export function isWithinRange(date: Date, start: Date, end: Date): boolean {
  if (!isValidDate(date) || !isValidDate(start) || !isValidDate(end)) return false;
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

// ============================================================
// FORMATTING FUNCTIONS
// ============================================================

/**
 * Format date using a format string
 */
export function formatDate(date: Date | string | number, format: string): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (!isValidDate(d)) return '';

  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    YY: String(d.getFullYear()).slice(-2),
    MM: String(d.getMonth() + 1).padStart(2, '0'),
    M: String(d.getMonth() + 1),
    MMM: MONTHS_SHORT[d.getMonth()],
    MMMM: MONTHS[d.getMonth()],
    DD: String(d.getDate()).padStart(2, '0'),
    D: String(d.getDate()),
    dddd: DAYS[d.getDay()],
    ddd: DAYS_SHORT[d.getDay()],
    HH: String(d.getHours()).padStart(2, '0'),
    H: String(d.getHours()),
    hh: String(d.getHours() % 12 || 12).padStart(2, '0'),
    h: String(d.getHours() % 12 || 12),
    mm: String(d.getMinutes()).padStart(2, '0'),
    m: String(d.getMinutes()),
    ss: String(d.getSeconds()).padStart(2, '0'),
    s: String(d.getSeconds()),
    SSS: String(d.getMilliseconds()).padStart(3, '0'),
    A: d.getHours() >= 12 ? 'PM' : 'AM',
    a: d.getHours() >= 12 ? 'pm' : 'am',
    Z: formatTimezoneOffset(d),
    x: String(d.getTime()),
    X: String(Math.floor(d.getTime() / 1000)),
  };

  return format.replace(/YYYY|YY|MMMM|MMM|MM|M|dddd|ddd|DD|D|HH|H|hh|h|mm|m|ss|s|SSS|A|a|Z|x|X/g, (match) => map[match] || match);
}

/**
 * Format timezone offset
 */
function formatTimezoneOffset(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
}

/**
 * Format date to readable string
 */
export function formatDateReadable(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.DATE_READABLE);
}

/**
 * Format time to readable string
 */
export function formatTimeReadable(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.TIME_READABLE);
}

/**
 * Format datetime to readable string
 */
export function formatDateTimeReadable(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.DATETIME_READABLE);
}

/**
 * Format date to ISO string
 */
export function formatISO(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.ISO);
}

/**
 * Format date to short date
 */
export function formatDateShort(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.DATE_SHORT);
}

// ============================================================
// PARSING FUNCTIONS
// ============================================================

/**
 * Parse date string to Date object
 */
export function parseDate(dateString: string, format?: string): Date | null {
  try {
    const d = new Date(dateString);
    if (isValidDate(d)) return d;
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse date string with fallback
 */
export function parseDateOrNull(dateString: string): Date | null {
  return parseDate(dateString);
}

/**
 * Parse date string with default value
 */
export function parseDateOrDefault(dateString: string, defaultValue: Date = new Date()): Date {
  const parsed = parseDate(dateString);
  return parsed || defaultValue;
}

/**
 * Parse ISO date string
 */
export function parseISO(dateString: string): Date | null {
  const d = new Date(dateString);
  return isValidDate(d) ? d : null;
}

// ============================================================
// MANIPULATION FUNCTIONS
// ============================================================

/**
 * Add time to a date
 */
export function addTime(date: Date, amount: number, unit: keyof typeof TIME_UNITS): Date {
  if (!isValidDate(date)) {
    throw new Error('Invalid date');
  }
  const result = new Date(date);
  const milliseconds = amount * TIME_UNITS[unit];
  result.setTime(result.getTime() + milliseconds);
  return result;
}

/**
 * Subtract time from a date
 */
export function subtractTime(date: Date, amount: number, unit: keyof typeof TIME_UNITS): Date {
  return addTime(date, -amount, unit);
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  return addTime(date, days, 'DAY');
}

/**
 * Subtract days from a date
 */
export function subtractDays(date: Date, days: number): Date {
  return addTime(date, -days, 'DAY');
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  if (!isValidDate(date)) {
    throw new Error('Invalid date');
  }
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Subtract months from a date
 */
export function subtractMonths(date: Date, months: number): Date {
  return addMonths(date, -months);
}

/**
 * Add years to a date
 */
export function addYears(date: Date, years: number): Date {
  if (!isValidDate(date)) {
    throw new Error('Invalid date');
  }
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * Subtract years from a date
 */
export function subtractYears(date: Date, years: number): Date {
  return addYears(date, -years);
}

/**
 * Start of day (midnight)
 */
export function startOfDay(date: Date): Date {
  if (!isValidDate(date)) {
    throw new Error('Invalid date');
  }
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * End of day (23:59:59.999)
 */
export function endOfDay(date: Date): Date {
  if (!isValidDate(date)) {
    throw new Error('Invalid date');
  }
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Start of week (Monday)
 */
export function startOfWeek(date: Date): Date {
  if (!isValidDate(date)) {
    throw new Error('Invalid date');
  }
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day === 0 ? 6 : day - 1);
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * End of week (Sunday)
 */
export function endOfWeek(date: Date): Date {
  if (!isValidDate(date)) {
    throw new Error('Invalid date');
  }
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Start of month
 */
export function startOfMonth(date: Date): Date {
  if (!isValidDate(date)) {
    throw new Error('Invalid date');
  }
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * End of month
 */
export function endOfMonth(date: Date): Date {
  if (!isValidDate(date)) {
    throw new Error('Invalid date');
  }
  const result = startOfMonth(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Start of year
 */
export function startOfYear(date: Date): Date {
  if (!isValidDate(date)) {
    throw new Error('Invalid date');
  }
  const result = new Date(date);
  result.setMonth(0, 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * End of year
 */
export function endOfYear(date: Date): Date {
  if (!isValidDate(date)) {
    throw new Error('Invalid date');
  }
  const result = new Date(date);
  result.setMonth(11, 31);
  result.setHours(23, 59, 59, 999);
  return result;
}

// ============================================================
// DIFFERENCE FUNCTIONS
// ============================================================

/**
 * Get difference between two dates in milliseconds
 */
export function diffMilliseconds(date1: Date, date2: Date): number {
  if (!isValidDate(date1) || !isValidDate(date2)) {
    throw new Error('Invalid date');
  }
  return date1.getTime() - date2.getTime();
}

/**
 * Get difference between two dates in seconds
 */
export function diffSeconds(date1: Date, date2: Date): number {
  return Math.floor(diffMilliseconds(date1, date2) / TIME_UNITS.SECOND);
}

/**
 * Get difference between two dates in minutes
 */
export function diffMinutes(date1: Date, date2: Date): number {
  return Math.floor(diffMilliseconds(date1, date2) / TIME_UNITS.MINUTE);
}

/**
 * Get difference between two dates in hours
 */
export function diffHours(date1: Date, date2: Date): number {
  return Math.floor(diffMilliseconds(date1, date2) / TIME_UNITS.HOUR);
}

/**
 * Get difference between two dates in days
 */
export function diffDays(date1: Date, date2: Date): number {
  return Math.floor(diffMilliseconds(date1, date2) / TIME_UNITS.DAY);
}

/**
 * Get difference between two dates in weeks
 */
export function diffWeeks(date1: Date, date2: Date): number {
  return Math.floor(diffMilliseconds(date1, date2) / TIME_UNITS.WEEK);
}

/**
 * Get difference between two dates in months
 */
export function diffMonths(date1: Date, date2: Date): number {
  if (!isValidDate(date1) || !isValidDate(date2)) {
    throw new Error('Invalid date');
  }
  return (date1.getFullYear() - date2.getFullYear()) * 12 + (date1.getMonth() - date2.getMonth());
}

/**
 * Get difference between two dates in years
 */
export function diffYears(date1: Date, date2: Date): number {
  return date1.getFullYear() - date2.getFullYear();
}

/**
 * Get human-readable time difference
 */
export function timeAgo(date: Date): string {
  if (!isValidDate(date)) return 'Invalid date';

  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < TIME_UNITS.MINUTE) {
    return 'Just now';
  }

  if (diff < TIME_UNITS.HOUR) {
    const minutes = Math.floor(diff / TIME_UNITS.MINUTE);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }

  if (diff < TIME_UNITS.DAY) {
    const hours = Math.floor(diff / TIME_UNITS.HOUR);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  if (diff < TIME_UNITS.WEEK) {
    const days = Math.floor(diff / TIME_UNITS.DAY);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  if (diff < TIME_UNITS.MONTH) {
    const weeks = Math.floor(diff / TIME_UNITS.WEEK);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }

  if (diff < TIME_UNITS.YEAR) {
    const months = Math.floor(diff / TIME_UNITS.MONTH);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }

  const years = Math.floor(diff / TIME_UNITS.YEAR);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

// ============================================================
// TIMEZONE FUNCTIONS
// ============================================================

/**
 * Get timezone offset in minutes
 */
export function getTimezoneOffset(date: Date = new Date()): number {
  return date.getTimezoneOffset();
}

/**
 * Get timezone name
 */
export function getTimezoneName(date: Date = new Date()): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Format date in specific timezone
 */
export function formatInTimezone(date: Date, timezone: string, format: string = DATE_FORMATS.DATETIME_READABLE): string {
  if (!isValidDate(date)) return '';
  try {
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
    return formatted;
  } catch {
    return formatDate(date, format);
  }
}

// ============================================================
// DATE RANGE FUNCTIONS
// ============================================================

/**
 * Get date range between two dates
 */
export function getDateRange(startDate: Date, endDate: Date): Date[] {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Invalid date');
  }
  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * Get date range with step
 */
export function getDateRangeWithStep(startDate: Date, endDate: Date, step: number = 1): Date[] {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Invalid date');
  }
  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + step);
  }
  return dates;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Constants
  DATE_FORMATS,
  TIME_UNITS,
  DAYS,
  DAYS_SHORT,
  MONTHS,
  MONTHS_SHORT,

  // Validation
  isValidDate,
  isISOString,
  isFutureDate,
  isPastDate,
  isToday,
  isYesterday,
  isTomorrow,
  isSameDay,
  isSameMonth,
  isWithinRange,

  // Formatting
  formatDate,
  formatDateReadable,
  formatTimeReadable,
  formatDateTimeReadable,
  formatISO,
  formatDateShort,

  // Parsing
  parseDate,
  parseDateOrNull,
  parseDateOrDefault,
  parseISO,

  // Manipulation
  addTime,
  subtractTime,
  addDays,
  subtractDays,
  addMonths,
  subtractMonths,
  addYears,
  subtractYears,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,

  // Difference
  diffMilliseconds,
  diffSeconds,
  diffMinutes,
  diffHours,
  diffDays,
  diffWeeks,
  diffMonths,
  diffYears,
  timeAgo,

  // Timezone
  getTimezoneOffset,
  getTimezoneName,
  formatInTimezone,

  // Date Range
  getDateRange,
  getDateRangeWithStep,
};