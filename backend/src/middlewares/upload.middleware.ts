import multer from "multer";
import { Request, Response, NextFunction } from "express";
import path from "path";
import { randomBytes } from "crypto";
import {
  FileUploadError,
  FileSizeExceededError,
  InvalidFileTypeError,
} from "../types/error.types";
import logger from "../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface UploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  fieldName?: string;
  maxCount?: number;
  destination?: string;
  preserveOriginalName?: boolean;
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
}

export interface UploadResult {
  files: UploadedFile[];
  errors?: UploadError[];
}

export interface UploadError {
  field: string;
  message: string;
  code: string;
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Default upload limits
 */
export const UPLOAD_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  AVATAR: 2 * 1024 * 1024, // 2MB
  VIDEO: 50 * 1024 * 1024, // 50MB
};

/**
 * Allowed file types
 */
export const ALLOWED_TYPES = {
  IMAGE: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/tiff",
    "image/bmp",
  ],
  DOCUMENT: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
  ],
  AVATAR: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  PROVIDER: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],
};

/**
 * Default file field names
 */
export const FIELD_NAMES = {
  AVATAR: "avatar",
  IMAGE: "image",
  IMAGES: "images",
  DOCUMENT: "document",
  PROVIDER_LOGO: "businessLogo",
  SERVICE_IMAGE: "serviceImage",
  SERVICE_IMAGES: "serviceImages",
  REVIEW_IMAGE: "reviewImage",
};

// ============================================================
// MEMORY STORAGE
// ============================================================

/**
 * Memory storage for multer (files stored as buffers)
 */
export const memoryStorage = multer.memoryStorage();

// ============================================================
// FILE FILTERS
// ============================================================

/**
 * Image file filter
 */
export const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void => {
  if (ALLOWED_TYPES.IMAGE.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new InvalidFileTypeError(
        `Invalid image type. Allowed: ${ALLOWED_TYPES.IMAGE.join(", ")}`,
      ),
    );
  }
};

/**
 * Document file filter
 */
export const documentFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void => {
  if (ALLOWED_TYPES.DOCUMENT.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new InvalidFileTypeError(
        `Invalid document type. Allowed: ${ALLOWED_TYPES.DOCUMENT.join(", ")}`,
      ),
    );
  }
};

/**
 * Avatar file filter
 */
export const avatarFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void => {
  if (ALLOWED_TYPES.AVATAR.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new InvalidFileTypeError(
        `Invalid avatar type. Allowed: ${ALLOWED_TYPES.AVATAR.join(", ")}`,
      ),
    );
  }
};

/**
 * Provider file filter (images + PDFs)
 */
export const providerFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void => {
  if (ALLOWED_TYPES.PROVIDER.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new InvalidFileTypeError(
        `Invalid file type. Allowed: ${ALLOWED_TYPES.PROVIDER.join(", ")}`,
      ),
    );
  }
};

/**
 * Custom file filter
 */
export function createFileFilter(
  allowedTypes: string[],
): (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
) => void {
  return (
    req: Request,
    file: Express.Multer.File,
    callback: multer.FileFilterCallback,
  ): void => {
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new InvalidFileTypeError(
          `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
        ),
      );
    }
  };
}

// ============================================================
// CUSTOM STORAGE (for local file storage)
// ============================================================

/**
 * Disk storage for multer (files stored on disk)
 */
export const diskStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + "-" + randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const filename = `${base}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// ============================================================
// FILE SIZE VALIDATION
// ============================================================

/**
 * Validate file size
 */
export function validateFileSize(
  file: Express.Multer.File,
  maxSize: number,
): boolean {
  if (!file) return false;
  return file.size <= maxSize;
}

/**
 * Validate file type
 */
export function validateFileType(
  file: Express.Multer.File,
  allowedTypes: string[],
): boolean {
  if (!file) return false;
  return allowedTypes.includes(file.mimetype);
}

/**
 * Validate file extension
 */
export function validateFileExtension(
  file: Express.Multer.File,
  allowedExtensions: string[],
): boolean {
  if (!file) return false;
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  return allowedExtensions.includes(ext);
}

// ============================================================
// UPLOAD MIDDLEWARE FACTORIES
// ============================================================

/**
 * Create upload middleware for single file
 */
export function uploadSingle(
  fieldName: string,
  options: UploadOptions = {},
): (req: Request, res: Response, next: NextFunction) => void {
  const maxSize = options.maxSize || UPLOAD_LIMITS.IMAGE;
  const allowedTypes = options.allowedTypes || ALLOWED_TYPES.IMAGE;
  const filter = createFileFilter(allowedTypes);

  const upload = multer({
    storage: memoryStorage,
    limits: {
      fileSize: maxSize,
    },
    fileFilter: filter,
  }).single(fieldName);

  return (req: Request, res: Response, next: NextFunction): void => {
    upload(req, res, (err: any) => {
      if (err) {
        // Handle multer errors
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return next(
              new FileSizeExceededError(
                `File size exceeds limit of ${maxSize / (1024 * 1024)}MB`,
              ),
            );
          }
          return next(new FileUploadError(err.message));
        }
        return next(err);
      }
      // File uploaded successfully
      next();
    });
  };
}

/**
 * Create upload middleware for multiple files
 */
export function uploadMultiple(
  fieldName: string,
  options: UploadOptions = {},
): (req: Request, res: Response, next: NextFunction) => void {
  const maxSize = options.maxSize || UPLOAD_LIMITS.IMAGE;
  const maxCount = options.maxCount || 5;
  const allowedTypes = options.allowedTypes || ALLOWED_TYPES.IMAGE;
  const filter = createFileFilter(allowedTypes);

  const upload = multer({
    storage: memoryStorage,
    limits: {
      fileSize: maxSize,
    },
    fileFilter: filter,
  }).array(fieldName, maxCount);

  return (req: Request, res: Response, next: NextFunction): void => {
    upload(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return next(
              new FileSizeExceededError(
                `File size exceeds limit of ${maxSize / (1024 * 1024)}MB`,
              ),
            );
          }
          if (err.code === "LIMIT_FILE_COUNT") {
            return next(
              new FileUploadError(`Maximum ${maxCount} files allowed`),
            );
          }
          return next(new FileUploadError(err.message));
        }
        return next(err);
      }
      next();
    });
  };
}

