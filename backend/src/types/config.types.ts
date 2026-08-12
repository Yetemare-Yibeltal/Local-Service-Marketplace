// ============================================================
// CONFIG TYPES
// Complete configuration type definitions for the application
// ============================================================

// ============================================================
// ENVIRONMENT TYPES
// ============================================================

/**
 * Node environment enum
 */
export type NodeEnv = "development" | "test" | "production" | "staging";

/**
 * Environment variables
 */
export interface EnvironmentVariables {
  NODE_ENV: NodeEnv;
  PORT: number;
  API_URL: string;
  APP_URL: string;
  CORS_ORIGIN: string;
}

// ============================================================
// DATABASE CONFIGURATION
// ============================================================

/**
 * Database configuration
 */
export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: {
    enabled: boolean;
    rejectUnauthorized: boolean;
    ca?: string;
    key?: string;
    cert?: string;
  };
  pool: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
  };
  migration: {
    enabled: boolean;
    tableName: string;
    directory: string;
  };
  logging: {
    enabled: boolean;
    level: "none" | "query" | "info" | "warn" | "error";
    slowQueryThreshold: number;
  };
  retry: {
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier: number;
  };
}

// ============================================================
// REDIS CONFIGURATION
// ============================================================

/**
 * Redis configuration
 */
export interface RedisConfig {
  url: string;
  host: string;
  port: number;
  password: string | null;
  database: number;
  keyPrefix: string;
  tls: {
    enabled: boolean;
    rejectUnauthorized: boolean;
  };
  connection: {
    maxRetriesPerRequest: number;
    enableReadyCheck: boolean;
    connectTimeout: number;
    keepAlive: number;
  };
  cache: {
    defaultTTL: number;
    maxSize: number;
    evictionPolicy: "lru" | "ttl" | "random";
  };
  session: {
    enabled: boolean;
    ttl: number;
  };
}

// ============================================================
// JWT CONFIGURATION
// ============================================================

/**
 * JWT configuration
 */
export interface JWTConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiry: string;
  refreshExpiry: string;
  issuer: string;
  audience: string;
  algorithms: string[];
  blacklist: {
    enabled: boolean;
    ttl: number;
  };
  token: {
    access: {
      secret: string;
      expiresIn: number | string;
    };
    refresh: {
      secret: string;
      expiresIn: number | string;
    };
  };
}

// ============================================================
// CLOUDINARY CONFIGURATION
// ============================================================

/**
 * Cloudinary configuration
 */
export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  secure: boolean;
  folder: string;
  image: {
    quality: string | number;
    format: string;
    crop: string;
    gravity: string;
  };
  transformations: {
    avatar: {
      width: number;
      height: number;
      crop: string;
      gravity: string;
    };
    thumbnail: {
      width: number;
      height: number;
      crop: string;
    };
    medium: {
      width: number;
      height: number;
      crop: string;
    };
    large: {
      width: number;
      height: number;
      crop: string;
    };
  };
  upload: {
    allowedFormats: string[];
    maxFileSize: number;
    useFilename: boolean;
    uniqueFilename: boolean;
    overwrite: boolean;
  };
}

// ============================================================
// EMAIL CONFIGURATION
// ============================================================

/**
 * Email configuration
 */
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    address: string;
  };
  templates: {
    directory: string;
    engine: "handlebars" | "ejs" | "pug";
  };
  smtp: {
    pool: boolean;
    maxConnections: number;
    maxMessages: number;
    rateLimit: number;
  };
  retry: {
    enabled: boolean;
    maxAttempts: number;
    delayMs: number;
  };
}

// ============================================================
// TWILIO CONFIGURATION
// ============================================================

/**
 * Twilio configuration
 */
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  messagingServiceSid?: string;
  statusCallback: string;
  retry: {
    enabled: boolean;
    maxAttempts: number;
    delayMs: number;
  };
  rateLimit: {
    maxPerSecond: number;
    maxPerMinute: number;
    maxPerHour: number;
  };
}

// ============================================================
// CORS CONFIGURATION
// ============================================================

/**
 * CORS configuration
 */
export interface CorsConfig {
  origin: string | string[] | boolean;
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
  preflightContinue: boolean;
  optionsSuccessStatus: number;
}

// ============================================================
// RATE LIMIT CONFIGURATION
// ============================================================

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  statusCode: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator: (req: any) => string;
  skip: (req: any) => boolean;
  handler: (req: any, res: any, next: any) => void;
  standardHeaders: boolean;
  legacyHeaders: boolean;
  limits: {
    auth: {
      windowMs: number;
      max: number;
    };
    api: {
      windowMs: number;
      max: number;
    };
    otp: {
      windowMs: number;
      max: number;
    };
    booking: {
      windowMs: number;
      max: number;
    };
    upload: {
      windowMs: number;
      max: number;
    };
  };
}

// ============================================================
// SWAGGER CONFIGURATION
// ============================================================

/**
 * Swagger configuration
 */
