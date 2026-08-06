import { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import env from "./env";

// ============================================================
// SWAGGER DEFINITION
// ============================================================

export const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Local Service Provider Marketplace API",
    version: "1.0.0",
    description:
      "RESTful API for connecting customers with local service professionals.",
    contact: {
      name: "API Support",
      email: "support@service-marketplace.com",
    },
    license: {
      name: "MIT",
    },
  },
  servers: [
    {
      url:
        env.NODE_ENV === "production"
          ? "https://api.service-marketplace.com"
          : `http://localhost:${env.PORT}`,
      description:
        env.NODE_ENV === "production"
          ? "Production Server"
          : "Development Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token here. Example: Bearer your-token",
      },
    },
    schemas: {
      // ============================================================
      // COMMON SCHEMAS
      // ============================================================
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "object" },
          errors: { type: "array", items: { type: "string" } },
          timestamp: { type: "string", format: "date-time" },
          statusCode: { type: "integer" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          errors: { type: "array", items: { type: "string" } },
          statusCode: { type: "integer" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          totalItems: { type: "integer", example: 100 },
          totalPages: { type: "integer", example: 10 },
          hasNext: { type: "boolean", example: true },
          hasPrev: { type: "boolean", example: false },
        },
      },
      PaginatedResponse: {
        type: "object",
        properties: {
          data: { type: "array" },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },

      // ============================================================
      // AUTH SCHEMAS
      // ============================================================
      RegisterRequest: {
        type: "object",
        required: ["email", "phone", "password", "fullName"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          phone: { type: "string", example: "+251912345678" },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            example: "SecurePass123!",
          },
          fullName: { type: "string", example: "John Doe" },
          role: {
            type: "string",
            enum: ["CUSTOMER", "PROVIDER"],
            default: "CUSTOMER",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "SecurePass123!",
          },
        },
      },
      TokenResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
          expiresIn: { type: "integer" },
          user: { $ref: "#/components/schemas/UserResponse" },
        },
      },
      RefreshTokenRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string" },
        },
      },
      OTPRequest: {
        type: "object",
        required: ["phone"],
        properties: {
          phone: { type: "string", example: "+251912345678" },
        },
      },
      OTPVerifyRequest: {
        type: "object",
        required: ["phone", "otp"],
        properties: {
          phone: { type: "string", example: "+251912345678" },
          otp: { type: "string", example: "123456" },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["token", "newPassword"],
        properties: {
          token: { type: "string" },
          newPassword: { type: "string", format: "password", minLength: 8 },
        },
      },

      // ============================================================
      // USER SCHEMAS
      // ============================================================
      UserResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          fullName: { type: "string" },
          role: { type: "string", enum: ["CUSTOMER", "PROVIDER", "ADMIN"] },
          profileImage: { type: "string", nullable: true },
          isEmailVerified: { type: "boolean" },
          isPhoneVerified: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      UpdateProfileRequest: {
        type: "object",
        properties: {
          fullName: { type: "string" },
          bio: { type: "string" },
          profileImage: { type: "string" },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string", format: "password" },
          newPassword: { type: "string", format: "password", minLength: 8 },
        },
      },

      // ============================================================
      // PROVIDER SCHEMAS
      // ============================================================
      ProviderRegistrationRequest: {
        type: "object",
        required: [
          "businessName",
          "description",
          "category",
          "locationLat",
          "locationLng",
          "address",
          "city",
        ],
        properties: {
          businessName: { type: "string", example: "Bole Fast Plumbing" },
          businessLogo: { type: "string", nullable: true },
          description: {
            type: "string",
            example: "Professional plumbing services in Addis Ababa",
          },
          category: { type: "string", example: "Plumbing" },
          subCategory: { type: "string", nullable: true },
          yearsExperience: { type: "integer", minimum: 0, example: 5 },
          hourlyRate: { type: "number", minimum: 0, example: 500 },
          locationLat: { type: "number", example: 9.03 },
          locationLng: { type: "number", example: 38.74 },
          address: { type: "string", example: "Bole, Rwanda Street" },
          city: { type: "string", example: "Addis Ababa" },
          subCity: { type: "string", nullable: true },
          workingHours: {
            type: "object",
            additionalProperties: {
              type: "object",
              properties: {
                start: { type: "string", example: "09:00" },
                end: { type: "string", example: "17:00" },
              },
            },
            example: {
              monday: { start: "09:00", end: "17:00" },
              tuesday: { start: "09:00", end: "17:00" },
            },
          },
        },
      },
      ProviderResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          businessName: { type: "string" },
          businessLogo: { type: "string", nullable: true },
          description: { type: "string" },
          category: { type: "string" },
          subCategory: { type: "string", nullable: true },
          yearsExperience: { type: "integer" },
          hourlyRate: { type: "number", nullable: true },
          isAvailable: { type: "boolean" },
          isVerified: { type: "boolean" },
          averageRating: { type: "number" },
          totalReviews: { type: "integer" },
          locationLat: { type: "number" },
          locationLng: { type: "number" },
          address: { type: "string" },
          city: { type: "string" },
          subCity: { type: "string", nullable: true },
          workingHours: { type: "object" },
          completedJobs: { type: "integer" },
          responseTime: { type: "integer", nullable: true },
          isFeatured: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          user: { $ref: "#/components/schemas/UserResponse" },
        },
      },
      ProviderSearchResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          businessName: { type: "string" },
          businessLogo: { type: "string", nullable: true },
          category: { type: "string" },
          averageRating: { type: "number" },
          totalReviews: { type: "integer" },
          hourlyRate: { type: "number", nullable: true },
          isAvailable: { type: "boolean" },
          isVerified: { type: "boolean" },
          distance: { type: "number", example: 2.5 },
          address: { type: "string" },
          city: { type: "string" },
          locationLat: { type: "number" },
          locationLng: { type: "number" },
          completedJobs: { type: "integer" },
          responseTime: { type: "integer", nullable: true },
        },
      },
      UpdateProviderRequest: {
        type: "object",
        properties: {
          businessName: { type: "string" },
          businessLogo: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          subCategory: { type: "string" },
          yearsExperience: { type: "integer" },
          hourlyRate: { type: "number" },
          isAvailable: { type: "boolean" },
          address: { type: "string" },
          city: { type: "string" },
          subCity: { type: "string" },
          workingHours: { type: "object" },
        },
      },

      // ============================================================
      // SERVICE SCHEMAS
      // ============================================================
      ServiceRequest: {
        type: "object",
        required: ["title", "description", "priceType", "price", "category"],
        properties: {
          title: { type: "string", example: "Fix Leaky Pipe" },
          description: {
            type: "string",
            example: "Repair or replace damaged pipe",
          },
          priceType: { type: "string", enum: ["FIXED", "HOURLY"] },
          price: { type: "number", minimum: 0, example: 800 },
          discountPrice: { type: "number", minimum: 0, nullable: true },
          estimatedDurationMinutes: { type: "integer", example: 120 },
          category: { type: "string", example: "Plumbing" },
          subCategory: { type: "string", nullable: true },
          images: { type: "array", items: { type: "string" } },
        },
      },
      ServiceResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          providerId: { type: "string", format: "uuid" },
          title: { type: "string" },
          description: { type: "string" },
          priceType: { type: "string", enum: ["FIXED", "HOURLY"] },
          price: { type: "number" },
          discountPrice: { type: "number", nullable: true },
          estimatedDurationMinutes: { type: "integer", nullable: true },
          isActive: { type: "boolean" },
          category: { type: "string" },
          subCategory: { type: "string", nullable: true },
          images: { type: "array", items: { type: "string" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },

      // ============================================================
      // BOOKING SCHEMAS
      // ============================================================
      BookingRequest: {
        type: "object",
        required: ["providerId", "scheduledDate", "address"],
        properties: {
          providerId: { type: "string", format: "uuid" },
          serviceId: { type: "string", format: "uuid", nullable: true },
          scheduledDate: { type: "string", format: "date-time" },
          address: {
            type: "string",
            example: "Bole, Rwanda Street, Building 24",
          },
          specialNotes: { type: "string", nullable: true },
          totalPrice: { type: "number", minimum: 0 },
        },
      },
      BookingResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          bookingNumber: { type: "string" },
          customerId: { type: "string", format: "uuid" },
          providerId: { type: "string", format: "uuid" },
          serviceId: { type: "string", format: "uuid", nullable: true },
          status: {
            type: "string",
            enum: [
              "PENDING",
              "CONFIRMED",
              "IN_PROGRESS",
              "COMPLETED",
              "CANCELLED",
              "DISPUTED",
            ],
          },
          scheduledDate: { type: "string", format: "date-time" },
          estimatedEndDate: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
          address: { type: "string" },
          specialNotes: { type: "string", nullable: true },
          totalPrice: { type: "number" },
          depositAmount: { type: "number" },
          confirmedAt: { type: "string", format: "date-time", nullable: true },
          startedAt: { type: "string", format: "date-time", nullable: true },
          completedAt: { type: "string", format: "date-time", nullable: true },
          cancelledAt: { type: "string", format: "date-time", nullable: true },
          cancellationReason: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          customer: { $ref: "#/components/schemas/UserResponse" },
          provider: { $ref: "#/components/schemas/ProviderResponse" },
          service: {
            $ref: "#/components/schemas/ServiceResponse",
            nullable: true,
          },
        },
      },
      UpdateBookingStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
          },
          cancellationReason: { type: "string", nullable: true },
        },
      },

      // ============================================================
      // REVIEW SCHEMAS
      // ============================================================
      ReviewRequest: {
        type: "object",
        required: ["rating", "comment"],
        properties: {
          rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
          comment: {
            type: "string",
            example: "Excellent service, highly recommend!",
          },
          images: { type: "array", items: { type: "string" } },
        },
      },
      ReviewResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          bookingId: { type: "string", format: "uuid" },
          reviewerId: { type: "string", format: "uuid" },
          providerId: { type: "string", format: "uuid" },
          rating: { type: "integer" },
          comment: { type: "string" },
          images: { type: "array", items: { type: "string" } },
          isPublic: { type: "boolean" },
          isVerified: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          reviewer: { $ref: "#/components/schemas/UserResponse" },
        },
      },
      ReviewResponseRequest: {
        type: "object",
        required: ["response"],
        properties: {
          response: {
            type: "string",
            example: "Thank you for your kind words!",
          },
        },
      },

      // ============================================================
      // CATEGORY SCHEMAS
      // ============================================================
      CategoryRequest: {
        type: "object",
        required: ["name", "slug"],
        properties: {
          name: { type: "string", example: "Plumbing" },
          nameAm: { type: "string", example: "የቧንቧ ጥገና" },
          slug: { type: "string", example: "plumbing" },
          description: {
            type: "string",
            example: "Professional plumbing services",
          },
          icon: { type: "string", example: "fa-wrench" },
          image: { type: "string", nullable: true },
          parentId: { type: "string", format: "uuid", nullable: true },
          displayOrder: { type: "integer", default: 0 },
        },
      },
      CategoryResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          nameAm: { type: "string", nullable: true },
          slug: { type: "string" },
          description: { type: "string", nullable: true },
          icon: { type: "string", nullable: true },
          image: { type: "string", nullable: true },
          parentId: { type: "string", format: "uuid", nullable: true },
          displayOrder: { type: "integer" },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          children: {
            type: "array",
            items: { $ref: "#/components/schemas/CategoryResponse" },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    {
      name: "Health",
      description: "Health check endpoints",
    },
    {
      name: "Authentication",
      description: "Authentication and authorization endpoints",
    },
    {
      name: "Users",
      description: "User management endpoints",
    },
    {
      name: "Providers",
      description: "Provider management endpoints",
    },
    {
      name: "Services",
      description: "Service management endpoints",
    },
    {
      name: "Bookings",
      description: "Booking management endpoints",
    },
    {
      name: "Reviews",
      description: "Review management endpoints",
    },
    {
      name: "Categories",
      description: "Category management endpoints",
    },
    {
      name: "Search",
      description: "Search endpoints",
    },
    {
      name: "Admin",
      description: "Administrative endpoints",
    },
    {
      name: "Notifications",
      description: "Notification endpoints",
    },
    {
      name: "Analytics",
      description: "Analytics endpoints",
    },
  ],
};

