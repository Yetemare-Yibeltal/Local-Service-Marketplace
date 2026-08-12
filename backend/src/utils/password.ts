import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import logger from "./logger";
import { hashData, generateSecureToken } from "./encryption";

// ============================================================
// TYPES
// ============================================================

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number;
  strength: "weak" | "fair" | "good" | "strong" | "very-strong";
}

/**
 * Password policy
 */
export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  requireNoCommonPasswords: boolean;
  maxHistory: number;
  expiryDays: number;
}

/**
 * Password history entry
 */
export interface PasswordHistoryEntry {
  passwordHash: string;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Password strength score
 */
export interface PasswordStrengthScore {
  score: number;
  label: string;
  color: string;
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Default password policy
 */
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 72,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  requireNoCommonPasswords: true,
  maxHistory: 5,
  expiryDays: 90,
};

/**
 * Common passwords list (top 100 worst passwords)
 */
export const COMMON_PASSWORDS = [
  "password",
  "123456",
  "12345678",
  "123456789",
  "12345",
  "1234567",
  "1234567890",
  "qwerty",
  "abc123",
  "password123",
  "admin",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "master",
  "sunshine",
  "princess",
  "iloveyou",
  "fuckyou",
  "trustno1",
  "12345678910",
  "baseball",
  "football",
  "computer",
  "jesus",
  "michael",
  "ninja",
  "mustang",
  "password1",
  "qwerty123",
  "qwertyuiop",
  "123456789a",
  "123abc",
  "123qwe",
  "123qwerty",
  "321654",
  "555555",
  "654321",
  "7777777",
  "888888",
  "abc123456",
  "access",
  "apple",
  "bailey",
  "batman",
  "beautiful",
  "benjamin",
  "bigdaddy",
  "bigdog",
  "blink182",
  "buster",
  "calvin",
  "cameron",
  "charlie",
  "cheese",
  "chocolate",
  "cocacola",
  "college",
  "comcast",
  "cookie",
  "cooper",
  "cowboy",
  "crystal",
  "daniel",
  "david",
  "deadpool",
  "diamond",
  "dick",
  "dolphin",
  "donald",
  "dragon1",
  "dragonball",
  "dragonfly",
  "dragonballz",
  "dragon123",
  "dragon1234",
  "dragon12345",
  "dragon123456",
  "dragon1234567",
  "dragon12345678",
  "dragon123456789",
  "dragon1234567890",
  "dragon12345678910",
  "dragon1234567891011",
  "dragon123456789101112",
];

/**
 * Password strength labels
 */
export const STRENGTH_LABELS: Record<number, { label: string; color: string }> =
  {
    0: { label: "Weak", color: "bg-red-500" },
    1: { label: "Weak", color: "bg-red-500" },
    2: { label: "Fair", color: "bg-yellow-500" },
    3: { label: "Good", color: "bg-blue-500" },
    4: { label: "Strong", color: "bg-green-500" },
    5: { label: "Very Strong", color: "bg-green-600" },
  };

// ============================================================
// PASSWORD HASHING
// ============================================================

/**
 * Hash password using bcrypt
 */
export async function hashPassword(
  password: string,
  saltRounds: number = 12,
): Promise<string> {
  try {
    if (!password || password.length === 0) {
      throw new Error("Password cannot be empty");
    }

    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    logger.debug("Password hashed successfully");

    return hashedPassword;
  } catch (error) {
    logger.error("Password hashing failed:", error);
    throw new Error("Failed to hash password");
  }
}

/**
 * Hash password synchronously
 */
export function hashPasswordSync(
  password: string,
  saltRounds: number = 12,
): string {
  try {
    if (!password || password.length === 0) {
      throw new Error("Password cannot be empty");
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    logger.debug("Password hashed synchronously");

    return hashedPassword;
  } catch (error) {
    logger.error("Synchronous password hashing failed:", error);
    throw new Error("Failed to hash password");
  }
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  try {
    if (!plainPassword || !hashedPassword) {
      logger.warn("Password verification attempted with empty values");
      return false;
    }

    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);

    if (isMatch) {
      logger.debug("Password verification successful");
    } else {
      logger.debug("Password verification failed");
    }

    return isMatch;
  } catch (error) {
    logger.error("Password verification failed:", error);
    return false;
  }
}

/**
 * Verify password synchronously
 */
export function verifyPasswordSync(
  plainPassword: string,
  hashedPassword: string,
): boolean {
  try {
    if (!plainPassword || !hashedPassword) {
      logger.warn(
        "Synchronous password verification attempted with empty values",
      );
      return false;
    }

    return bcrypt.compareSync(plainPassword, hashedPassword);
  } catch (error) {
    logger.error("Synchronous password verification failed:", error);
    return false;
  }
}

// ============================================================
// PASSWORD VALIDATION
// ============================================================

/**
 * Validate password strength
 */
export function validatePassword(
  password: string,
  policy: Partial<PasswordPolicy> = {},
): PasswordValidationResult {
  const config = { ...DEFAULT_PASSWORD_POLICY, ...policy };
  const errors: string[] = [];
  let score = 0;

  // Check if password is empty
  if (!password || password.length === 0) {
    errors.push("Password is required");
    return {
      isValid: false,
      errors,
      score: 0,
      strength: "weak",
    };
  }

  // Check minimum length
  if (password.length < config.minLength) {
    errors.push(
      `Password must be at least ${config.minLength} characters long`,
    );
  } else {
    score++;
  }

  // Check maximum length
  if (password.length > config.maxLength) {
    errors.push(`Password must not exceed ${config.maxLength} characters`);
  }

  // Check uppercase letters
  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else if (config.requireUppercase) {
    score++;
  }

  // Check lowercase letters
  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else if (config.requireLowercase) {
    score++;
  }

  // Check numbers
  if (config.requireNumbers && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  } else if (config.requireNumbers) {
    score++;
  }

  // Check symbols
  if (
    config.requireSymbols &&
    !/[!@#$%^&*()_+\-=\[\]{};:'",.<>?/]/.test(password)
  ) {
    errors.push("Password must contain at least one special character");
  } else if (config.requireSymbols) {
    score++;
  }

  // Check common passwords
  if (config.requireNoCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    const isCommon = COMMON_PASSWORDS.includes(lowerPassword);

    if (isCommon) {
      errors.push(
        "Password is too common. Please choose a more secure password",
      );
    } else {
      score++;
    }
  }

  // Check for repetitive patterns
  if (/(.)\1{3,}/.test(password)) {
    errors.push("Password contains too many repetitive characters");
  }

  // Check for sequential patterns
  if (/12345|54321|abcdef|fedcba/.test(password)) {
    errors.push("Password contains sequential characters");
  }

  // Check for keyboard patterns
  if (/qwerty|asdfgh|zxcvbn/.test(password)) {
    errors.push("Password contains keyboard patterns");
  }

  // Calculate strength
  const strength = getPasswordStrength(score);

  return {
    isValid: errors.length === 0,
    errors,
    score,
    strength,
  };
}

/**
 * Get password strength
 */
export function getPasswordStrength(
  score: number,
): "weak" | "fair" | "good" | "strong" | "very-strong" {
  if (score <= 2) return "weak";
  if (score === 3) return "fair";
  if (score === 4) return "good";
  if (score === 5) return "strong";
  return "very-strong";
}

/**
 * Get password strength score
 */
export function getPasswordStrengthScore(
  password: string,
): PasswordStrengthScore {
  const result = validatePassword(password);
  const score = result.score;
  const label = STRENGTH_LABELS[Math.min(score, 5)] || STRENGTH_LABELS[0];

  return {
    score,
    label: label.label,
    color: label.color,
  };
}

// ============================================================
// PASSWORD GENERATION
// ============================================================

/**
 * Generate a secure random password
 */
export function generateSecurePassword(
  length: number = 12,
  options: {
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    excludeSimilar?: boolean;
  } = {},
): string {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeSimilar = true,
  } = options;

  let chars = "";

  if (includeLowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (includeUppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (includeNumbers) chars += "0123456789";
  if (includeSymbols) chars += "!@#$%^&*()_+-=[]{};:,.<>?";

  if (excludeSimilar) {
    chars = chars.replace(/[il1Lo0O]/g, "");
  }

  if (chars.length === 0) {
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  }

  let password = "";
  const randomBytesArray = randomBytes(length);

  for (let i = 0; i < length; i++) {
    const index = randomBytesArray[i] % chars.length;
    password += chars[index];
  }

  return password;
}

/**
 * Generate a memorable password (word-based)
 */
export function generateMemorablePassword(
  wordCount: number = 3,
  separator: string = "-",
): string {
  const words = [
    "apple",
    "banana",
    "cherry",
    "dragon",
    "eagle",
    "falcon",
    "garden",
    "hammer",
    "island",
    "jacket",
    "knight",
    "laptop",
    "magic",
    "night",
    "ocean",
    "pencil",
    "queen",
    "river",
    "stone",
    "tiger",
    "uncle",
    "valley",
    "water",
    "xenon",
    "yellow",
    "zebra",
    "blue",
    "red",
    "green",
    "gold",
    "silver",
    "crystal",
    "mountain",
    "forest",
    "desert",
    "jungle",
    "meadow",
    "sailor",
    "pilot",
    "captain",
    "adventurer",
    "explorer",
  ];

  const selectedWords: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * words.length);
    selectedWords.push(words[randomIndex]);
  }

  // Add a random number
  const randomNumber = Math.floor(Math.random() * 100);

  return selectedWords.join(separator) + randomNumber;
}

// ============================================================
// PASSWORD HISTORY
// ============================================================

/**
 * Create password history entry
 */
export function createPasswordHistoryEntry(
  passwordHash: string,
): PasswordHistoryEntry {
  return {
    passwordHash,
    createdAt: new Date(),
  };
}

/**
 * Check if password has been used before
 */
export async function isPasswordReused(
  newPassword: string,
  history: PasswordHistoryEntry[],
): Promise<boolean> {
  if (!history || history.length === 0) {
    return false;
  }

  for (const entry of history) {
    if (await verifyPassword(newPassword, entry.passwordHash)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if password has been used before (sync)
 */
export function isPasswordReusedSync(
  newPassword: string,
  history: PasswordHistoryEntry[],
): boolean {
  if (!history || history.length === 0) {
    return false;
  }

  for (const entry of history) {
    if (verifyPasswordSync(newPassword, entry.passwordHash)) {
      return true;
    }
  }

  return false;
}

/**
 * Clean expired password history
 */
export function cleanPasswordHistory(
  history: PasswordHistoryEntry[],
  expiryDays: number = DEFAULT_PASSWORD_POLICY.expiryDays,
): PasswordHistoryEntry[] {
  const now = new Date();
  const expiryDate = new Date(now.getTime() - expiryDays * 24 * 60 * 60 * 1000);

  return history.filter((entry) => {
    if (!entry.expiresAt) {
      return entry.createdAt >= expiryDate;
    }
    return entry.expiresAt > now;
  });
}

/**
 * Add new password to history and enforce max history limit
 */
export function addPasswordToHistory(
  history: PasswordHistoryEntry[],
  newEntry: PasswordHistoryEntry,
  maxHistory: number = DEFAULT_PASSWORD_POLICY.maxHistory,
): PasswordHistoryEntry[] {
  const updatedHistory = [...history, newEntry];

  // Sort by createdAt descending (newest first)
  updatedHistory.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Keep only maxHistory entries
  if (updatedHistory.length > maxHistory) {
    return updatedHistory.slice(0, maxHistory);
  }

  return updatedHistory;
}

// ============================================================
// PASSWORD POLICY HELPERS
// ============================================================

/**
 * Get password requirements message
 */
export function getPasswordRequirements(
  policy: Partial<PasswordPolicy> = {},
): string[] {
  const config = { ...DEFAULT_PASSWORD_POLICY, ...policy };
  const requirements: string[] = [];

  requirements.push(`At least ${config.minLength} characters`);

  if (config.requireUppercase) {
    requirements.push("At least one uppercase letter");
  }

  if (config.requireLowercase) {
    requirements.push("At least one lowercase letter");
  }

  if (config.requireNumbers) {
    requirements.push("At least one number");
  }

  if (config.requireSymbols) {
    requirements.push("At least one special character");
  }

  if (config.requireNoCommonPasswords) {
    requirements.push("Not a common password");
  }

  return requirements;
}

/**
 * Get password strength indicator data
 */
export function getPasswordStrengthIndicator(password: string): {
  score: number;
  label: string;
  color: string;
  progress: number;
} {
  const result = validatePassword(password);
  const strength = getPasswordStrength(result.score);

  // Map strength to color and progress
  const colors: Record<string, { color: string; progress: number }> = {
    weak: { color: "bg-red-500", progress: 20 },
    fair: { color: "bg-yellow-500", progress: 40 },
    good: { color: "bg-blue-500", progress: 60 },
    strong: { color: "bg-green-500", progress: 80 },
    "very-strong": { color: "bg-green-600", progress: 100 },
  };

  const indicator = colors[strength] || colors.weak;

  return {
    score: result.score,
    label: strength.charAt(0).toUpperCase() + strength.slice(1),
    color: indicator.color,
    progress: indicator.progress,
  };
}

// ============================================================
// PASSWORD LEAK CHECK
// ============================================================

/**
 * Check if password has been leaked (using Have I Been Pwned API)
 */
export async function checkPasswordLeak(password: string): Promise<{
  isLeaked: boolean;
  count: number;
}> {
  try {
    // This is a simplified version. In production, implement
    // actual Have I Been Pwned API integration using k-anonymity
    // For now, return a mock result

    // Real implementation would hash the password and send
    // only the first 5 characters to the API
    const hash = hashData(password, "sha1", "hex");
    const prefix = hash.substring(0, 5);

    // Mock response
    return {
      isLeaked: false,
      count: 0,
    };
  } catch (error) {
    logger.error("Password leak check failed:", error);
    return {
      isLeaked: false,
      count: 0,
    };
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Types
  PasswordValidationResult,
  PasswordPolicy,
  PasswordHistoryEntry,
  PasswordStrengthScore,

  // Constants
  DEFAULT_PASSWORD_POLICY,
  COMMON_PASSWORDS,
  STRENGTH_LABELS,

  // Hashing
  hashPassword,
  hashPasswordSync,
  verifyPassword,
  verifyPasswordSync,

  // Validation
  validatePassword,
  getPasswordStrength,
  getPasswordStrengthScore,

  // Generation
  generateSecurePassword,
  generateMemorablePassword,

  // History
  createPasswordHistoryEntry,
  isPasswordReused,
  isPasswordReusedSync,
  cleanPasswordHistory,
  addPasswordToHistory,

  // Policy
  getPasswordRequirements,
  getPasswordStrengthIndicator,

  // Leak check
  checkPasswordLeak,
};
