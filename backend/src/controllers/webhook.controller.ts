import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../middlewares/error.middleware";
import { sendSuccess, sendError } from "../utils/response";
import { processPaymentWebhook } from "../services/payment.service";
import { createAuditLog } from "../services/internal/admin.service";
import logger from "../utils/logger";

// ============================================================
// TYPES
// ============================================================

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  signature?: string;
}

export interface WebhookResponse {
  received: boolean;
  processed: boolean;
  event: string;
  status: string;
  message?: string;
}

// ============================================================
// WEBHOOK CONTROLLER
// ============================================================

/**
 * Process payment webhook from Telebirr
 * @route POST /api/v1/webhooks/telebirr
 * @description Processes incoming webhook from Telebirr payment gateway
 * @body { transactionId, status, reference, metadata }
 * @returns { processed: true } with 200 status
 */
export const telebirrWebhookHandler = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const payload = req.body;
    const signature = req.headers["x-telebirr-signature"] as string;

    logger.info("Telebirr webhook received", {
      signature: signature ? "present" : "missing",
    });

    // Validate required fields
    if (!payload.transactionId && !payload.tx_ref) {
      sendError(res, "Missing transaction ID in webhook payload", 400);
      return;
    }

    // Verify signature (if implemented)
    // const isValid = verifyTelebirrSignature(payload, signature);
    // if (!isValid) {
    //   sendError(res, 'Invalid webhook signature', 401);
    //   return;
    // }

    // Process payment webhook
    const result = await processPaymentWebhook("TELEBIRR", payload);

    // Create audit log
    await createAuditLog({
      userId: "webhook",
      action: "TELEBIRR_WEBHOOK",
      entity: "Webhook",
      changes: {
        transactionId: payload.transactionId || payload.tx_ref,
        status: payload.status,
        processed: result.handled,
      },
    });

    sendSuccess(
      res,
      {
        received: true,
        processed: result.handled,
        event: "payment.updated",
        status: result.status,
      },
      "Webhook processed successfully",
    );
  },
);

/**
 * Process payment webhook from Chapa
 * @route POST /api/v1/webhooks/chapa
 * @description Processes incoming webhook from Chapa payment gateway
 * @body { tx_ref, status, amount, currency, metadata }
 * @returns { processed: true } with 200 status
 */
export const chapaWebhookHandler = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const payload = req.body;
    const signature = req.headers["x-chapa-signature"] as string;

    logger.info("Chapa webhook received", {
      signature: signature ? "present" : "missing",
    });

    // Validate required fields
    if (!payload.tx_ref && !payload.transactionId) {
      sendError(res, "Missing transaction reference in webhook payload", 400);
      return;
    }

    // Verify signature (if implemented)
    // const isValid = verifyChapaSignature(payload, signature);
    // if (!isValid) {
    //   sendError(res, 'Invalid webhook signature', 401);
    //   return;
    // }

    // Process payment webhook
    const result = await processPaymentWebhook("CHAPA", payload);

    // Create audit log
    await createAuditLog({
      userId: "webhook",
      action: "CHAPA_WEBHOOK",
      entity: "Webhook",
      changes: {
        tx_ref: payload.tx_ref || payload.transactionId,
        status: payload.status,
        processed: result.handled,
      },
    });

    sendSuccess(
      res,
      {
        received: true,
        processed: result.handled,
        event: "payment.updated",
        status: result.status,
      },
      "Webhook processed successfully",
    );
  },
);

/**
 * Process SMS delivery status webhook from Twilio
 * @route POST /api/v1/webhooks/sms-status
 * @description Processes incoming SMS delivery status webhook from Twilio
 * @body { MessageSid, MessageStatus, To, From, ErrorCode, ErrorMessage }
 * @returns { processed: true } with 200 status
 */
export const smsStatusWebhookHandler = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const payload = req.body;

    logger.info("SMS status webhook received", {
      messageSid: payload.MessageSid,
      status: payload.MessageStatus,
      to: payload.To,
    });

    // Log SMS delivery status
    await createAuditLog({
      userId: "webhook",
      action: "SMS_STATUS_WEBHOOK",
      entity: "SMS",
      entityId: payload.MessageSid,
      changes: {
        status: payload.MessageStatus,
        to: payload.To,
        from: payload.From,
        errorCode: payload.ErrorCode,
        errorMessage: payload.ErrorMessage,
      },
    });

    sendSuccess(
      res,
      {
        received: true,
        processed: true,
        event: "sms.status.updated",
        status: payload.MessageStatus,
      },
      "SMS status webhook processed successfully",
    );
  },
);

/**
 * Generic webhook handler for custom webhooks
 * @route POST /api/v1/webhooks/:provider
 * @description Handles generic webhooks from various providers
 * @param {provider} - Provider name (e.g., 'stripe', 'paypal')
 * @body { event, data, timestamp, signature? }
 * @returns { processed: true } with 200 status
 */
