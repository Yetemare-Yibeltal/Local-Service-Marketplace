import { EventEmitter } from "events";
import logger from "../utils/logger";
import { bookingEventListeners } from "./listeners/booking.listener";
import { notificationEventListeners } from "./listeners/notification.listener";
import { analyticsEventListeners } from "./listeners/analytics.listener";
import { bookingEventPublisher } from "./publishers/booking.publisher";
import { notificationEventPublisher } from "./publishers/notification.publisher";
import { analyticsEventPublisher } from "./publishers/analytics.publisher";

// ============================================================
// TYPES
// ============================================================

export interface EventData {
  type: string;
  payload: any;
  timestamp: Date;
  correlationId?: string;
  source?: string;
  userId?: string;
}

export type EventHandler = (data: EventData) => void | Promise<void>;

// ============================================================
// EVENT BUS
// ============================================================

/**
 * Global event emitter instance
 */
export const eventBus = new EventEmitter();

// Set max listeners to avoid memory leak warnings
eventBus.setMaxListeners(100);

// ============================================================
// EVENT CONSTANTS
// ============================================================

export const EVENTS = {
  // Booking events
  BOOKING_CREATED: "booking.created",
  BOOKING_CONFIRMED: "booking.confirmed",
  BOOKING_IN_PROGRESS: "booking.in_progress",
  BOOKING_COMPLETED: "booking.completed",
  BOOKING_CANCELLED: "booking.cancelled",
  BOOKING_DISPUTED: "booking.disputed",
  BOOKING_UPDATED: "booking.updated",

  // Notification events
  NOTIFICATION_SENT: "notification.sent",
  NOTIFICATION_READ: "notification.read",
  NOTIFICATION_DELIVERED: "notification.delivered",
  NOTIFICATION_FAILED: "notification.failed",

  // Analytics events
  ANALYTICS_TRACK: "analytics.track",
  ANALYTICS_AGGREGATE: "analytics.aggregate",

  // Review events
  REVIEW_CREATED: "review.created",
  REVIEW_UPDATED: "review.updated",
  REVIEW_DELETED: "review.deleted",

  // Provider events
  PROVIDER_REGISTERED: "provider.registered",
  PROVIDER_VERIFIED: "provider.verified",
  PROVIDER_UPDATED: "provider.updated",

  // User events
  USER_REGISTERED: "user.registered",
  USER_UPDATED: "user.updated",
  USER_ACTIVATED: "user.activated",
  USER_DEACTIVATED: "user.deactivated",

  // Payment events
  PAYMENT_PROCESSED: "payment.processed",
  PAYMENT_COMPLETED: "payment.completed",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_REFUNDED: "payment.refunded",

  // Dispute events
  DISPUTE_CREATED: "dispute.created",
  DISPUTE_RESOLVED: "dispute.resolved",
  DISPUTE_UPDATED: "dispute.updated",
} as const;

export type EventType = (typeof EVENTS)[keyof typeof EVENTS];

// ============================================================
// EVENT HANDLING
// ============================================================

/**
 * Register an event listener
 */
export function on(event: EventType, handler: EventHandler): void {
  eventBus.on(event, handler);
  logger.debug(`Event listener registered: ${event}`);
}

/**
 * Register a one-time event listener
 */
export function once(event: EventType, handler: EventHandler): void {
  eventBus.once(event, handler);
  logger.debug(`One-time event listener registered: ${event}`);
}

/**
 * Remove an event listener
 */
export function off(event: EventType, handler: EventHandler): void {
  eventBus.off(event, handler);
  logger.debug(`Event listener removed: ${event}`);
}

/**
 * Remove all listeners for an event
 */
export function removeAllListeners(event: EventType): void {
  eventBus.removeAllListeners(event);
  logger.debug(`All listeners removed for event: ${event}`);
}

/**
 * Get listener count for an event
 */
export function listenerCount(event: EventType): number {
  return eventBus.listenerCount(event);
}

/**
 * Get all registered event names
 */
export function getEventNames(): string[] {
  return eventBus.eventNames() as string[];
}

// ============================================================
// EVENT PUBLISHING
// ============================================================

/**
 * Emit an event synchronously
 */
