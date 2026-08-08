import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiOptions,
  TransformationOptions,
} from "cloudinary";
import streamifier from "streamifier";
import env from "../../config/env";
import logger from "../../utils/logger";
import { cacheSet, cacheGet } from "../../config/redis";

// ============================================================
// TYPES
// ============================================================

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  overwrite?: boolean;
  transformation?: TransformationOptions | TransformationOptions[];
  tags?: string[];
  context?: Record<string, string>;
  quality?: string | number;
  format?: string;
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
  resourceType?: "image" | "raw" | "video" | "auto";
  allowedFormats?: string[];
  timeout?: number;
}

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  createdAt: Date;
  resourceType: string;
  folder: string;
  etag: string;
  signature: string;
  version: number;
}

export interface DeleteResult {
  success: boolean;
  publicId: string;
  result?: string;
  error?: string;
}

export interface TransformOptions {
  width?: number;
  height?: number;
  crop?:
    | "scale"
    | "fit"
    | "limit"
    | "fill"
    | "lfill"
    | "pad"
    | "lpad"
    | "mpad"
    | "crop"
    | "thumb"
    | "imagga_crop"
    | "imagga_scale";
  gravity?:
    | "center"
    | "north"
    | "south"
    | "east"
    | "west"
    | "north_east"
    | "south_east"
    | "north_west"
    | "south_west"
    | "face"
    | "face_center"
    | "auto"
    | string;
  quality?: "auto" | number;
  format?: string;
  aspectRatio?: string | number;
  radius?: string | number;
  effect?: string | object;
  angle?: number | string;
  overlay?: string;
  underlay?: string;
  border?: string;
  background?: string;
  opacity?: number;
  sharpen?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  exposure?: number;
  gamma?: number;
  tint?: string;
  hue?: number;
  vibrance?: number;
  shadow?: string | object;
  trim?: string | object;
}

export interface ImageInfo {
  publicId: string;
  bytes: number;
  format: string;
  width: number;
  height: number;
  url: string;
  secureUrl: string;
  createdAt: Date;
  tags: string[];
  context: Record<string, string>;
  resourceType: string;
}

// ============================================================
// CLOUDINARY SERVICE
// ============================================================

/**
 * Cloudinary service class for file operations
 */
class CloudinaryService {
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Cloudinary
   */
  private initialize(): void {
    try {
      const cloudName = env.CLOUDINARY_CLOUD_NAME;
      const apiKey = env.CLOUDINARY_API_KEY;
      const apiSecret = env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        this.isConfigured = false;
        logger.warn(
          "Cloudinary is not configured. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET",
        );
        return;
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      this.isConfigured = true;
      logger.info("Cloudinary client initialized successfully");
    } catch (error) {
      this.isConfigured = false;
      logger.error("Failed to initialize Cloudinary:", error);
    }
  }

  /**
   * Check if Cloudinary is configured
   */
  isConfiguredFn(): boolean {
    return this.isConfigured;
  }