export const genericWebhookHandler = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { provider } = req.params;
    const payload = req.body;
    const signature = req.headers["x-webhook-signature"] as string;

    logger.info(`Generic webhook received from ${provider}`, {
      event: payload.event,
      signature: signature ? "present" : "missing",
    });

    if (!payload.event) {
      sendError(res, "Missing event in webhook payload", 400);
      return;
    }

    // Create audit log
    await createAuditLog({
      userId: "webhook",
      action: "GENERIC_WEBHOOK",
      entity: "Webhook",
      changes: {
        provider,
        event: payload.event,
        timestamp: payload.timestamp,
      },
    });

    sendSuccess(
      res,
      {
        received: true,
        processed: true,
        event: payload.event,
        status: "processed",
        message: `Webhook from ${provider} processed successfully`,
      },
      "Webhook processed successfully",
    );
  },
);

/**
 * Health check endpoint for webhook testing
 * @route GET /api/v1/webhooks/health
 * @description Health check endpoint to verify webhook endpoint is reachable
 * @returns { status: 'ok' } with 200 status
 */
export const webhookHealthCheck = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    sendSuccess(
      res,
      {
        status: "ok",
        service: "Webhook Endpoint",
        timestamp: new Date().toISOString(),
        endpoints: [
          "/webhooks/telebirr",
          "/webhooks/chapa",
          "/webhooks/sms-status",
          "/webhooks/:provider",
        ],
      },
      "Webhook health check passed",
    );
  },
);

/**
 * Webhook event dispatcher (internal use)
 * @route POST /api/v1/webhooks/dispatch
 * @description Dispatches webhook events to registered handlers
 * @body { event, data, targetUrl, retryCount? }
 * @returns { dispatched: true } with 200 status
 */
export const dispatchWebhookEvent = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { event, data, targetUrl, retryCount = 0 } = req.body;

    if (!event) {
      sendError(res, "Event is required", 400);
      return;
    }

    if (!targetUrl) {
      sendError(res, "Target URL is required", 400);
      return;
    }

    // Log dispatch attempt
    await createAuditLog({
      userId: "system",
      action: "WEBHOOK_DISPATCH",
      entity: "Webhook",
      changes: {
        event,
        targetUrl,
        retryCount,
      },
    });

    // Attempt to dispatch webhook
    try {
      const axios = require("axios");
      const response = await axios.post(
        targetUrl,
        {
          event,
          data,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Event": event,
            "X-Retry-Count": retryCount,
          },
          timeout: 10000,
        },
      );

      sendSuccess(
        res,
        {
          dispatched: true,
          statusCode: response.status,
          event,
          targetUrl,
        },
        "Webhook dispatched successfully",
      );
    } catch (error: any) {
      logger.error("Webhook dispatch failed:", {
        event,
        targetUrl,
        error: error.message,
      });

      // Retry logic
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          dispatchWebhookEvent(req, res);
        }, delay);
      }

      sendError(res, `Webhook dispatch failed: ${error.message}`, 500);
    }
  },
);

/**
 * Register webhook endpoint (for external services)
 * @route POST /api/v1/webhooks/register
 * @description Registers a webhook endpoint for a service
 * @body { service, url, events, secret? }
 * @returns { registered: true } with 200 status
 */
export const registerWebhookEndpoint = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { service, url, events, secret } = req.body;

    if (!service) {
      sendError(res, "Service name is required", 400);
      return;
    }

    if (!url) {
      sendError(res, "Webhook URL is required", 400);
      return;
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      sendError(res, "At least one event is required", 400);
      return;
    }

    // Validate URL format
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
    if (!urlRegex.test(url)) {
      sendError(res, "Invalid URL format", 400);
      return;
    }

    // In production, save to database
    logger.info("Webhook registered", { service, url, events });

    // Create audit log
    await createAuditLog({
      userId: (req as any).user?.id || "system",
      action: "REGISTER_WEBHOOK",
      entity: "Webhook",
      changes: {
        service,
        url,
        events,
        secret: secret ? "provided" : "not provided",
      },
    });

    sendSuccess(
      res,
      {
        registered: true,
        service,
        url,
        events,
        webhookId: `wh_${Date.now()}`,
      },
      "Webhook registered successfully",
      201,
    );
  },
);

/**
 * Test webhook endpoint
 * @route POST /api/v1/webhooks/test
 * @description Sends a test webhook event to a specified URL
 * @body { targetUrl, event, payload? }
 * @returns { sent: true } with 200 status
 */
export const testWebhookEndpoint = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const {
      targetUrl,
      event = "test.event",
      payload = { message: "This is a test webhook" },
    } = req.body;

    if (!targetUrl) {
      sendError(res, "Target URL is required", 400);
      return;
    }

    try {
      const axios = require("axios");
      const response = await axios.post(
        targetUrl,
        {
          event,
          data: payload,
          timestamp: new Date().toISOString(),
          isTest: true,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Event": event,
            "X-Webhook-Test": "true",
          },
          timeout: 5000,
        },
      );

      sendSuccess(
        res,
        {
          sent: true,
          statusCode: response.status,
          targetUrl,
          event,
        },
        "Test webhook sent successfully",
      );
    } catch (error: any) {
      logger.error("Test webhook failed:", {
        targetUrl,
        error: error.message,
      });

      sendError(res, `Test webhook failed: ${error.message}`, 500);
    }
  },
);

// ============================================================
// EXPORTS
// ============================================================

export default {
  telebirrWebhookHandler,
  chapaWebhookHandler,
  smsStatusWebhookHandler,
  genericWebhookHandler,
  webhookHealthCheck,
  dispatchWebhookEvent,
  registerWebhookEndpoint,
  testWebhookEndpoint,
};
