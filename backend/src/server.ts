import { app } from "./app";
import env from "./config/env";
import logger from "./utils/logger";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { connectRedis, disconnectRedis } from "./config/redis";
import { initializeCloudinary } from "./config/cloudinary";
import { createServer, Server } from "http";

// ============================================================
// SERVER CLASS
// ============================================================

class ServerManager {
  private server: Server | null = null;
  private isShuttingDown: boolean = false;
  private readonly port: number;

  constructor() {
    this.port = parseInt(env.PORT || "5000", 10);
  }

  /**
   * Initialize all services
   */
  private async initializeServices(): Promise<void> {
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

  /**
   * Start the HTTP server
   */
  public async start(): Promise<void> {
    try {
      // Initialize all services before starting the server
      await this.initializeServices();

      // Create HTTP server
      this.server = createServer(app);

      // Start listening
      this.server.listen(this.port, () => {
        logger.info("=".repeat(60));
        logger.info("🚀 Server started successfully");
        logger.info(`📡 Environment: ${env.NODE_ENV}`);
        logger.info(`🌐 Port: ${this.port}`);
        logger.info(
          `📚 API Documentation: http://localhost:${this.port}/api-docs`,
        );
        logger.info(`❤️  Health Check: http://localhost:${this.port}/health`);
        logger.info(`🔗 Base URL: http://localhost:${this.port}/api/v1`);
        logger.info("=".repeat(60));
      });

      // Handle server errors
      this.server.on("error", this.handleServerError.bind(this));

      // Setup graceful shutdown handlers
      this.setupGracefulShutdown();

      // Log startup time
      const startupTime = Date.now();
      logger.info(`⏱️  Startup completed in ${Date.now() - startupTime}ms`);
    } catch (error) {
      logger.error("Failed to start server:", error);
      process.exit(1);
    }
  }

  /**
   * Handle server errors
   */
  private handleServerError(error: Error): void {
    if ((error as any).code === "EADDRINUSE") {
      logger.error(
        `Port ${this.port} is already in use. Please free the port and try again.`,
      );
      process.exit(1);
    } else {
      logger.error("Server error:", error);
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = this.gracefulShutdown.bind(this);

    // Process signals
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
    process.on("SIGHUP", shutdown);

    // Uncaught exceptions and unhandled rejections
    process.on("uncaughtException", async (error: Error) => {
      logger.error("💥 Uncaught exception:", error);
      await this.gracefulShutdown();
    });

    process.on("unhandledRejection", async (reason: any) => {
      logger.error("💥 Unhandled rejection:", reason);
      await this.gracefulShutdown();
    });
  }

  /**
   * Gracefully shut down the server
   */
  public async gracefulShutdown(): Promise<void> {
    if (this.isShuttingDown) {
      logger.info("⏳ Shutdown already in progress...");
      return;
    }

    this.isShuttingDown = true;
    logger.info("🛑 Starting graceful shutdown...");

    // Set a timeout for forced shutdown
    const shutdownTimeout = setTimeout(() => {
      logger.error("❌ Shutdown timeout exceeded (30s). Forcing exit...");
      process.exit(1);
    }, 30000);

    try {
      // Close HTTP server
      if (this.server) {
        logger.info("📡 Closing HTTP server...");
        await new Promise<void>((resolve, reject) => {
          if (!this.server) {
            resolve();
            return;
          }
          this.server!.close((err) => {
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
   * Get the server instance
   */
  public getServer(): Server | null {
    return this.server;
  }

  /**
   * Get the port
   */
  public getPort(): number {
    return this.port;
  }

  /**
   * Check if the server is running
   */
  public isRunning(): boolean {
    return this.server !== null && this.server.listening;
  }
}

// ============================================================
// CREATE SERVER INSTANCE
// ============================================================

const serverManager = new ServerManager();

// ============================================================
// START SERVER
// ============================================================

// Only start the server if this file is run directly
// (not imported as a module)
if (require.main === module) {
  serverManager.start();
}

// ============================================================
// EXPORTS
// ============================================================

export { serverManager };
export default serverManager;