  /**
   * Upload a file to Cloudinary
   */
  async uploadFile(
    file: Buffer | string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    try {
      if (!this.isConfiguredFn()) {
        throw new Error("Cloudinary not configured");
      }

      const uploadOptions: UploadApiOptions = {
        folder: options.folder || "marketplace",
        public_id: options.publicId,
        overwrite: options.overwrite !== undefined ? options.overwrite : true,
        tags: options.tags || [],
        context: options.context || {},
        resource_type: options.resourceType || "auto",
        allowed_formats: options.allowedFormats,
        timeout: options.timeout || 60000,
      };

      // Handle transformation
      if (
        options.transformation ||
        options.width ||
        options.height ||
        options.crop
      ) {
        const transformation: TransformationOptions =
          options.transformation || {};
        if (options.width) transformation.width = options.width;
        if (options.height) transformation.height = options.height;
        if (options.crop) transformation.crop = options.crop as any;
        if (options.gravity) transformation.gravity = options.gravity;
        uploadOptions.transformation = transformation;
      }

      // Handle quality
      if (options.quality) {
        const qualityValue =
          typeof options.quality === "number"
            ? `${options.quality}`
            : options.quality;
        if (uploadOptions.transformation) {
          (uploadOptions.transformation as any).quality = qualityValue;
        } else {
          uploadOptions.transformation = { quality: qualityValue } as any;
        }
      }

      // Handle format
      if (options.format) {
        if (uploadOptions.transformation) {
          (uploadOptions.transformation as any).format = options.format;
        } else {
          uploadOptions.transformation = { format: options.format } as any;
        }
      }

      let result: UploadApiResponse;

      if (typeof file === "string") {
        // Upload from URL
        result = await cloudinary.uploader.upload(file, uploadOptions);
      } else {
        // Upload from buffer
        result = await new Promise<UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result!);
              }
            },
          );
          streamifier.createReadStream(file).pipe(uploadStream);
        });
      }

      logger.info(`File uploaded to Cloudinary: ${result.public_id}`);

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        format: result.format || "",
        width: result.width || 0,
        height: result.height || 0,
        bytes: result.bytes,
        createdAt: new Date(result.created_at),
        resourceType: result.resource_type,
        folder: result.folder || "",
        etag: result.etag || "",
        signature: result.signature || "",
        version: result.version || 0,
      };
    } catch (error) {
      logger.error("File upload failed:", error);
      throw new Error(
        error instanceof Error ? error.message : "File upload failed",
      );
    }
  }

  /**
   * Upload an image with auto-optimization
   */
  async uploadImage(
    file: Buffer | string,
    folder: string,
    publicId?: string,
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder,
      publicId,
      resourceType: "image",
      transformation: {
        quality: "auto",
        fetch_format: "auto",
      },
    });
  }

  /**
   * Upload an avatar image
   */
  async uploadAvatar(
    file: Buffer | string,
    userId: string,
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: "marketplace/avatars",
      publicId: `user_${userId}_${Date.now()}`,
      resourceType: "image",
      width: 400,
      height: 400,
      crop: "fill",
      gravity: "face",
      quality: "auto",
      format: "webp",
    });
  }

  /**
   * Upload a provider logo
   */
  async uploadProviderLogo(
    file: Buffer | string,
    providerId: string,
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: "marketplace/providers",
      publicId: `provider_${providerId}_logo_${Date.now()}`,
      resourceType: "image",
      width: 500,
      height: 500,
      crop: "fill",
      quality: "auto",
      format: "webp",
    });
  }

  /**
   * Upload a service image
   */
  async uploadServiceImage(
    file: Buffer | string,
    serviceId: string,
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: "marketplace/services",
      publicId: `service_${serviceId}_${Date.now()}`,
      resourceType: "image",
      width: 800,
      height: 600,
      crop: "fill",
      quality: "auto",
      format: "webp",
    });
  }

  /**
   * Upload a review image
   */
  async uploadReviewImage(
    file: Buffer | string,
    reviewId: string,
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: "marketplace/reviews",
      publicId: `review_${reviewId}_${Date.now()}`,
      resourceType: "image",
      width: 600,
      height: 600,
      crop: "limit",
      quality: "auto",
      format: "webp",
    });
  }

  /**
   * Upload a category image
   */
  async uploadCategoryImage(
    file: Buffer | string,
    categorySlug: string,
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: "marketplace/categories",
      publicId: `category_${categorySlug}_${Date.now()}`,
      resourceType: "image",
      width: 400,
      height: 400,
      crop: "fill",
      quality: "auto",
      format: "webp",
    });
  }

  /**
   * Upload a document (PDF, Word, etc.)
   */
  async uploadDocument(
    file: Buffer | string,
    providerId: string,
    documentType: string,
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: "marketplace/documents",
      publicId: `provider_${providerId}_${documentType}_${Date.now()}`,
      resourceType: "raw",
      allowedFormats: ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
    });
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(
    files: Buffer[],
    folder: string,
    prefix: string = "",
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const publicId = prefix
        ? `${prefix}_${i}_${Date.now()}`
        : `${folder}_${i}_${Date.now()}`;
      const result = await this.uploadImage(files[i], folder, publicId);
      results.push(result);
    }

    return results;
  }

  /**
   * Delete a file from Cloudinary
   */
  async deleteFile(
    publicId: string,
    resourceType: string = "image",
  ): Promise<DeleteResult> {
    try {
      if (!this.isConfiguredFn()) {
        throw new Error("Cloudinary not configured");
      }

      if (!publicId) {
        return {
          success: false,
          publicId,
          error: "Public ID is required",
        };
      }

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType as any,
        invalidate: true,
      });

      if (result.result === "ok" || result.result === "not found") {
        logger.info(`File deleted from Cloudinary: ${publicId}`);
        return {
          success: true,
          publicId,
          result: result.result,
        };
      }

      return {
        success: false,
        publicId,
        result: result.result,
        error: result.result,
      };
    } catch (error) {
      logger.error(`Delete file ${publicId} failed:`, error);
      return {
        success: false,
        publicId,
        error: error instanceof Error ? error.message : "Delete failed",
      };
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(publicIds: string[]): Promise<DeleteResult[]> {
    const results: DeleteResult[] = [];

    for (const publicId of publicIds) {
      const result = await this.deleteFile(publicId);
      results.push(result);
    }

    return results;
  }

  /**
   * Get transformed image URL
   */
  getImageUrl(publicId: string, options: TransformOptions = {}): string {
    try {
      if (!publicId) {
        return "";
      }

      const transformation: any = {};

      if (options.width) transformation.width = options.width;
      if (options.height) transformation.height = options.height;
      if (options.crop) transformation.crop = options.crop;
      if (options.gravity) transformation.gravity = options.gravity;
      if (options.quality) transformation.quality = options.quality;
      if (options.format) transformation.format = options.format;
      if (options.aspectRatio)
        transformation.aspect_ratio = options.aspectRatio;
      if (options.radius) transformation.radius = options.radius;
      if (options.effect) transformation.effect = options.effect;
      if (options.angle) transformation.angle = options.angle;
      if (options.overlay) transformation.overlay = options.overlay;
      if (options.underlay) transformation.underlay = options.underlay;
      if (options.border) transformation.border = options.border;
      if (options.background) transformation.background = options.background;
      if (options.opacity !== undefined)
        transformation.opacity = options.opacity;
      if (options.sharpen) transformation.sharpen = options.sharpen;
      if (options.brightness) transformation.brightness = options.brightness;
      if (options.contrast) transformation.contrast = options.contrast;
      if (options.saturation) transformation.saturation = options.saturation;
      if (options.exposure) transformation.exposure = options.exposure;
      if (options.gamma) transformation.gamma = options.gamma;
      if (options.tint) transformation.tint = options.tint;
      if (options.hue) transformation.hue = options.hue;
      if (options.vibrance) transformation.vibrance = options.vibrance;
      if (options.shadow) transformation.shadow = options.shadow;
      if (options.trim) transformation.trim = options.trim;

      return cloudinary.url(publicId, {
        transformation,
        secure: true,
      });
    } catch (error) {
      logger.error(`Get image URL for ${publicId} failed:`, error);
      return "";
    }
  }

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(
    publicId: string,
    width: number = 200,
    height: number = 200,
  ): string {
    return this.getImageUrl(publicId, {
      width,
      height,
      crop: "fill",
      gravity: "center",
      quality: "auto",
      format: "webp",
    });
  }

  /**
   * Get optimized URL for responsive images
   */
  getOptimizedUrl(publicId: string, width?: number, height?: number): string {
    const options: TransformOptions = {
      quality: "auto",
      format: "auto",
    };

    if (width) options.width = width;
    if (height) options.height = height;
    if (width && height) {
      options.crop = "limit";
    }

    return this.getImageUrl(publicId, options);
  }

  /**
   * Get face-detected crop URL
   */
  getFaceCropUrl(
    publicId: string,
    width: number = 300,
    height: number = 300,
  ): string {
    return this.getImageUrl(publicId, {
      width,
      height,
      crop: "thumb",
      gravity: "face",
      quality: "auto",
    });
  }

  /**
   * Get image with watermark
   */
  getWatermarkedUrl(
    publicId: string,
    watermarkText: string,
    position: string = "south_east",
  ): string {
    return this.getImageUrl(publicId, {
      overlay: {
        text: {
          text: watermarkText,
          color: "white",
          background: "rgba(0,0,0,0.5)",
          size: 20,
        },
      },
      gravity: position,
    });
  }

  /**
   * Get image info
   */
  async getImageInfo(publicId: string): Promise<ImageInfo | null> {
    try {
      if (!this.isConfiguredFn()) {
        throw new Error("Cloudinary not configured");
      }

      const cacheKey = `cloudinary:info:${publicId}`;
      const cached = await cacheGet<ImageInfo>(cacheKey);

      if (cached) {
        return cached;
      }

      const result = await cloudinary.api.resource(publicId);

      const info: ImageInfo = {
        publicId: result.public_id,
        bytes: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
        url: result.url,
        secureUrl: result.secure_url,
        createdAt: new Date(result.created_at),
        tags: result.tags || [],
        context: result.context || {},
        resourceType: result.resource_type,
      };

      // Cache for 1 hour
      await cacheSet(cacheKey, info, 3600);

      return info;
    } catch (error) {
      logger.error(`Get image info for ${publicId} failed:`, error);
      return null;
    }
  }

  /**
   * Check if image exists
   */
  async imageExists(publicId: string): Promise<boolean> {
    try {
      const info = await this.getImageInfo(publicId);
      return info !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Add tags to image
   */
  async addTags(publicId: string, tags: string[]): Promise<boolean> {
    try {
      if (!this.isConfiguredFn()) {
        throw new Error("Cloudinary not configured");
      }

      if (!publicId || !tags || tags.length === 0) {
        return false;
      }

      await cloudinary.api.update(publicId, {
        tags: tags,
      });

      logger.info(`Tags added to ${publicId}: ${tags.join(", ")}`);
      return true;
    } catch (error) {
      logger.error(`Add tags to ${publicId} failed:`, error);
      return false;
    }
  }

  /**
   * Remove tags from image
   */
  async removeTags(publicId: string, tags: string[]): Promise<boolean> {
    try {
      if (!this.isConfiguredFn()) {
        throw new Error("Cloudinary not configured");
      }

      if (!publicId || !tags || tags.length === 0) {
        return false;
      }

      // Get current tags, remove specified ones, and update
      const info = await this.getImageInfo(publicId);
      if (!info) {
        return false;
      }

      const currentTags = info.tags || [];
      const updatedTags = currentTags.filter((tag) => !tags.includes(tag));

      await cloudinary.api.update(publicId, {
        tags: updatedTags,
      });

      logger.info(`Tags removed from ${publicId}: ${tags.join(", ")}`);
      return true;
    } catch (error) {
      logger.error(`Remove tags from ${publicId} failed:`, error);
      return false;
    }
  }

  /**
   * Generate a unique public ID
   */
  generatePublicId(prefix: string, extension: string = ""): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const id = `${prefix}_${timestamp}_${random}`;
    return extension ? `${id}.${extension}` : id;
  }

  /**
   * Health check for Cloudinary
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConfiguredFn()) {
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

  /**
   * Get folder resources
   */
  async getFolderResources(
    folder: string,
    maxResults: number = 100,
  ): Promise<ImageInfo[]> {
    try {
      if (!this.isConfiguredFn()) {
        throw new Error("Cloudinary not configured");
      }

      const result = await cloudinary.api.resources({
        type: "upload",
        prefix: folder,
        max_results: maxResults,
      });

      return result.resources.map((resource: any) => ({
        publicId: resource.public_id,
        bytes: resource.bytes,
        format: resource.format,
        width: resource.width,
        height: resource.height,
        url: resource.url,
        secureUrl: resource.secure_url,
        createdAt: new Date(resource.created_at),
        tags: resource.tags || [],
        context: resource.context || {},
        resourceType: resource.resource_type,
      }));
    } catch (error) {
      logger.error(`Get folder resources for ${folder} failed:`, error);
      return [];
    }
  }

  /**
   * Delete folder resources
   */
  async deleteFolder(folder: string): Promise<boolean> {
    try {
      const resources = await this.getFolderResources(folder, 500);

      for (const resource of resources) {
        await this.deleteFile(resource.publicId, resource.resourceType);
      }

      logger.info(`Deleted folder: ${folder}`);
      return true;
    } catch (error) {
      logger.error(`Delete folder ${folder} failed:`, error);
      return false;
    }
  }
}

// ============================================================
// EXPORTS
// ============================================================

const cloudinaryService = new CloudinaryService();

export default cloudinaryService;