// ============================================================
// PATHS
// ============================================================

export const swaggerPaths = {
  // ============================================================
  // HEALTH
  // ============================================================
  "/health": {
    get: {
      tags: ["Health"],
      summary: "Health check",
      description: "Check if the API is running and healthy",
      responses: {
        200: {
          description: "API is healthy",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "ok" },
                  message: { type: "string", example: "Server is running" },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
  },

  // ============================================================
  // AUTHENTICATION
  // ============================================================
  "/api/v1/auth/register": {
    post: {
      tags: ["Authentication"],
      summary: "Register a new user",
      description: "Create a new user account with email, phone, and password",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RegisterRequest" },
          },
        },
      },
      responses: {
        201: {
          description: "User registered successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/UserResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        409: {
          description: "User already exists",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/auth/login": {
    post: {
      tags: ["Authentication"],
      summary: "Login to the system",
      description: "Authenticate user and return access and refresh tokens",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Login successful",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/TokenResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Invalid credentials",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        429: {
          description: "Too many login attempts",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/auth/refresh": {
    post: {
      tags: ["Authentication"],
      summary: "Refresh access token",
      description: "Get a new access token using a refresh token",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Token refreshed successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          accessToken: { type: "string" },
                          expiresIn: { type: "integer" },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Invalid or expired refresh token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/auth/logout": {
    post: {
      tags: ["Authentication"],
      summary: "Logout user",
      description: "Invalidate the refresh token",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Logout successful",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/auth/send-otp": {
    post: {
      tags: ["Authentication"],
      summary: "Send OTP for phone verification",
      description: "Send a one-time password to the user's phone number",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/OTPRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "OTP sent successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
        429: {
          description: "Too many OTP requests",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/auth/verify-otp": {
    post: {
      tags: ["Authentication"],
      summary: "Verify OTP",
      description: "Verify the one-time password sent to the user's phone",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/OTPVerifyRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "OTP verified successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
        400: {
          description: "Invalid OTP",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/auth/forgot-password": {
    post: {
      tags: ["Authentication"],
      summary: "Request password reset",
      description: "Send a password reset link to the user's email",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ForgotPasswordRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Password reset link sent",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/auth/reset-password": {
    post: {
      tags: ["Authentication"],
      summary: "Reset password",
      description: "Reset password using the token from the reset link",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Password reset successful",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
        400: {
          description: "Invalid or expired token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  // ============================================================
  // USERS
  // ============================================================
  "/api/v1/users/profile": {
    get: {
      tags: ["Users"],
      summary: "Get user profile",
      description: "Get the current user's profile information",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Profile retrieved successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/UserResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    put: {
      tags: ["Users"],
      summary: "Update user profile",
      description: "Update the current user's profile information",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateProfileRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Profile updated successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/UserResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/users/change-password": {
    post: {
      tags: ["Users"],
      summary: "Change password",
      description: "Change the current user's password",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ChangePasswordRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Password changed successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
        400: {
          description: "Invalid current password",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  // ============================================================
  // PROVIDERS
  // ============================================================
  "/api/v1/providers/register": {
    post: {
      tags: ["Providers"],
      summary: "Register as a provider",
      description: "Register as a service provider",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ProviderRegistrationRequest",
            },
          },
        },
      },
      responses: {
        201: {
          description: "Provider registered successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/ProviderResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        409: {
          description: "Provider already registered",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/providers/{id}": {
    get: {
      tags: ["Providers"],
      summary: "Get provider profile",
      description: "Get a provider's public profile by ID",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Provider ID",
        },
      ],
      responses: {
        200: {
          description: "Provider profile retrieved",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/ProviderResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        404: {
          description: "Provider not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    put: {
      tags: ["Providers"],
      summary: "Update provider profile",
      description: "Update the provider's profile information",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Provider ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateProviderRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Provider updated successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/ProviderResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - not your provider profile",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        404: {
          description: "Provider not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/providers/services": {
    post: {
      tags: ["Services"],
      summary: "Add a service",
      description: "Add a new service to the provider's portfolio",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ServiceRequest" },
          },
        },
      },
      responses: {
        201: {
          description: "Service added successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/ServiceResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - not a provider",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    get: {
      tags: ["Services"],
      summary: "Get provider services",
      description: "Get all services for the current provider",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Services retrieved successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/ServiceResponse" },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/providers/services/{id}": {
    get: {
      tags: ["Services"],
      summary: "Get service details",
      description: "Get detailed information about a service",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Service ID",
        },
      ],
      responses: {
        200: {
          description: "Service details retrieved",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/ServiceResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        404: {
          description: "Service not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    put: {
      tags: ["Services"],
      summary: "Update service",
      description: "Update an existing service",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Service ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ServiceRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Service updated successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/ServiceResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - not your service",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        404: {
          description: "Service not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Services"],
      summary: "Delete service",
      description: "Delete a service (soft delete)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Service ID",
        },
      ],
      responses: {
        200: {
          description: "Service deleted successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - not your service",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        404: {
          description: "Service not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  // ============================================================
  // SEARCH
  // ============================================================
  "/api/v1/search/providers": {
    get: {
      tags: ["Search"],
      summary: "Search providers",
      description:
        "Search for providers by location, category, rating, and more",
      parameters: [
        {
          name: "lat",
          in: "query",
          schema: { type: "number" },
          description: "Latitude for location-based search",
          required: true,
        },
        {
          name: "lng",
          in: "query",
          schema: { type: "number" },
          description: "Longitude for location-based search",
          required: true,
        },
        {
          name: "radius",
          in: "query",
          schema: { type: "number", default: 10 },
          description: "Search radius in kilometers",
        },
        {
          name: "category",
          in: "query",
          schema: { type: "string" },
          description: "Filter by category",
        },
        {
          name: "minRating",
          in: "query",
          schema: { type: "number", minimum: 0, maximum: 5 },
          description: "Minimum rating filter",
        },
        {
          name: "maxPrice",
          in: "query",
          schema: { type: "number" },
          description: "Maximum price filter",
        },
        {
          name: "isAvailable",
          in: "query",
          schema: { type: "boolean" },
          description: "Filter by availability",
        },
        {
          name: "isVerified",
          in: "query",
          schema: { type: "boolean" },
          description: "Filter by verification status",
        },
        {
          name: "page",
          in: "query",
          schema: { type: "integer", default: 1, minimum: 1 },
          description: "Page number",
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
          description: "Items per page",
        },
      ],
      responses: {
        200: {
          description: "Search results returned",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/ProviderSearchResponse",
                        },
                      },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: "Invalid search parameters",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  // ============================================================
  // BOOKINGS
  // ============================================================
  "/api/v1/bookings": {
    post: {
      tags: ["Bookings"],
      summary: "Create a booking",
      description: "Create a new booking with a provider",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BookingRequest" },
          },
        },
      },
      responses: {
        201: {
          description: "Booking created successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/BookingResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        404: {
          description: "Provider or service not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        429: {
          description: "Too many booking requests",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    get: {
      tags: ["Bookings"],
      summary: "Get user bookings",
      description: "Get all bookings for the current user",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "status",
          in: "query",
          schema: {
            type: "string",
            enum: [
              "PENDING",
              "CONFIRMED",
              "IN_PROGRESS",
              "COMPLETED",
              "CANCELLED",
              "DISPUTED",
            ],
          },
          description: "Filter by status",
        },
        {
          name: "page",
          in: "query",
          schema: { type: "integer", default: 1, minimum: 1 },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 10, minimum: 1, maximum: 50 },
        },
      ],
      responses: {
        200: {
          description: "Bookings retrieved",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/BookingResponse" },
                      },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/bookings/{id}": {
    get: {
      tags: ["Bookings"],
      summary: "Get booking details",
      description: "Get detailed information about a booking",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Booking ID",
        },
      ],
      responses: {
        200: {
          description: "Booking details retrieved",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/BookingResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        404: {
          description: "Booking not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/bookings/{id}/status": {
    patch: {
      tags: ["Bookings"],
      summary: "Update booking status",
      description: "Update the status of a booking",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Booking ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateBookingStatusRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Booking status updated",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/BookingResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: "Invalid status transition",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - cannot update this booking",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        404: {
          description: "Booking not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  // ============================================================
  // REVIEWS
  // ============================================================
  "/api/v1/reviews": {
    post: {
      tags: ["Reviews"],
      summary: "Submit a review",
      description: "Submit a review for a completed booking",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ReviewRequest" },
          },
        },
      },
      responses: {
        201: {
          description: "Review submitted successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/ReviewResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        404: {
          description: "Booking not found or not completed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        409: {
          description: "Review already exists for this booking",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/reviews/provider/{providerId}": {
    get: {
      tags: ["Reviews"],
      summary: "Get provider reviews",
      description: "Get all reviews for a specific provider",
      parameters: [
        {
          name: "providerId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Provider ID",
        },
        {
          name: "page",
          in: "query",
          schema: { type: "integer", default: 1, minimum: 1 },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 10, minimum: 1, maximum: 50 },
        },
      ],
      responses: {
        200: {
          description: "Reviews retrieved",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/ReviewResponse" },
                      },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                  },
                ],
              },
            },
          },
        },
        404: {
          description: "Provider not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/reviews/{id}/respond": {
    post: {
      tags: ["Reviews"],
      summary: "Respond to a review",
      description: "Provider responds to a customer review",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Review ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ReviewResponseRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Response added successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - not your review to respond to",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        404: {
          description: "Review not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  // ============================================================
  // CATEGORIES
  // ============================================================
  "/api/v1/categories": {
    get: {
      tags: ["Categories"],
      summary: "Get all categories",
      description: "Get all service categories",
      parameters: [
        {
          name: "parentId",
          in: "query",
          schema: { type: "string", format: "uuid" },
          description: "Filter by parent category ID",
        },
        {
          name: "isActive",
          in: "query",
          schema: { type: "boolean" },
          description: "Filter by active status",
        },
      ],
      responses: {
        200: {
          description: "Categories retrieved",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/CategoryResponse",
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Admin", "Categories"],
      summary: "Create category",
      description: "Create a new service category (admin only)",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CategoryRequest" },
          },
        },
      },
      responses: {
        201: {
          description: "Category created",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/CategoryResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - admin only",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        409: {
          description: "Category already exists",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/categories/{id}": {
    get: {
      tags: ["Categories"],
      summary: "Get category details",
      description: "Get detailed information about a category",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Category ID",
        },
      ],
      responses: {
        200: {
          description: "Category details retrieved",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/CategoryResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        404: {
          description: "Category not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    put: {
      tags: ["Admin", "Categories"],
      summary: "Update category",
      description: "Update an existing category (admin only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Category ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CategoryRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Category updated",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/CategoryResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - admin only",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        404: {
          description: "Category not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Admin", "Categories"],
      summary: "Delete category",
      description: "Delete a category (admin only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Category ID",
        },
      ],
      responses: {
        200: {
          description: "Category deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - admin only",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        404: {
          description: "Category not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  // ============================================================
  // ADMIN
  // ============================================================
  "/api/v1/admin/providers/pending": {
    get: {
      tags: ["Admin"],
      summary: "Get pending providers",
      description: "Get all providers pending verification (admin only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "page",
          in: "query",
          schema: { type: "integer", default: 1 },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 20 },
        },
      ],
      responses: {
        200: {
          description: "Pending providers retrieved",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/ProviderResponse",
                        },
                      },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - admin only",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/admin/providers/{id}/verify": {
    patch: {
      tags: ["Admin"],
      summary: "Verify provider",
      description: "Verify or reject a provider (admin only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Provider ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["status"],
              properties: {
                status: {
                  type: "string",
                  enum: ["APPROVED", "REJECTED"],
                },
                notes: {
                  type: "string",
                  description: "Admin notes for the decision",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Provider verification status updated",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/ProviderResponse" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - admin only",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        404: {
          description: "Provider not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/admin/users": {
    get: {
      tags: ["Admin"],
      summary: "Get all users",
      description: "Get all users with pagination (admin only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "page",
          in: "query",
          schema: { type: "integer", default: 1 },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 20 },
        },
        {
          name: "role",
          in: "query",
          schema: { type: "string", enum: ["CUSTOMER", "PROVIDER", "ADMIN"] },
          description: "Filter by role",
        },
        {
          name: "search",
          in: "query",
          schema: { type: "string" },
          description: "Search by email, phone, or name",
        },
      ],
      responses: {
        200: {
          description: "Users retrieved",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/UserResponse" },
                      },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - admin only",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/admin/disputes": {
    get: {
      tags: ["Admin"],
      summary: "Get all disputes",
      description: "Get all disputes with pagination (admin only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "status",
          in: "query",
          schema: {
            type: "string",
            enum: ["OPEN", "UNDER_REVIEW", "RESOLVED", "CLOSED"],
          },
          description: "Filter by status",
        },
        {
          name: "page",
          in: "query",
          schema: { type: "integer", default: 1 },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 20 },
        },
      ],
      responses: {
        200: {
          description: "Disputes retrieved",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { type: "array" },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - admin only",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/admin/disputes/{id}": {
    get: {
      tags: ["Admin"],
      summary: "Get dispute details",
      description: "Get detailed information about a dispute (admin only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Dispute ID",
        },
      ],
      responses: {
        200: {
          description: "Dispute details retrieved",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { type: "object" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - admin only",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        404: {
          description: "Dispute not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    put: {
      tags: ["Admin"],
      summary: "Resolve dispute",
      description: "Resolve a dispute (admin only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Dispute ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["resolution"],
              properties: {
                resolution: {
                  type: "string",
                  description: "Resolution details",
                },
                status: {
                  type: "string",
                  enum: ["RESOLVED", "CLOSED"],
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Dispute resolved",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { type: "object" },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - admin only",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        404: {
          description: "Dispute not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  // ============================================================
  // PROVIDER DASHBOARD
  // ============================================================
  "/api/v1/providers/dashboard/stats": {
    get: {
      tags: ["Providers"],
      summary: "Get provider dashboard stats",
      description: "Get statistics for the provider dashboard",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Dashboard stats retrieved",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          totalEarnings: { type: "number" },
                          totalEarningsThisMonth: { type: "number" },
                          pendingRequests: { type: "integer" },
                          confirmedRequests: { type: "integer" },
                          completedJobs: { type: "integer" },
                          completedJobsThisWeek: { type: "integer" },
                          averageRating: { type: "number" },
                          totalReviews: { type: "integer" },
                          responseTime: { type: "number", nullable: true },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - not a provider",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },

  "/api/v1/providers/dashboard/earnings": {
    get: {
      tags: ["Providers"],
      summary: "Get provider earnings",
      description: "Get earnings data for the provider",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "period",
          in: "query",
          schema: {
            type: "string",
            enum: ["today", "week", "month", "year"],
            default: "month",
          },
          description: "Time period for earnings",
        },
        {
          name: "startDate",
          in: "query",
          schema: { type: "string", format: "date" },
          description: "Start date for custom period",
        },
        {
          name: "endDate",
          in: "query",
          schema: { type: "string", format: "date" },
          description: "End date for custom period",
        },
      ],
      responses: {
        200: {
          description: "Earnings data retrieved",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          total: { type: "number" },
                          commission: { type: "number" },
                          net: { type: "number" },
                          chart: {
                            type: "object",
                            properties: {
                              labels: {
                                type: "array",
                                items: { type: "string" },
                              },
                              values: {
                                type: "array",
                                items: { type: "number" },
                              },
                            },
                          },
                          breakdown: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                date: { type: "string" },
                                amount: { type: "number" },
                                bookingId: { type: "string" },
                                status: { type: "string" },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - not a provider",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
};

// ============================================================
// SWAGGER UI SETUP
// ============================================================

/**
 * Set up Swagger UI with the complete definition
 */
export function setupSwagger(app: Express): void {
  const options = {
    explorer: true,
    swaggerOptions: {
      docExpansion: "none",
      defaultModelExpandDepth: 3,
      defaultModelsExpandDepth: 3,
      displayOperationId: true,
      displayRequestDuration: true,
      deepLinking: true,
      persistAuthorization: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      syntaxHighlight: {
        activate: true,
        theme: "nord",
      },
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { font-size: 2em }
      .swagger-ui .info .title small { font-size: 0.6em }
      .swagger-ui .scheme-container { background: #f8f9fa }
    `,
    customSiteTitle: "Local Service Provider Marketplace API",
  };

  // Combine swagger definition with paths
  const completeDefinition = {
    ...swaggerDefinition,
    paths: swaggerPaths,
  };

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(completeDefinition, options),
  );

  // Serve OpenAPI JSON
  app.get("/api-docs.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(completeDefinition);
  });

  console.log(`Swagger UI available at /api-docs`);
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  swaggerDefinition,
  swaggerPaths,
  setupSwagger,
};
