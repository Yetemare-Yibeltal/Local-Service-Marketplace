import dotenv from "dotenv";
import { app } from "./app";
import env from "./config/env";
import logger from "./utils/logger";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { connectRedis, disconnectRedis } from "./config/redis";
import { initializeCloudinary } from "./config/cloudinary";
import { createServer, Server } from "http";

// ============================================================
// LOAD ENVIRONMENT VARIABLES
// ============================================================

dotenv.config();

// ============================================================
// SERVER CONFIGURATION
// ============================================================

const PORT = parseInt(env.PORT || "5000", 10);
const HOST = "0.0.0.0";

let server: Server | null = null;
let isShuttingDown = false;

// ============================================================
// INITIALIZE SERVICES
// ============================================================

/**
 * Initialize all services before starting the server
 */
async function initializeServices(): Promise<void> {
  try {
    logger.info("Initializing services...");

    // Connect to database
    await connectDatabase();
    logger.info("✅ Database connected successfully");

    // Connect to Redis
    await connectRedis();
    logger.info("✅ Redis connected successfully");

    // Initialize Cloudinary
    initializeCloudinary();
    logger.info("✅ Cloudinary initialized successfully");

    logger.info("✅ All services initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize services:", error);
    throw error;
  }
}

// ============================================================
// START SERVER
// ============================================================

/**
 * Start the HTTP server
 */
async function startServer(): Promise<void> {
  try {
    // Initialize all services before starting the server
    await initializeServices();

    // Create HTTP server
    server = createServer(app);

    // Start listening
    server.listen(PORT, HOST, () => {
      logger.info("=".repeat(60));
      logger.info("🚀 Local Service Provider Marketplace API");
      logger.info("📡 Server started successfully");
      logger.info(`🌐 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Port: ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`❤️  Health Check: http://localhost:${PORT}/health`);
      logger.info(`🔗 Base URL: http://localhost:${PORT}/api/v1`);
      logger.info("=".repeat(60));
    });

    // Handle server errors
    server.on("error", (error: any) => {
      if (error.code === "EADDRINUSE") {
        logger.error(
          `❌ Port ${PORT} is already in use. Please free the port and try again.`,
        );
        process.exit(1);
      } else {
        logger.error("❌ Server error:", error);
        process.exit(1);
      }
    });

    // Setup graceful shutdown
    setupGracefulShutdown();

    // Log startup completion
    logger.info("✅ Application ready to accept connections");
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

/**
 * Gracefully shut down the server
 */
async function gracefulShutdown(): Promise<void> {
  if (isShuttingDown) {
    logger.info("⏳ Shutdown already in progress...");
    return;
  }

  isShuttingDown = true;
  logger.info("🛑 Starting graceful shutdown...");

  // Set a timeout for forced shutdown
  const shutdownTimeout = setTimeout(() => {
    logger.error("❌ Shutdown timeout exceeded (30s). Forcing exit...");
    process.exit(1);
  }, 30000);

  try {
    // Close HTTP server
    if (server) {
      logger.info("📡 Closing HTTP server...");
      await new Promise<void>((resolve, reject) => {
        if (!server) {
          resolve();
          return;
        }
        server.close((err) => {
          if (err) {
            reject(err);
          } else {
            logger.info("✅ HTTP server closed");
            resolve();
          }
        });
      });
    }

    // Disconnect from Redis
    logger.info("🗄️  Disconnecting from Redis...");
    await disconnectRedis();
    logger.info("✅ Redis disconnected");

    // Disconnect from database
    logger.info("🗄️  Disconnecting from database...");
    await disconnectDatabase();
    logger.info("✅ Database disconnected");

    clearTimeout(shutdownTimeout);
    logger.info("✅ Graceful shutdown completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Error during graceful shutdown:", error);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(): void {
  // Process signals
  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
  process.on("SIGHUP", gracefulShutdown);

  // Uncaught exceptions
  process.on("uncaughtException", async (error: Error) => {
    logger.error("💥 Uncaught exception:", error);
    await gracefulShutdown();
  });

  // Unhandled rejections
  process.on("unhandledRejection", async (reason: any) => {
    logger.error("💥 Unhandled rejection:", reason);
    await gracefulShutdown();
  });
}

// ============================================================
// START APPLICATION
// ============================================================

// Start the server
startServer();

// ============================================================
// EXPORTS (for testing)
// ============================================================

export { app, server, startServer, gracefulShutdown };
