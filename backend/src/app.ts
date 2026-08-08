import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { createServer, Server } from "http";
import env from "./config/env";
import logger, { morganStream } from "./config/logger";
import { corsOptions } from "./config/cors";
import { setupSwagger } from "./config/swagger";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { connectRedis, disconnectRedis } from "./config/redis";
import { initializeCloudinary } from "./config/cloudinary";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { standardRateLimiter } from "./config/rateLimit";

// ============================================================
// APPLICATION CLASS
// ============================================================

class App {
  public app: Application;
  public server: Server | null = null;
  private isShuttingDown: boolean = false;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeSecurity();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeDocumentation();
  }

  // ============================================================
  // INITIALIZE MIDDLEWARES
  // ============================================================

  private initializeMiddlewares(): void {
    // Body parsing middleware
    this.app.use(express.json({ limit: "50mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "50mb" }));
    this.app.use(cookieParser());

    // Compression middleware
    this.app.use(compression());

    // Logging middleware
    this.app.use(morgan("combined", { stream: morganStream }));

    // Rate limiting - apply to all routes except webhooks
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith("/api/v1/webhooks")) {
        return next();
      }
      return standardRateLimiter(req, res, next);
    });

    // CORS middleware
    this.app.use(cors(corsOptions));

    // Security middleware
    this.app.use(
      helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
          },
        },
      }),
    );

    // Trust proxy
    this.app.set("trust proxy", 1);

    // Disable x-powered-by header
    this.app.disable("x-powered-by");
  }

  // ============================================================
  // INITIALIZE SECURITY
  // ============================================================

  private initializeSecurity(): void {
    // Additional security headers
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("X-XSS-Protection", "1; mode=block");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      res.setHeader(
        "Permissions-Policy",
        "geolocation=*, camera=(), microphone=()",
      );
      next();
    });

    // CORS preflight handling
    this.app.options("*", cors(corsOptions));
  }

  // ============================================================
  // INITIALIZE ROUTES
  // ============================================================

  private initializeRoutes(): void {
    // Mount main routes
    this.app.use("/", routes);

    // Health check endpoint
    this.app.get("/health", (req: Request, res: Response) => {
      res.status(200).json({
        status: "ok",
        service: "Local Service Provider Marketplace API",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
      });
    });

    // Root endpoint
    this.app.get("/", (req: Request, res: Response) => {
      res.status(200).json({
        name: "Local Service Provider Marketplace API",
        version: "1.0.0",
        status: "active",
        documentation: "/api-docs",
        endpoints: {
          health: "/health",
          api: "/api/v1",
          docs: "/api-docs",
        },
      });
    });
  }

  // ============================================================
  // INITIALIZE ERROR HANDLING
  // ============================================================

  private initializeErrorHandling(): void {
    // 404 Not Found handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  // ============================================================
  // INITIALIZE DOCUMENTATION
  // ============================================================

  private initializeDocumentation(): void {
    // Setup Swagger documentation
    setupSwagger(this.app);
  }

  // ============================================================
  // CONNECT TO SERVICES
  // ============================================================

  public async connectServices(): Promise<void> {
    try {
      logger.info("Connecting to services...");

      // Connect to database
      await connectDatabase();
      logger.info("Database connected successfully");

      // Connect to Redis
      await connectRedis();
      logger.info("Redis connected successfully");

      // Initialize Cloudinary
      initializeCloudinary();
      logger.info("Cloudinary initialized successfully");

      logger.info("All services connected successfully");
    } catch (error) {
      logger.error("Failed to connect to services:", error);
      throw error;
    }
  }

  // ============================================================
  // START SERVER
  // ============================================================

  public async startServer(port: number): Promise<void> {
    try {
      // Connect to all services
      await this.connectServices();

      // Create HTTP server
      this.server = createServer(this.app);

      // Start listening
      this.server.listen(port, () => {
        logger.info(`Server running on port ${port}`);
        logger.info(`Environment: ${env.NODE_ENV}`);
        logger.info(`API Documentation: http://localhost:${port}/api-docs`);
        logger.info(`Health Check: http://localhost:${port}/health`);
      });

      // Handle server errors
      this.server.on("error", (error: Error) => {
        logger.error("Server error:", error);
        this.gracefulShutdown();
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error("Failed to start server:", error);
      process.exit(1);
    }
  }

  // ============================================================
  // GRACEFUL SHUTDOWN
  // ============================================================

  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      await this.gracefulShutdown();
    };

    // Handle process termination signals
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
    process.on("SIGHUP", shutdown);

    // Handle uncaught exceptions
    process.on("uncaughtException", async (error: Error) => {
      logger.error("Uncaught exception:", error);
      await this.gracefulShutdown();
    });

    // Handle unhandled rejections
    process.on("unhandledRejection", async (reason: any) => {
      logger.error("Unhandled rejection:", reason);
      await this.gracefulShutdown();
    });
  }

  public async gracefulShutdown(): Promise<void> {
    if (this.isShuttingDown) {
      logger.info("Shutdown already in progress...");
      return;
    }

    this.isShuttingDown = true;
    logger.info("Starting graceful shutdown...");

    const shutdownTimeout = setTimeout(() => {
      logger.error("Shutdown timeout exceeded. Forcing exit...");
      process.exit(1);
    }, 30000);

    try {
      // Stop accepting new connections
      if (this.server) {
        logger.info("Closing HTTP server...");
        await new Promise<void>((resolve) => {
          if (!this.server) {
            resolve();
            return;
          }
          this.server!.close(() => {
            logger.info("HTTP server closed");
            resolve();
          });
        });
      }

      // Disconnect from Redis
      logger.info("Disconnecting from Redis...");
      await disconnectRedis();
      logger.info("Redis disconnected");

      // Disconnect from database
      logger.info("Disconnecting from database...");
      await disconnectDatabase();
      logger.info("Database disconnected");

      // Close logger
      logger.info("Closing logger...");

      clearTimeout(shutdownTimeout);
      logger.info("Graceful shutdown completed successfully");
      process.exit(0);
    } catch (error) {
      logger.error("Error during graceful shutdown:", error);
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  }

  // ============================================================
  // GET SERVER INSTANCE
  // ============================================================

  public getServer(): Server | null {
    return this.server;
  }

  // ============================================================
  // GET APP INSTANCE
  // ============================================================

  public getApp(): Application {
    return this.app;
  }
}

// ============================================================
// CREATE APP INSTANCE
// ============================================================

const app = new App();

// ============================================================
// EXPORTS
// ============================================================

export { app };
export default app.getApp();
