import { Router } from "express";
import {
  telebirrWebhookHandler,
  chapaWebhookHandler,
  smsStatusWebhookHandler,
  genericWebhookHandler,
  webhookHealthCheck,
  dispatchWebhookEvent,
  registerWebhookEndpoint,
  testWebhookEndpoint,
} from "../../controllers/webhook.controller";
import { catchAsync } from "../../middlewares/error.middleware";

// ============================================================
// WEBHOOK ROUTES
// ============================================================

const router = Router();

// Webhook routes are public (no authentication required)
// They are accessed by external services and payment gateways

// ============================================================
// PAYMENT WEBHOOKS
// ============================================================

/**
 * @route POST /api/v1/webhooks/telebirr
 * @description Process Telebirr payment webhook
 * @body { transactionId, status, reference, metadata }
 * @returns { processed: true } with 200 status
 * @access Public (Telebirr gateway)
 */
router.post("/telebirr", catchAsync(telebirrWebhookHandler));

/**
 * @route POST /api/v1/webhooks/chapa
 * @description Process Chapa payment webhook
 * @body { tx_ref, status, amount, currency, metadata }
 * @returns { processed: true } with 200 status
 * @access Public (Chapa gateway)
 */
router.post("/chapa", catchAsync(chapaWebhookHandler));

// ============================================================
// SMS WEBHOOKS
// ============================================================

/**
 * @route POST /api/v1/webhooks/sms-status
 * @description Process SMS delivery status webhook from Twilio
 * @body { MessageSid, MessageStatus, To, From, ErrorCode, ErrorMessage }
 * @returns { processed: true } with 200 status
 * @access Public (Twilio)
 */
router.post("/sms-status", catchAsync(smsStatusWebhookHandler));

// ============================================================
// GENERIC WEBHOOK
// ============================================================

/**
 * @route POST /api/v1/webhooks/:provider
 * @description Handle generic webhooks from various providers
 * @param {provider} - Provider name (e.g., 'stripe', 'paypal')
 * @body { event, data, timestamp, signature? }
 * @returns { processed: true } with 200 status
 * @access Public (External providers)
 */
router.post("/:provider", catchAsync(genericWebhookHandler));

// ============================================================
// WEBHOOK UTILITY ENDPOINTS
// ============================================================

/**
 * @route GET /api/v1/webhooks/health
 * @description Health check for webhook endpoints
 * @returns { status: 'ok', endpoints: string[] } with 200 status
 * @access Public
 */
router.get("/health", catchAsync(webhookHealthCheck));

/**
 * @route POST /api/v1/webhooks/dispatch
 * @description Dispatch webhook event to registered endpoints
 * @body { event, data, targetUrl, retryCount? }
 * @returns { dispatched: true } with 200 status
 * @access Public (Internal use)
 */
router.post("/dispatch", catchAsync(dispatchWebhookEvent));

/**
 * @route POST /api/v1/webhooks/register
 * @description Register a webhook endpoint for a service
 * @body { service, url, events, secret? }
 * @returns { registered: true, webhookId: string } with 201 status
 * @access Public
 */
router.post("/register", catchAsync(registerWebhookEndpoint));

/**
 * @route POST /api/v1/webhooks/test
 * @description Send a test webhook to a specified URL
 * @body { targetUrl, event, payload? }
 * @returns { sent: true } with 200 status
 * @access Public
 */
router.post("/test", catchAsync(testWebhookEndpoint));

// ============================================================
// EXPORTS
// ============================================================

export default router;
