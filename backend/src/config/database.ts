import { PrismaClient, Prisma } from "@prisma/client";
import env from "./env";
import logger from "../utils/logger";

// ============================================================
// DATABASE CONNECTION CONFIGURATION
// ============================================================

// Determine log level based on environment
const getLogLevel = (): Prisma.LogLevel[] => {
  if (env.NODE_ENV === "development") {
    return ["query", "info", "warn", "error"];
  }
  if (env.NODE_ENV === "test") {
    return ["error"];
  }
  // Production
  return ["warn", "error"];
};

// Create Prisma client instance with proper configuration
const prisma = new PrismaClient({
  log: getLogLevel(),
  errorFormat: env.NODE_ENV === "production" ? "minimal" : "pretty",
});

// ============================================================
// CONNECTION MANAGEMENT
// ============================================================

// Flag to track connection status
let isConnected = false;

/**
 * Connect to the database with retry logic
 */
export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    logger.info("Database already connected");
    return;
  }

  try {
    await prisma.$connect();
    isConnected = true;
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error("Database connection failed:", error);
    throw error;
  }
}

/**
 * Disconnect from the database gracefully
 */
export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await prisma.$disconnect();
    isConnected = false;
    logger.info("Database disconnected successfully");
  } catch (error) {
    logger.error("Database disconnection failed:", error);
    throw error;
  }
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected(): boolean {
  return isConnected;
}

/**
 * Health check for database
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error("Database health check failed:", error);
    return false;
  }
}

// ============================================================
// TRANSACTION HELPERS
// ============================================================

/**
 * Execute a transaction with automatic rollback on error
 */
export async function transaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  try {
    return await prisma.$transaction(fn);
  } catch (error) {
    logger.error("Transaction failed:", error);
    throw error;
  }
}

/**
 * Execute a transaction with retry logic for transient errors
 */
export async function transactionWithRetry<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(fn);
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Transaction attempt ${attempt} failed:`, error);

      // Check if error is retryable
      const errorMessage = String(error);
      if (
        errorMessage.includes("deadlock") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("connection")
      ) {
        // Wait before retry with exponential backoff
        const delay = Math.min(100 * Math.pow(2, attempt - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Non-retryable error, throw immediately
      throw error;
    }
  }

  throw lastError || new Error("Transaction failed after retries");
}

// ============================================================
// QUERY HELPERS
// ============================================================

/**
 * Execute a raw query with proper error handling
 */
export async function rawQuery<T = any>(
  query: string,
  params: any[] = [],
): Promise<T> {
  try {
    const result = await prisma.$queryRawUnsafe(query, ...params);
    return result as T;
  } catch (error) {
    logger.error("Raw query failed:", error);
    throw error;
  }
}

/**
 * Execute a query with pagination
 */
export function paginate<T>(
  items: T[],
  page: number,
  limit: number,
): {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const data = items.slice(startIndex, endIndex);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
  };
}

// ============================================================
// GRACEFUL SHUTDOWN HANDLING
// ============================================================

// Handle process termination signals for graceful shutdown
let shutdownInitiated = false;

const handleShutdown = async (signal: string): Promise<void> => {
  if (shutdownInitiated) {
    return;
  }

  shutdownInitiated = true;
  logger.info(`Received ${signal}. Closing database connections...`);

  try {
    await disconnectDatabase();
    logger.info("Database connections closed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Error closing database connections:", error);
    process.exit(1);
  }
};

// Register shutdown handlers
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGHUP", () => handleShutdown("SIGHUP"));

// Handle unhandled exceptions
process.on("uncaughtException", async (error) => {
  logger.error("Uncaught exception:", error);
  await disconnectDatabase();
  process.exit(1);
});

// Handle unhandled rejections
process.on("unhandledRejection", async (reason) => {
  logger.error("Unhandled rejection:", reason);
  await disconnectDatabase();
  process.exit(1);
});

// ============================================================
// EXPORTS
// ============================================================

export { prisma };

export default prisma;