/**
 * Create upload middleware for multiple fields
 */
export function uploadFields(
  fields: { name: string; maxCount?: number }[],
  options: UploadOptions = {},
): (req: Request, res: Response, next: NextFunction) => void {
  const maxSize = options.maxSize || UPLOAD_LIMITS.IMAGE;
  const allowedTypes = options.allowedTypes || ALLOWED_TYPES.IMAGE;
  const filter = createFileFilter(allowedTypes);

  const upload = multer({
    storage: memoryStorage,
    limits: {
      fileSize: maxSize,
    },
    fileFilter: filter,
  }).fields(fields);

  return (req: Request, res: Response, next: NextFunction): void => {
    upload(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return next(
              new FileSizeExceededError(
                `File size exceeds limit of ${maxSize / (1024 * 1024)}MB`,
              ),
            );
          }
          return next(new FileUploadError(err.message));
        }
        return next(err);
      }
      next();
    });
  };
}

// ============================================================
// PRE-CONFIGURED UPLOAD MIDDLEWARES
// ============================================================

/**
 * Avatar upload (single image, max 2MB)
 */
export const avatarUpload = uploadSingle(FIELD_NAMES.AVATAR, {
  maxSize: UPLOAD_LIMITS.AVATAR,
  allowedTypes: ALLOWED_TYPES.AVATAR,
});

/**
 * Image upload (single image, max 5MB)
 */
export const imageUpload = uploadSingle(FIELD_NAMES.IMAGE, {
  maxSize: UPLOAD_LIMITS.IMAGE,
  allowedTypes: ALLOWED_TYPES.IMAGE,
});

/**
 * Multiple images upload (max 5 images, 5MB each)
 */
export const imagesUpload = uploadMultiple(FIELD_NAMES.IMAGES, {
  maxSize: UPLOAD_LIMITS.IMAGE,
  maxCount: 5,
  allowedTypes: ALLOWED_TYPES.IMAGE,
});

/**
 * Document upload (single document, max 10MB)
 */
export const documentUpload = uploadSingle(FIELD_NAMES.DOCUMENT, {
  maxSize: UPLOAD_LIMITS.DOCUMENT,
  allowedTypes: ALLOWED_TYPES.DOCUMENT,
});

/**
 * Provider logo upload (single image, max 5MB)
 */
export const providerLogoUpload = uploadSingle(FIELD_NAMES.PROVIDER_LOGO, {
  maxSize: UPLOAD_LIMITS.IMAGE,
  allowedTypes: ALLOWED_TYPES.PROVIDER,
});

/**
 * Service image upload (single image, max 5MB)
 */
export const serviceImageUpload = uploadSingle(FIELD_NAMES.SERVICE_IMAGE, {
  maxSize: UPLOAD_LIMITS.IMAGE,
  allowedTypes: ALLOWED_TYPES.IMAGE,
});

/**
 * Multiple service images upload (max 5 images, 5MB each)
 */
export const serviceImagesUpload = uploadMultiple(FIELD_NAMES.SERVICE_IMAGES, {
  maxSize: UPLOAD_LIMITS.IMAGE,
  maxCount: 5,
  allowedTypes: ALLOWED_TYPES.IMAGE,
});

/**
 * Review image upload (single image, max 5MB)
 */
export const reviewImageUpload = uploadSingle(FIELD_NAMES.REVIEW_IMAGE, {
  maxSize: UPLOAD_LIMITS.IMAGE,
  allowedTypes: ALLOWED_TYPES.IMAGE,
});

// ============================================================
// CUSTOM UPLOAD MIDDLEWARE
// ============================================================

/**
 * Upload with custom validation
 */
