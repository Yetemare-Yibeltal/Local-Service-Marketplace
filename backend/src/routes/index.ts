import { Router, Request, Response, NextFunction } from "express";
import v1Router from "./v1";
import { sendSuccess } from "../utils/response";
import logger from "../utils/logger";

// ============================================================
// MAIN ROUTER
// ============================================================

const router = Router();

// ============================================================
// API VERSION INFORMATION
// ============================================================

const API_INFO = {
  name: "Local Service Provider Marketplace API",
  version: "1.0.0",
  status: "active",
  description:
    "RESTful API for connecting customers with local service professionals",
  documentation: "/api-docs",
  endpoints: {
    v1: "/api/v1",
    health: "/health",
    docs: "/api-docs",
  },
};

// ============================================================
// ROOT ENDPOINTS
// ============================================================

/**
 * @route GET /
 * @description API root endpoint - returns API information
 * @returns { API_INFO } with 200 status
 */
router.get("/", (req: Request, res: Response) => {
  sendSuccess(res, API_INFO, "API information retrieved successfully");
});

/**
 * @route GET /health
 * @description Health check endpoint - verifies API is running
 * @returns { status, service, version, timestamp } with 200 status
 */
router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "Local Service Provider Marketplace API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

/**
 * @route GET /ping
 * @description Simple ping endpoint for connectivity testing
 * @returns { pong: true, timestamp } with 200 status
 */
router.get("/ping", (req: Request, res: Response) => {
  res.status(200).json({
    pong: true,
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route GET /robots.txt
 * @description Robots.txt file for search engine crawlers
 * @returns { text } with 200 status
 */
router.get("/robots.txt", (req: Request, res: Response) => {
  res.type("text/plain");
  res.send(`# Local Service Provider Marketplace API
# Allow all crawlers
User-agent: *
Allow: /

# Disallow admin routes
User-agent: *
Disallow: /api/v1/admin/
Disallow: /api/v1/users/
Disallow: /api/v1/payments/

# Sitemap location
Sitemap: ${process.env.CORS_ORIGIN || "http://localhost:3000"}/sitemap.xml
`);
});

/**
 * @route GET /api-docs
 * @description Redirect to Swagger API documentation
 * @returns { redirect } with 302 status
 */
router.get("/api-docs", (req: Request, res: Response) => {
  res.redirect("/api-docs");
});

/**
 * @route GET /api-docs.json
 * @description OpenAPI specification in JSON format
 * @returns { openapi spec } with 200 status
 */
router.get("/api-docs.json", (req: Request, res: Response) => {
  // This is handled by the swagger configuration
  res.redirect("/api-docs.json");
});

// ============================================================
// MOUNT V1 ROUTES
// ============================================================

/**
 * All API v1 routes are mounted under /api/v1
 */
router.use("/api/v1", v1Router);

// ============================================================
// REQUEST LOGGING
// ============================================================

// Log all unmatched routes
router.use((req: Request, res: Response, next: NextFunction) => {
  if (!res.headersSent) {
    logger.warn(`Unmatched route: ${req.method} ${req.originalUrl}`);
  }
  next();
});

// ============================================================
// EXPORTS
// ============================================================

export default router;