export function emit(
  event: EventType,
  payload: any,
  options?: Partial<Omit<EventData, "type" | "payload">>,
): boolean {
  const data: EventData = {
    type: event,
    payload,
    timestamp: new Date(),
    correlationId: options?.correlationId,
    source: options?.source || "system",
    userId: options?.userId,
  };

  const result = eventBus.emit(event, data);
  logger.debug(`Event emitted: ${event}`, {
    correlationId: data.correlationId,
    userId: data.userId,
  });

  return result;
}

/**
 * Emit an event asynchronously
 */
export async function emitAsync(
  event: EventType,
  payload: any,
  options?: Partial<Omit<EventData, "type" | "payload">>,
): Promise<void> {
  const data: EventData = {
    type: event,
    payload,
    timestamp: new Date(),
    correlationId: options?.correlationId,
    source: options?.source || "system",
    userId: options?.userId,
  };

  return new Promise((resolve, reject) => {
    eventBus.emit(event, data, (err: any) => {
      if (err) {
        logger.error(`Async event emission failed: ${event}`, err);
        reject(err);
      } else {
        logger.debug(`Async event emitted: ${event}`, {
          correlationId: data.correlationId,
          userId: data.userId,
        });
        resolve();
      }
    });
  });
}

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initialize all event listeners
 */
export function initializeEventListeners(): void {
  logger.info("Initializing event listeners...");

  // Register booking event listeners
  bookingEventListeners();

  // Register notification event listeners
  notificationEventListeners();

  // Register analytics event listeners
  analyticsEventListeners();

  logger.info("All event listeners initialized successfully");
}

/**
 * Initialize event publishers
 */
export function initializeEventPublishers(): void {
  logger.info("Initializing event publishers...");

  // Create publisher instances (they are already instantiated in their modules)
  // The publishers are exported and ready to use

  logger.info("Event publishers initialized successfully");
}

// ============================================================
// EVENT PUBLISHER FACTORIES
// ============================================================

/**
 * Create a typed event publisher
 */
export function createEventPublisher<T>(eventType: EventType) {
  return {
    publish: (
      payload: T,
      options?: Partial<Omit<EventData, "type" | "payload">>,
    ): boolean => {
      return emit(eventType, payload, options);
    },
    publishAsync: async (
      payload: T,
      options?: Partial<Omit<EventData, "type" | "payload">>,
    ): Promise<void> => {
      return emitAsync(eventType, payload, options);
    },
  };
}

// ============================================================
// EVENT UTILITIES
// ============================================================

/**
 * Get event handlers for a specific event
 */
export function getEventHandlers(event: EventType): EventHandler[] {
  return eventBus.listeners(event) as EventHandler[];
}

/**
 * Check if event has listeners
 */
export function hasListeners(event: EventType): boolean {
  return eventBus.listenerCount(event) > 0;
}

/**
 * Log all registered events
 */
export function logRegisteredEvents(): void {
  const events = getEventNames();
  logger.info(`Registered events (${events.length}):`, events);
}

/**
 * Clear all event listeners (for testing)
 */
export function clearAllListeners(): void {
  eventBus.removeAllListeners();
  logger.debug("All event listeners cleared");
}

// ============================================================
// EVENT MIDDLEWARE
// ============================================================

/**
 * Event middleware function type
 */
export type EventMiddleware = (
  data: EventData,
  next: (err?: Error) => void,
) => void;

/**
 * Apply middleware to event emission
 */
export function use(middleware: EventMiddleware): void {
  const originalEmit = eventBus.emit.bind(eventBus);

  eventBus.emit = function (event: string | symbol, ...args: any[]): boolean {
    const data = args[0] as EventData;

    // Apply middleware
    middleware(data, (err?: Error) => {
      if (err) {
        logger.error(`Event middleware error: ${event.toString()}`, err);
        return;
      }
      // Continue with original emit
      originalEmit(event, ...args);
    });

    return true;
  };

  logger.debug("Event middleware registered");
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Core
  eventBus,
  EVENTS,

  // Registration
  on,
  once,
  off,
  removeAllListeners,

  // Publishing
  emit,
  emitAsync,

  // Query
  listenerCount,
  getEventNames,
  getEventHandlers,
  hasListeners,

  // Initialization
  initializeEventListeners,
  initializeEventPublishers,

  // Factories
  createEventPublisher,

  // Utilities
  logRegisteredEvents,
  clearAllListeners,

  // Middleware
  use,

  // Publishers
  bookingEventPublisher,
  notificationEventPublisher,
  analyticsEventPublisher,
};
