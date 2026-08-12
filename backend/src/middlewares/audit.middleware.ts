import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware";
import { createAuditLog } from "../services/internal/admin.service";
import logger from "../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface AuditLogEntry {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  requestBody?: any;
  responseBody?: any;
}

export interface AuditConfig {
  enabled: boolean;
  logRequestBody: boolean;
  logResponseBody: boolean;
  maskSensitiveData: boolean;
  skipPaths: string[];
  sensitiveFields: string[];
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Default audit configuration
 */
const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  enabled: true,
  logRequestBody: true,
  logResponseBody: false,
  maskSensitiveData: true,
  skipPaths: ["/health", "/ping", "/api-docs", "/api-docs.json", "/robots.txt"],
  sensitiveFields: [
    "password",
    "passwordHash",
    "currentPassword",
    "newPassword",
    "confirmPassword",
    "token",
    "refreshToken",
    "accessToken",
    "secret",
    "apiKey",
    "authorization",
    "cookie",
  ],
};

/**
 * Sensitive data patterns for masking
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /authorization/i,
  /cookie/i,
  /refresh/i,
  /access/i,
  /confirm/i,
  /current/i,
  /new/i,
];

// ============================================================
// AUDIT MIDDLEWARE
// ============================================================

/**
 * Create audit middleware with configuration
 */
export function createAuditMiddleware(config: Partial<AuditConfig> = {}) {
  const cfg = { ...DEFAULT_AUDIT_CONFIG, ...config };

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!cfg.enabled) {
      return next();
    }

    // Skip audit for specified paths
    if (
      cfg.skipPaths.includes(req.path) ||
      cfg.skipPaths.some((p) => req.path.startsWith(p))
    ) {
      return next();
    }

    const startTime = Date.now();
    const requestId =
      (req.headers["x-request-id"] as string) || generateRequestId();

    // Store original end function
    const originalEnd = res.end;
    const chunks: Buffer[] = [];

    // Capture response body if configured
    if (cfg.logResponseBody) {
      const originalWrite = res.write;
      const originalJson = res.json;
      const originalSend = res.send;

      // Override write to capture chunks
      res.write = function (chunk: any): boolean {
        if (chunk) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return originalWrite.apply(this, arguments as any);
      };

      // Override json to capture response
      res.json = function (body: any): Response {
        (res as any)._jsonBody = body;
        return originalJson.apply(this, arguments as any);
      };

      // Override send to capture response
      res.send = function (body: any): Response {
        if (body && typeof body !== "string" && !Buffer.isBuffer(body)) {
          (res as any)._sendBody = body;
        }
        return originalSend.apply(this, arguments as any);
      };
    }

    // Override end to capture response data
    res.end = function (chunk?: any, encoding?: any, cb?: any): any {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Get user from request if authenticated
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      // Build audit log
      const auditEntry: AuditLogEntry = {
        userId,
        action: `${req.method} ${req.path}`,
        entity: getEntityFromPath(req.path),
        entityId:
          req.params?.id ||
          req.params?.bookingId ||
          req.params?.providerId ||
          undefined,
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"],
        method: req.method,
        path: req.path,
        statusCode,
        duration,
      };

      // Add request body if configured
      if (cfg.logRequestBody && req.body && Object.keys(req.body).length > 0) {
        auditEntry.requestBody = cfg.maskSensitiveData
          ? maskSensitiveData(req.body, cfg.sensitiveFields)
          : req.body;
      }

      // Add response body if configured and captured
      if (cfg.logResponseBody) {
        const responseBody = getResponseBody(res);
        if (responseBody) {
          auditEntry.responseBody = cfg.maskSensitiveData
            ? maskSensitiveData(responseBody, cfg.sensitiveFields)
            : responseBody;
        }
      }

      // Log audit entry
      logAuditEntry(auditEntry);

      // Log request summary
      logger.http(`${req.method} ${req.path} ${statusCode} ${duration}ms`, {
        requestId,
        userId,
        method: req.method,
        path: req.path,
        statusCode,
        duration,
        ip: auditEntry.ipAddress,
      });

      // Call original end
      return originalEnd.apply(this, arguments as any);
    };

    // Add request ID to response headers
    res.setHeader("X-Request-ID", requestId);

    // Store request ID for use in controllers
    (req as any).requestId = requestId;

    next();
  };
}

