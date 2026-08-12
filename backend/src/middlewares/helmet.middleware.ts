import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import env from '../config/env';
import logger from '../utils/logger';

// ============================================================
// TYPES
// ============================================================

export interface HelmetConfig {
  contentSecurityPolicy?: {
    directives?: Record<string, any>;
    reportOnly?: boolean;
  };
  hsts?: {
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  referrerPolicy?: {
    policy?: string | string[];
  };
  frameguard?: {
    action?: 'deny' | 'sameorigin' | 'allow-from';
    domain?: string;
  };
  noSniff?: boolean;
  xssFilter?: boolean;
  hidePoweredBy?: boolean;
  ieNoOpen?: boolean;
  originAgentCluster?: boolean;
  dnsPrefetchControl?: {
    allow?: boolean;
  };
  crossOriginOpenerPolicy?: {
    policy?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';
  };
  crossOriginResourcePolicy?: {
    policy?: 'same-origin' | 'same-site' | 'cross-origin';
  };
  crossOriginEmbedderPolicy?: {
    policy?: 'require-corp' | 'credentialless' | 'unsafe-none';
  };
  permittedCrossDomainPolicies?: {
    permittedPolicies?: 'none' | 'master-only' | 'by-content-type' | 'all';
  };
  expectCt?: {
    maxAge?: number;
    enforce?: boolean;
    reportUri?: string;
  };
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Default Helmet configuration
 */
const DEFAULT_HELMET_CONFIG: HelmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://images.unsplash.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'https://api.marketplace.com'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"],
      childSrc: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      reportUri: '/api/v1/csp-report',
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  ieNoOpen: true,
  originAgentCluster: true,
  dnsPrefetchControl: {
    allow: false,
  },
  crossOriginOpenerPolicy: {
    policy: 'same-origin',
  },
  crossOriginResourcePolicy: {
    policy: 'same-origin',
  },
  crossOriginEmbedderPolicy: {
    policy: 'require-corp',
  },
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },
  expectCt: {
    maxAge: 86400, // 1 day
    enforce: true,
  },
};

/**
 * CSP report endpoint handler
 */
let cspReports: any[] = [];

// ============================================================
// CREATE HELMET MIDDLEWARE
// ============================================================

/**
 * Create Helmet middleware with custom configuration
 */
export function createHelmetMiddleware(
  config: Partial<HelmetConfig> = {}
): ReturnType<typeof helmet> {
  const cfg = { ...DEFAULT_HELMET_CONFIG, ...config };

  const helmetConfig: any = {};

  // Content Security Policy
  if (cfg.contentSecurityPolicy) {
    // Allow unsafe-inline and unsafe-eval in development
    if (env.NODE_ENV === 'development') {
      if (cfg.contentSecurityPolicy.directives) {
        if (!cfg.contentSecurityPolicy.directives.scriptSrc) {
          cfg.contentSecurityPolicy.directives.scriptSrc = [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
          ];
        }
        if (!cfg.contentSecurityPolicy.directives.styleSrc) {
          cfg.contentSecurityPolicy.directives.styleSrc = [
            "'self'",
            "'unsafe-inline'",
          ];
        }
      }
    }

    // In production, be stricter
    if (env.NODE_ENV === 'production') {
      if (cfg.contentSecurityPolicy.directives) {
        if (cfg.contentSecurityPolicy.directives.scriptSrc) {
          // Remove unsafe-inline and unsafe-eval in production
          cfg.contentSecurityPolicy.directives.scriptSrc = cfg.contentSecurityPolicy.directives.scriptSrc.filter(
            (src: string) => src !== "'unsafe-inline'" && src !== "'unsafe-eval'"
          );
          if (cfg.contentSecurityPolicy.directives.scriptSrc.length === 0) {
            cfg.contentSecurityPolicy.directives.scriptSrc = ["'self'"];
          }
        }
        if (cfg.contentSecurityPolicy.directives.styleSrc) {
          cfg.contentSecurityPolicy.directives.styleSrc = cfg.contentSecurityPolicy.directives.styleSrc.filter(
            (src: string) => src !== "'unsafe-inline'"
          );
          if (cfg.contentSecurityPolicy.directives.styleSrc.length === 0) {
            cfg.contentSecurityPolicy.directives.styleSrc = ["'self'"];
          }
        }
      }
    }

    helmetConfig.contentSecurityPolicy = cfg.contentSecurityPolicy;
  }

  // HSTS (Strict-Transport-Security)
  if (cfg.hsts) {
    // Only enable HSTS in production
    if (env.NODE_ENV === 'production') {
      helmetConfig.hsts = cfg.hsts;
    } else {
      // Use lower max-age in development
      helmetConfig.hsts = {
        maxAge: 0,
        includeSubDomains: false,
        preload: false,
      };
    }
  }

  // Referrer Policy
  if (cfg.referrerPolicy) {
    helmetConfig.referrerPolicy = cfg.referrerPolicy;
  }

  // X-Frame-Options
  if (cfg.frameguard) {
    helmetConfig.frameguard = cfg.frameguard;
  }

  // X-Content-Type-Options
  if (cfg.noSniff !== undefined) {
    helmetConfig.noSniff = cfg.noSniff;
  }

  // X-XSS-Protection
  if (cfg.xssFilter !== undefined) {
    helmetConfig.xssFilter = cfg.xssFilter;
  }

  // X-Powered-By
  if (cfg.hidePoweredBy !== undefined) {
    helmetConfig.hidePoweredBy = cfg.hidePoweredBy;
  }

  // IE No-Open
  if (cfg.ieNoOpen !== undefined) {
    helmetConfig.ieNoOpen = cfg.ieNoOpen;
  }

  // Origin Agent Cluster
  if (cfg.originAgentCluster !== undefined) {
    helmetConfig.originAgentCluster = cfg.originAgentCluster;
  }

  // DNS Prefetch Control
  if (cfg.dnsPrefetchControl) {
    helmetConfig.dnsPrefetchControl = cfg.dnsPrefetchControl;
  }

  // Cross-Origin Opener Policy
  if (cfg.crossOriginOpenerPolicy) {
    helmetConfig.crossOriginOpenerPolicy = cfg.crossOriginOpenerPolicy;
  }

  // Cross-Origin Resource Policy
  if (cfg.crossOriginResourcePolicy) {
    helmetConfig.crossOriginResourcePolicy = cfg.crossOriginResourcePolicy;
  }

  // Cross-Origin Embedder Policy
  if (cfg.crossOriginEmbedderPolicy) {
    helmetConfig.crossOriginEmbedderPolicy = cfg.crossOriginEmbedderPolicy;
  }

  // Permitted Cross-Domain Policies
  if (cfg.permittedCrossDomainPolicies) {
    helmetConfig.permittedCrossDomainPolicies = cfg.permittedCrossDomainPolicies;
  }

  // Expect-CT
  if (cfg.expectCt) {
    helmetConfig.expectCt = cfg.expectCt;
  }

  // Remove empty configs
  Object.keys(helmetConfig).forEach((key) => {
    if (helmetConfig[key] === undefined || helmetConfig[key] === null) {
      delete helmetConfig[key];
    }
  });

  // Log configuration
  const enabledFeatures = Object.keys(helmetConfig);
  logger.info(`Helmet middleware initialized with features: ${enabledFeatures.join(', ')}`);

  return helmet(helmetConfig);
}

