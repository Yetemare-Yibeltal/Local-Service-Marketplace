import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiOptions,
} from "cloudinary";
import env from "./env";
import logger from "../utils/logger";

// ============================================================
// CLOUDINARY CONFIGURATION
// ============================================================

/**
 * Initialize Cloudinary with credentials
 */
export function initializeCloudinary(): void {
  try {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: env.NODE_ENV === "production",
    });

    logger.info("Cloudinary initialized successfully");
  } catch (error) {
    logger.error("Cloudinary initialization failed:", error);
    throw error;
  }
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload an image to Cloudinary
 */
export async function uploadImage(
  file: Buffer | string,
  options: UploadApiOptions = {},
): Promise<UploadApiResponse> {
  try {
    if (!isCloudinaryConfigured()) {
      throw new Error("Cloudinary is not configured");
    }

    const uploadOptions: UploadApiOptions = {
      folder: options.folder || "marketplace",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
      transformation: options.transformation || [
        {
          quality: "auto",
          fetch_format: "auto",
        },
      ],
      ...options,
    };

    const result = await cloudinary.uploader.upload(file, uploadOptions);

    logger.debug(`Image uploaded to Cloudinary: ${result.public_id}`);

    return result;
  } catch (error) {
    logger.error("Cloudinary upload failed:", error);
    throw error;
  }
}

/**
 * Upload a single image with specific folder
 */
export async function uploadSingleImage(
  file: Buffer,
  folder: string,
  fileName?: string,
): Promise<UploadApiResponse> {
  return uploadImage(file, {
    folder: `marketplace/${folder}`,
    public_id: fileName,
  });
}

/**
 * Upload multiple images
 */
export async function uploadMultipleImages(
  files: Buffer[],
  folder: string,
): Promise<UploadApiResponse[]> {
  const uploadPromises = files.map((file) =>
    uploadImage(file, {
      folder: `marketplace/${folder}`,
    }),
  );

  return Promise.all(uploadPromises);
}

/**
 * Upload an avatar image
 */
export async function uploadAvatar(
  file: Buffer,
  userId: string,
): Promise<UploadApiResponse> {
  return uploadImage(file, {
    folder: "marketplace/avatars",
    public_id: `user_${userId}_${Date.now()}`,
    transformation: [
      {
        width: 400,
        height: 400,
        crop: "fill",
        gravity: "face",
      },
      {
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  });
}

/**
 * Upload a provider logo
 */
export async function uploadProviderLogo(
  file: Buffer,
  providerId: string,
): Promise<UploadApiResponse> {
  return uploadImage(file, {
    folder: "marketplace/providers",
    public_id: `provider_${providerId}_logo_${Date.now()}`,
    transformation: [
      {
        width: 500,
        height: 500,
        crop: "fill",
      },
      {
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  });
}

/**
 * Upload a service image
 */
export async function uploadServiceImage(
  file: Buffer,
  serviceId: string,
): Promise<UploadApiResponse> {
  return uploadImage(file, {
    folder: "marketplace/services",
    public_id: `service_${serviceId}_${Date.now()}`,
    transformation: [
      {
        width: 800,
        height: 600,
        crop: "fill",
      },
      {
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  });
}

/**
 * Upload a review image
 */
export async function uploadReviewImage(
  file: Buffer,
  reviewId: string,
): Promise<UploadApiResponse> {
  return uploadImage(file, {
    folder: "marketplace/reviews",
    public_id: `review_${reviewId}_${Date.now()}`,
    transformation: [
      {
        width: 600,
        height: 600,
        crop: "limit",
      },
      {
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  });
}

/**
 * Upload a provider document (PDF, etc.)
 */
export async function uploadDocument(
  file: Buffer,
  providerId: string,
  documentType: string,
): Promise<UploadApiResponse> {
  return uploadImage(file, {
    folder: "marketplace/documents",
    public_id: `provider_${providerId}_${documentType}_${Date.now()}`,
    resource_type: "auto",
    allowed_formats: ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
  });
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    if (!publicId) {
      logger.warn("Delete image called with empty publicId");
      return false;
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      logger.debug(`Image deleted from Cloudinary: ${publicId}`);
      return true;
    }

    logger.warn(`Image deletion failed for ${publicId}: ${result.result}`);
    return false;
  } catch (error) {
    logger.error(`Cloudinary deletion failed for ${publicId}:`, error);
    return false;
  }
}

/**
 * Delete multiple images
 */
export async function deleteMultipleImages(
  publicIds: string[],
): Promise<boolean[]> {
  const deletePromises = publicIds.map((publicId) => deleteImage(publicId));
  return Promise.all(deletePromises);
}

/**
 * Get a public URL for an image
 */
export function getImageUrl(publicId: string, options: any = {}): string {
  try {
    return cloudinary.url(publicId, {
      secure: true,
      quality: "auto",
      fetch_format: "auto",
      ...options,
    });
  } catch (error) {
    logger.error(`Failed to get image URL for ${publicId}:`, error);
    return "";
  }
}

/**
 * Get a thumbnail URL for an image
 */
export function getThumbnailUrl(
  publicId: string,
  width: number = 200,
  height: number = 200,
): string {
  try {
    return cloudinary.url(publicId, {
      secure: true,
      width,
      height,
      crop: "fill",
      quality: "auto",
      fetch_format: "auto",
    });
  } catch (error) {
    logger.error(`Failed to get thumbnail URL for ${publicId}:`, error);
    return "";
  }
}

/**
 * Get optimized URL for an image
 */
export function getOptimizedUrl(publicId: string): string {
  try {
    return cloudinary.url(publicId, {
      secure: true,
      quality: "auto:best",
      fetch_format: "auto",
      dpr: "auto",
    });
  } catch (error) {
    logger.error(`Failed to get optimized URL for ${publicId}:`, error);
    return "";
  }
}

/**
 * Health check for Cloudinary
 */
export async function cloudinaryHealthCheck(): Promise<boolean> {
  try {
    if (!isCloudinaryConfigured()) {
      return false;
    }

    // Ping Cloudinary by attempting to get account details
    const result = await cloudinary.api.ping();
    return result.status === "ok";
  } catch (error) {
    logger.error("Cloudinary health check failed:", error);
    return false;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  initializeCloudinary,
  isCloudinaryConfigured,
  uploadImage,
  uploadSingleImage,
  uploadMultipleImages,
  uploadAvatar,
  uploadProviderLogo,
  uploadServiceImage,
  uploadReviewImage,
  uploadDocument,
  deleteImage,
  deleteMultipleImages,
  getImageUrl,
  getThumbnailUrl,
  getOptimizedUrl,
  cloudinaryHealthCheck,
};
