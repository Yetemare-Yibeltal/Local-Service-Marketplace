import multer from "multer";
import path from "path";
import { Request } from "express";

// ============================================================
// FILE CONSTANTS
// ============================================================

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

export const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// ============================================================
// FILE FILTERS
// ============================================================

/**
 * Filter for image uploads
 */
export const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new Error(
        `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
      ),
    );
  }
};

/**
 * Filter for document uploads
 */
export const documentFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void => {
  if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new Error(
        `Invalid file type. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(", ")}`,
      ),
    );
  }
};

/**
 * Filter for avatar uploads
 */
export const avatarFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void => {
  if (ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new Error(
        `Invalid file type. Allowed types: ${ALLOWED_AVATAR_TYPES.join(", ")}`,
      ),
    );
  }
};

// ============================================================
// MULTER STORAGE CONFIGURATION
// ============================================================

/**
 * Memory storage for multer (files will be stored in memory as buffers)
 * This is used when uploading to Cloudinary directly from memory
 */
export const memoryStorage = multer.memoryStorage();

// ============================================================
// MULTER CONFIGURATIONS
// ============================================================

/**
 * Configuration for avatar uploads
 */
export const avatarUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: avatarFilter,
});

/**
 * Configuration for image uploads
 */
export const imageUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 10,
  },
  fileFilter: imageFilter,
});

/**
 * Configuration for document uploads
 */
export const documentUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 5,
  },
  fileFilter: documentFilter,
});

/**
 * Configuration for single image upload
 */
export const singleImageUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
  fileFilter: imageFilter,
});

/**
 * Configuration for multiple images upload
 * Maximum 5 images at once
 */
export const multipleImagesUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 5,
  },
  fileFilter: imageFilter,
});

/**
 * Configuration for provider document upload
 * Maximum 3 documents at once
 */
export const providerDocumentUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 3,
  },
  fileFilter: documentFilter,
});

/**
 * Configuration for service image upload
 * Maximum 5 images at once
 */
export const serviceImageUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 5,
  },
  fileFilter: imageFilter,
});

/**
 * Configuration for review image upload
 * Maximum 3 images at once
 */
export const reviewImageUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 3,
  },
  fileFilter: imageFilter,
});

// ============================================================
// CUSTOM FILE NAMING
// ============================================================

/**
 * Generate a unique filename for uploaded files
 */
export function generateFileName(
  originalName: string,
  prefix: string = "",
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName);
  const name = path.basename(originalName, extension);
  const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

  const fileName = prefix
    ? `${prefix}-${sanitizedName}-${timestamp}-${random}${extension}`
    : `${sanitizedName}-${timestamp}-${random}${extension}`;

  return fileName;
}

/**
 * Generate a unique filename for avatar uploads
 */
export function generateAvatarFileName(originalName: string): string {
  return generateFileName(originalName, "avatar");
}

/**
 * Generate a unique filename for service images
 */
export function generateServiceImageFileName(originalName: string): string {
  return generateFileName(originalName, "service");
}

/**
 * Generate a unique filename for provider documents
 */
export function generateDocumentFileName(originalName: string): string {
  return generateFileName(originalName, "document");
}

/**
 * Generate a unique filename for review images
 */
export function generateReviewImageFileName(originalName: string): string {
  return generateFileName(originalName, "review");
}

// ============================================================
// ERROR HANDLING
// ============================================================

/**
 * Handle multer errors
 */
export function handleMulterError(error: any): {
  message: string;
  field?: string;
} {
  if (error.code === "LIMIT_FILE_SIZE") {
    return {
      message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
    };
  }

  if (error.code === "LIMIT_FILE_COUNT") {
    return {
      message:
        "Too many files uploaded. Please check the maximum allowed count.",
    };
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return {
      message: "Unexpected file field. Please check the field name.",
      field: error.field,
    };
  }

  if (error.message.includes("Invalid file type")) {
    return {
      message: error.message,
    };
  }

  return {
    message: "File upload failed. Please try again.",
  };
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_AVATAR_TYPES,
  imageFilter,
  documentFilter,
  avatarFilter,
  memoryStorage,
  avatarUpload,
  imageUpload,
  documentUpload,
  singleImageUpload,
  multipleImagesUpload,
  providerDocumentUpload,
  serviceImageUpload,
  reviewImageUpload,
  generateFileName,
  generateAvatarFileName,
  generateServiceImageFileName,
  generateDocumentFileName,
  generateReviewImageFileName,
  handleMulterError,
};