/**
 * Default audit middleware instance
 */
export const auditMiddleware = createAuditMiddleware();

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Get client IP address
 */
function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

/**
 * Get entity name from path
 */
function getEntityFromPath(path: string): string {
  const segments = path.split("/").filter((s) => s && !s.startsWith(":"));
  if (segments.length === 0) return "root";

  // Handle admin routes
  if (segments[0] === "admin") {
    return segments[1] || "admin";
  }

  // Handle API version prefix
  if (segments[0] === "api" && segments[1] === "v1") {
    return segments[2] || "api";
  }

  return segments[0] || "api";
}

/**
 * Get response body from response object
 */
function getResponseBody(res: Response): any {
  const jsonBody = (res as any)._jsonBody;
  if (jsonBody !== undefined) {
    return jsonBody;
  }

  const sendBody = (res as any)._sendBody;
  if (sendBody !== undefined) {
    return sendBody;
  }

  return null;
}

/**
 * Mask sensitive data in an object
 */
function maskSensitiveData(obj: any, sensitiveFields: string[]): any {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveData(item, sensitiveFields));
  }

  const result: any = {};
  const allSensitiveFields = [
    ...sensitiveFields,
    ...DEFAULT_AUDIT_CONFIG.sensitiveFields,
  ];

  for (const [key, value] of Object.entries(obj)) {
    // Check if this is a sensitive field
    const isSensitive =
      allSensitiveFields.some((field) =>
        key.toLowerCase().includes(field.toLowerCase()),
      ) || SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));

    if (isSensitive && value !== null && value !== undefined) {
      // Mask the value
      result[key] = maskValue(value);
    } else if (typeof value === "object" && value !== null) {
      // Recursively process nested objects
      result[key] = maskSensitiveData(value, sensitiveFields);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Mask a single value
 */
function maskValue(value: any): string {
  if (value === null || value === undefined) {
    return value;
  }

  const strValue = String(value);
  if (strValue.length <= 2) {
    return "***";
  }

  // Keep first and last character visible
  const first = strValue.charAt(0);
  const last = strValue.charAt(strValue.length - 1);
  const middle = "*".repeat(Math.min(strValue.length - 2, 8));

  return `${first}${middle}${last}`;
}

/**
 * Log audit entry
 */
function logAuditEntry(entry: AuditLogEntry): void {
  try {
    // Log to database via admin service
    createAuditLog({
      userId: entry.userId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      changes: {
        method: entry.method,
        path: entry.path,
        statusCode: entry.statusCode,
        duration: entry.duration,
        requestBody: entry.requestBody,
        responseBody: entry.responseBody,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    }).catch((error) => {
      // Don't let audit failures break the request
      logger.error("Failed to log audit entry:", error);
    });

    // Also log to file for security monitoring
    logger.info(`AUDIT: ${entry.action}`, {
      userId: entry.userId,
      entity: entry.entity,
      statusCode: entry.statusCode,
      duration: entry.duration,
      ip: entry.ipAddress,
    });
  } catch (error) {
    // Don't let audit failures break the request
    logger.error("Audit logging failed:", error);
  }
}

// ============================================================
// SKIP AUDIT FOR SPECIFIC PATHS
// ============================================================

/**
 * Skip audit for static assets and health checks
 */
export function skipAudit(...paths: string[]) {
  return createAuditMiddleware({
    skipPaths: [...DEFAULT_AUDIT_CONFIG.skipPaths, ...paths],
  });
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  createAuditMiddleware,
  auditMiddleware,
  skipAudit,
  generateRequestId,
  getClientIp,
  maskSensitiveData,
};