export interface SwaggerConfig {
  enabled: boolean;
  route: string;
  title: string;
  description: string;
  version: string;
  contact: {
    name: string;
    email: string;
    url: string;
  };
  license: {
    name: string;
    url: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  security: Array<{
    name: string;
    type: string;
    scheme: string;
    bearerFormat: string;
  }>;
  tags: Array<{
    name: string;
    description: string;
  }>;
}

// ============================================================
// MULTER CONFIGURATION
// ============================================================

/**
 * Multer configuration
 */
export interface MulterConfig {
  dest: string;
  limits: {
    fileSize: number;
    files: number;
    fields: number;
    parts: number;
  };
  fileFilter: {
    allowedMimeTypes: string[];
    allowedExtensions: string[];
  };
  storage: {
    destination: string;
    filename: (req: any, file: any, cb: any) => void;
  };
  image: {
    maxWidth: number;
    maxHeight: number;
    maxSize: number;
  };
  document: {
    maxSize: number;
    allowedTypes: string[];
  };
}

// ============================================================
// LOGGER CONFIGURATION
// ============================================================

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: "error" | "warn" | "info" | "http" | "debug";
  format: "json" | "pretty" | "simple";
  transports: {
    console: {
      enabled: boolean;
      level: string;
    };
    file: {
      enabled: boolean;
      level: string;
      filename: string;
      maxSize: number;
      maxFiles: number;
      directory: string;
    };
    database: {
      enabled: boolean;
      level: string;
      table: string;
    };
    cloud: {
      enabled: boolean;
      level: string;
      provider: "logtail" | "datadog" | "newrelic";
      apiKey: string;
    };
  };
  redaction: {
    enabled: boolean;
    paths: string[];
    censor: string;
  };
  correlationId: {
    enabled: boolean;
    header: string;
    generate: boolean;
  };
}

// ============================================================
// SESSION CONFIGURATION
// ============================================================

/**
 * Session configuration
 */
export interface SessionConfig {
  enabled: boolean;
  secret: string;
  name: string;
  cookie: {
    secure: boolean;
    httpOnly: boolean;
    maxAge: number;
    sameSite: "strict" | "lax" | "none";
    domain?: string;
    path?: string;
  };
  store: {
    type: "memory" | "redis" | "database";
    config: Record<string, any>;
  };
  saveUninitialized: boolean;
  resave: boolean;
  rolling: boolean;
}

// ============================================================
// AUTH CONFIGURATION
// ============================================================

/**
 * Authentication configuration
 */
export interface AuthConfig {
  jwt: JWTConfig;
  session: SessionConfig;
  password: {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    expiryDays: number;
    preventReuse: number;
  };
  otp: {
    length: number;
    expiryMinutes: number;
    resendCooldownSeconds: number;
    maxAttempts: number;
    lockoutMinutes: number;
  };
  social: {
    google: {
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
    };
    facebook: {
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
    };
  };
  verification: {
    email: {
      enabled: boolean;
      expiryHours: number;
    };
    phone: {
      enabled: boolean;
      expiryMinutes: number;
    };
  };
}

// ============================================================
// CACHE CONFIGURATION
// ============================================================

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean;
  provider: "redis" | "memory";
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
  keys: {
    user: {
      ttl: number;
    };
    provider: {
      ttl: number;
    };
    booking: {
      ttl: number;
    };
    category: {
      ttl: number;
    };
    search: {
      ttl: number;
    };
  };
  invalidation: {
    enabled: boolean;
    strategies: ("key" | "tag" | "pattern")[];
  };
}

// ============================================================
// INTEGRATION CONFIGURATION
// ============================================================

/**
 * Integration configuration
 */
export interface IntegrationConfig {
  mapbox: {
    accessToken: string;
    baseUrl: string;
    timeout: number;
    cache: {
      enabled: boolean;
      ttl: number;
    };
  };
  sendgrid: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
    templates: Record<string, string>;
  };
  twilio: TwilioConfig;
  cloudinary: CloudinaryConfig;
  payment: {
    telebirr: {
      enabled: boolean;
      apiKey: string;
      merchantId: string;
      callbackUrl: string;
      webhookSecret: string;
    };
    chapa: {
      enabled: boolean;
      apiKey: string;
      callbackUrl: string;
      webhookSecret: string;
    };
  };
}

// ============================================================
// APP CONFIGURATION
// ============================================================

/**
 * Complete application configuration
 */
export interface AppConfig {
  env: EnvironmentVariables;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: JWTConfig;
  cloudinary: CloudinaryConfig;
  email: EmailConfig;
  twilio: TwilioConfig;
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
  swagger: SwaggerConfig;
  multer: MulterConfig;
  logger: LoggerConfig;
  session: SessionConfig;
  auth: AuthConfig;
  cache: CacheConfig;
  integrations: IntegrationConfig;
  features: {
    bookings: {
      enabled: boolean;
      maxFutureDays: number;
      minNoticeMinutes: number;
      maxPerDay: number;
    };
    payments: {
      enabled: boolean;
      methods: string[];
      minAmount: number;
      maxAmount: number;
    };
    reviews: {
      enabled: boolean;
      requireBooking: boolean;
      maxLength: number;
    };
    disputes: {
      enabled: boolean;
      resolutionDays: number;
    };
  };
  maintenance: {
    enabled: boolean;
    message: string;
    startTime: Date | null;
    endTime: Date | null;
  };
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Environment
  NodeEnv,
  EnvironmentVariables,

  // Database
  DatabaseConfig,

  // Redis
  RedisConfig,

  // JWT
  JWTConfig,

  // Cloudinary
  CloudinaryConfig,

  // Email
  EmailConfig,

  // Twilio
  TwilioConfig,

  // CORS
  CorsConfig,

  // Rate Limit
  RateLimitConfig,

  // Swagger
  SwaggerConfig,

  // Multer
  MulterConfig,

  // Logger
  LoggerConfig,

  // Session
  SessionConfig,

  // Auth
  AuthConfig,

  // Cache
  CacheConfig,

  // Integration
  IntegrationConfig,

  // App
  AppConfig,
};
