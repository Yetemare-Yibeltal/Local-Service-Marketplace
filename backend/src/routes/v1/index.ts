import { Router, Request, Response, NextFunction } from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";

// Import all route modules
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import providerRoutes from "./provider.routes";
import bookingRoutes from "./booking.routes";
import adminRoutes from "./admin.routes";
import reviewRoutes from "./review.routes";
import categoryRoutes from "./category.routes";
import searchRoutes from "./search.routes";
import notificationRoutes from "./notification.routes";
import analyticsRoutes from "./analytics.routes";
import paymentRoutes from "./payment.routes";
import webhookRoutes from "./webhook.routes";

// Import middleware
import { authenticate } from "../../middlewares/auth.middleware";
import {
  errorHandler,
  notFoundHandler,
} from "../../middlewares/error.middleware";
import { standardRateLimiter } from "../../config/rateLimit";
import { corsOptions } from "../../config/cors";
import { morganStream } from "../../config/logger";
import logger from "../../utils/logger";

// ============================================================
// V1 ROUTER
// ============================================================

const v1Router = Router();

// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================

// Security middleware
v1Router.use(helmet());

// CORS middleware
v1Router.use(cors(corsOptions));

// Compression middleware
v1Router.use(compression());

// Request logging middleware
v1Router.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log request
  logger.http(`${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.headers["x-forwarded-for"],
    userAgent: req.headers["user-agent"],
  });

  // Log response
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.http(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
      {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        ip: req.ip || req.headers["x-forwarded-for"],
      },
    );
  });

  next();
});

// Rate limiting for all API routes (except webhooks)
v1Router.use((req: Request, res: Response, next: NextFunction) => {
  // Skip rate limiting for webhook routes
  if (req.path.startsWith("/webhooks")) {
    return next();
  }
  return standardRateLimiter(req, res, next);
});

// ============================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================

// Health check endpoint
v1Router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "Local Service Provider Marketplace API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Auth routes (public)
v1Router.use("/auth", authRoutes);

// Webhook routes (public - must be accessible without auth)
v1Router.use("/webhooks", webhookRoutes);

// ============================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================

// Apply authentication middleware to all protected routes
v1Router.use(authenticate);

// User routes
v1Router.use("/users", userRoutes);

// Provider routes
v1Router.use("/providers", providerRoutes);

// Booking routes
v1Router.use("/bookings", bookingRoutes);

// Admin routes (admin only - but admin middleware is inside routes)
v1Router.use("/admin", adminRoutes);

// Review routes
v1Router.use("/reviews", reviewRoutes);

// Category routes (some endpoints are public, auth applied inside)
v1Router.use("/categories", categoryRoutes);

// Search routes (some endpoints are public, auth applied inside)
v1Router.use("/search", searchRoutes);

// Notification routes
v1Router.use("/notifications", notificationRoutes);

// Analytics routes (admin/provider only)
v1Router.use("/analytics", analyticsRoutes);

// Payment routes
v1Router.use("/payments", paymentRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 Not Found handler
v1Router.use(notFoundHandler);

// Global error handler
v1Router.use(errorHandler);

// ============================================================
// EXPORTS
// ============================================================

export default v1Router;
