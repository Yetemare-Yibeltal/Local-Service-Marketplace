import externalCloudinaryService from "./external/cloudinary.service";
import logger from "../utils/logger";

// ============================================================
// CLOUDINARY SERVICE (ROOT LEVEL)
// This service re-exports all functionality from the external
// Cloudinary service and adds additional application-specific
// convenience methods with predefined configurations.
// ============================================================

// Re-export all methods from the external service
export const {
  uploadFile,
  uploadImage,
  uploadAvatar,
  uploadProviderLogo,
  uploadServiceImage,
  uploadReviewImage,
  uploadCategoryImage,
  uploadDocument,
  uploadMultipleImages,
  deleteFile,
  deleteMultipleFiles,
  getImageUrl,
  getThumbnailUrl,
  getOptimizedUrl,
  getFaceCropUrl,
  getWatermarkedUrl,
  getImageInfo,
  imageExists,
  addTags,
  removeTags,
  generatePublicId,
  healthCheck,
  getFolderResources,
  deleteFolder,
  isConfiguredFn,
} = externalCloudinaryService;

// ============================================================
// APPLICATION-SPECIFIC EXTENSIONS
// ============================================================

/**
 * Upload a profile image for any user with standard sizing
 * @param file - File buffer or base64 string
 * @param userId - User ID for naming
 * @returns Upload result
 */
export async function uploadProfileImage(
  file: Buffer | string,
  userId: string,
): Promise<any> {
  logger.info(`Uploading profile image for user ${userId}`);
  return uploadAvatar(file, userId);
}

/**
 * Upload a business cover image for a provider
 * @param file - File buffer or base64 string
 * @param providerId - Provider ID for naming
 * @returns Upload result
 */
export async function uploadProviderCoverImage(
  file: Buffer | string,
  providerId: string,
): Promise<any> {
  logger.info(`Uploading cover image for provider ${providerId}`);
  return uploadFile(file, {
    folder: "marketplace/providers/covers",
    publicId: `provider_${providerId}_cover_${Date.now()}`,
    resourceType: "image",
    width: 1200,
    height: 400,
    crop: "fill",
    gravity: "center",
    quality: "auto",
    format: "webp",
  });
}

/**
 * Upload multiple service images with automatic naming
 * @param files - Array of file buffers
 * @param providerId - Provider ID for naming
 * @param serviceId - Service ID for naming
 * @returns Array of upload results
 */
export async function uploadServiceImages(
  files: Buffer[],
  providerId: string,
  serviceId: string,
): Promise<any[]> {
  logger.info(`Uploading ${files.length} images for service ${serviceId}`);
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const result = await uploadFile(files[i], {
      folder: `marketplace/providers/${providerId}/services`,
      publicId: `service_${serviceId}_img_${i + 1}_${Date.now()}`,
      resourceType: "image",
      width: 800,
      height: 600,
      crop: "fill",
      quality: "auto",
      format: "webp",
    });
    results.push(result);
  }
  return results;
}

/**
 * Get a fully optimized URL for a given public ID with default settings
 * @param publicId - Cloudinary public ID
 * @param options - Optional transformation options
 * @returns Optimized URL string
 */
export function getOptimizedImageUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    crop?: string;
  },
): string {
  return getImageUrl(publicId, {
    width: options?.width || 800,
    height: options?.height || 600,
    quality: options?.quality || "auto",
    format: options?.format || "webp",
    crop: options?.crop || "limit",
  });
}

/**
 * Get a responsive image URL with srcset generation (returns an array of URLs for different breakpoints)
 * @param publicId - Cloudinary public ID
 * @param widths - Array of widths for responsive images
 * @returns Array of { width, url } objects
 */
export function getResponsiveImageUrls(
  publicId: string,
  widths: number[] = [320, 640, 768, 1024, 1280],
): { width: number; url: string }[] {
  return widths.map((width) => ({
    width,
    url: getImageUrl(publicId, {
      width,
      quality: "auto",
      format: "auto",
      crop: "scale",
    }),
  }));
}

/**
 * Check if Cloudinary is configured and ready
 * @returns Boolean indicating configuration status
 */
export function isCloudinaryConfigured(): boolean {
  return isConfiguredFn();
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default externalCloudinaryService;