export function uploadWithValidation(
  options: UploadOptions & {
    validator?: (file: Express.Multer.File) => boolean | Promise<boolean>;
    onError?: (err: Error) => void;
  },
): (req: Request, res: Response, next: NextFunction) => void {
  const {
    fieldName = "file",
    maxSize = UPLOAD_LIMITS.IMAGE,
    allowedTypes = ALLOWED_TYPES.IMAGE,
    maxCount = 1,
    validator,
    onError,
  } = options;

  const middleware =
    maxCount === 1
      ? uploadSingle(fieldName, { maxSize, allowedTypes })
      : uploadMultiple(fieldName, { maxSize, allowedTypes, maxCount });

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Apply upload middleware
    middleware(req, res, async (err: any) => {
      if (err) {
        if (onError) onError(err);
        return next(err);
      }

      // Apply custom validation if provided
      if (validator) {
        try {
          const files = req.file
            ? [req.file]
            : (req.files as Express.Multer.File[]);
          if (files && files.length > 0) {
            for (const file of files) {
              const isValid = await validator(file);
              if (!isValid) {
                const valErr = new FileUploadError("File validation failed");
                if (onError) onError(valErr);
                return next(valErr);
              }
            }
          }
        } catch (valErr) {
          if (onError) onError(valErr as Error);
          return next(valErr);
        }
      }

      next();
    });
  };
}

// ============================================================
// ERROR HANDLING
// ============================================================

/**
 * Handle multer errors
 */
export function handleMulterError(error: any): {
  message: string;
  code: string;
  field?: string;
} {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return {
          message: `File too large. Maximum size is ${error.field || "unknown"}`,
          code: "FILE_TOO_LARGE",
          field: error.field,
        };
      case "LIMIT_FILE_COUNT":
        return {
          message: `Too many files. Maximum allowed: ${error.field || "unknown"}`,
          code: "TOO_MANY_FILES",
          field: error.field,
        };
      case "LIMIT_FIELD_KEY":
        return {
          message: "Field name too long",
          code: "FIELD_NAME_TOO_LONG",
          field: error.field,
        };
      case "LIMIT_FIELD_VALUE":
        return {
          message: "Field value too long",
          code: "FIELD_VALUE_TOO_LONG",
          field: error.field,
        };
      case "LIMIT_FIELD_COUNT":
        return {
          message: `Too many fields. Maximum: ${error.field || "unknown"}`,
          code: "TOO_MANY_FIELDS",
          field: error.field,
        };
      case "LIMIT_UNEXPECTED_FILE":
        return {
          message: `Unexpected file field: ${error.field || "unknown"}`,
          code: "UNEXPECTED_FILE",
          field: error.field,
        };
      default:
        return {
          message: error.message || "File upload error",
          code: "UPLOAD_ERROR",
          field: error.field,
        };
    }
  }

  if (
    error instanceof FileUploadError ||
    error instanceof FileSizeExceededError ||
    error instanceof InvalidFileTypeError
  ) {
    return {
      message: error.message,
      code: error.code || "UPLOAD_ERROR",
    };
  }

  return {
    message: error.message || "Unknown upload error",
    code: "UNKNOWN_ERROR",
  };
}

// ============================================================
// FILE UTILITIES
// ============================================================

/**
 * Get file extension from mime type
 */
export function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/tiff": "tiff",
    "image/bmp": "bmp",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "pptx",
    "text/plain": "txt",
    "text/csv": "csv",
  };

  return map[mimeType] || "bin";
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(
  originalName: string,
  prefix: string = "",
): string {
  const timestamp = Date.now();
  const random = randomBytes(8).toString("hex");
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const cleanBase = base.replace(/[^a-zA-Z0-9]/g, "-");
  const name = prefix
    ? `${prefix}-${cleanBase}-${timestamp}-${random}`
    : `${cleanBase}-${timestamp}-${random}`;
  return name + ext;
}

/**
 * Check if file is image
 */
export function isImage(file: UploadedFile): boolean {
  return ALLOWED_TYPES.IMAGE.includes(file.mimetype);
}

/**
 * Check if file is document
 */
export function isDocument(file: UploadedFile): boolean {
  return ALLOWED_TYPES.DOCUMENT.includes(file.mimetype);
}

/**
 * Check if file is avatar
 */
export function isAvatar(file: UploadedFile): boolean {
  return ALLOWED_TYPES.AVATAR.includes(file.mimetype);
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Types
  UploadOptions,
  UploadedFile,
  UploadResult,
  UploadError,

  // Constants
  UPLOAD_LIMITS,
  ALLOWED_TYPES,
  FIELD_NAMES,

  // Storage
  memoryStorage,
  diskStorage,

  // Filters
  imageFilter,
  documentFilter,
  avatarFilter,
  providerFilter,
  createFileFilter,

  // Validation
  validateFileSize,
  validateFileType,
  validateFileExtension,

  // Middleware factories
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadWithValidation,

  // Pre-configured
  avatarUpload,
  imageUpload,
  imagesUpload,
  documentUpload,
  providerLogoUpload,
  serviceImageUpload,
  serviceImagesUpload,
  reviewImageUpload,

  // Error handling
  handleMulterError,

  // Utilities
  getExtensionFromMime,
  generateUniqueFilename,
  isImage,
  isDocument,
  isAvatar,
};