// ============================================================
// DEFAULT HELMET MIDDLEWARE
// ============================================================

/**
 * Default Helmet middleware instance
 */
export const helmetMiddleware = createHelmetMiddleware();

// ============================================================
// CSP REPORT ENDPOINT
// ============================================================

/**
 * CSP report handler middleware
 */
export function cspReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const report = req.body;

    if (!report || typeof report !== 'object') {
      res.status(400).json({ message: 'Invalid CSP report' });
      return;
    }

    // Store report
    cspReports.push({
      ...report,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
    });

    // Log in development
    if (env.NODE_ENV === 'development') {
      logger.warn('CSP Violation:', JSON.stringify(report, null, 2));
    }

    // Keep only last 1000 reports
    if (cspReports.length > 1000) {
      cspReports = cspReports.slice(-1000);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('CSP report handler error:', error);
    res.status(500).json({ message: 'Error processing CSP report' });
  }
}

/**
 * Get CSP reports (admin only - should be protected)
 */
export function getCspReports(): any[] {
  return cspReports;
}

/**
 * Clear CSP reports
 */
export function clearCspReports(): void {
  cspReports = [];
}

// ============================================================
// CUSTOM HELMET MIDDLEWARES
// ============================================================

/**
 * Strict Helmet configuration (production)
 */
export const strictHelmet = createHelmetMiddleware({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"],
      childSrc: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  crossOriginOpenerPolicy: {
    policy: 'same-origin',
  },
  crossOriginResourcePolicy: {
    policy: 'same-origin',
  },
});

/**
 * Permissive Helmet configuration (development)
 */
export const permissiveHelmet = createHelmetMiddleware({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', '*'],
      connectSrc: ["'self'", '*'],
      fontSrc: ["'self'", '*'],
      frameSrc: ["'self'", '*'],
      objectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"],
      childSrc: ["'self'", '*'],
      formAction: ["'self'", '*'],
      baseUri: ["'self'"],
    },
  },
  hsts: {
    maxAge: 0,
    includeSubDomains: false,
    preload: false,
  },
  crossOriginOpenerPolicy: {
    policy: 'unsafe-none',
  },
  crossOriginResourcePolicy: {
    policy: 'cross-origin',
  },
});

/**
 * API-only Helmet configuration (minimal for REST API)
 */
export const apiHelmet = createHelmetMiddleware({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'none'"],
      styleSrc: ["'none'"],
      imgSrc: ["'self'", 'data:'],
      fontSrc: ["'none'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
      manifestSrc: ["'none'"],
      workerSrc: ["'none'"],
      childSrc: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
});

// ============================================================
// SECURITY HEADERS HELPERS
// ============================================================

/**
 * Set custom security headers
 */
export function setSecurityHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Additional security headers not covered by Helmet
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');

  next();
}

/**
 * Log security headers
 */
export function logSecurityHeaders(req: Request, res: Response): void {
  const headers = {
    'X-Content-Type-Options': res.getHeader('X-Content-Type-Options'),
    'X-Frame-Options': res.getHeader('X-Frame-Options'),
    'X-XSS-Protection': res.getHeader('X-XSS-Protection'),
    'Referrer-Policy': res.getHeader('Referrer-Policy'),
    'Permissions-Policy': res.getHeader('Permissions-Policy'),
    'Content-Security-Policy': res.getHeader('Content-Security-Policy'),
    'Strict-Transport-Security': res.getHeader('Strict-Transport-Security'),
  };

  logger.debug('Security headers set:', headers);
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Main middleware
  helmetMiddleware,

  // Custom middlewares
  createHelmetMiddleware,
  strictHelmet,
  permissiveHelmet,
  apiHelmet,

  // CSP handlers
  cspReportHandler,
  getCspReports,
  clearCspReports,

  // Helpers
  setSecurityHeaders,
  logSecurityHeaders,

  // Constants
  DEFAULT_HELMET_CONFIG,
};