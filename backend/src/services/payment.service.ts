import { Prisma, PaymentStatus } from "@prisma/client";
import { prisma } from "../config/database";
import logger from "../utils/logger";
import { generateBookingReference } from "../utils/bcrypt";
import { createAuditLog } from "./admin.service";
import { sendPaymentNotification } from "./notification.service";
import { cacheSet, cacheGet, cacheDelete } from "../config/redis";

// ============================================================
// TYPES
// ============================================================

export interface PaymentData {
  bookingId: string;
  customerId: string;
  providerId: string;
  amount: number;
  paymentMethod: "CASH" | "TELEBIRR" | "CHAPA" | "BANK_TRANSFER";
  transactionId?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface PaymentVerificationData {
  transactionId: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  reference?: string;
  metadata?: Record<string, any>;
}

export interface RefundData {
  paymentId: string;
  reason: string;
  amount?: number;
}

export interface PaymentMethodData {
  userId: string;
  type: "TELEBIRR" | "CHAPA" | "BANK_ACCOUNT" | "CASH";
  provider?: string;
  accountNumber?: string;
  accountName?: string;
  isDefault?: boolean;
  metadata?: Record<string, any>;
}

export interface PaymentStats {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  refundedPayments: number;
  totalRevenue: number;
  averagePaymentAmount: number;
  paymentsByMethod: Record<string, number>;
  dailyPayments: {
    date: string;
    count: number;
    amount: number;
  }[];
}

export interface PaymentResponse {
  id: string;
  bookingId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  transactionId: string | null;
  reference: string | null;
  paidAt: Date | null;
  refundedAt: Date | null;
  refundReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// PAYMENT SERVICE
// ============================================================

/**
 * Initiate a payment
 */
export async function initiatePayment(
  data: PaymentData,
): Promise<PaymentResponse> {
  try {
    // Validate booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        customer: true,
        provider: {
          include: { user: true },
        },
      },
    });

    if (!booking) {
      throw new Error(`Booking ${data.bookingId} not found`);
    }

    if (booking.status !== "CONFIRMED" && booking.status !== "IN_PROGRESS") {
      throw new Error(
        `Booking ${data.bookingNumber} must be confirmed or in progress for payment`,
      );
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId: data.bookingId },
    });

    if (existingPayment) {
      throw new Error("Payment already exists for this booking");
    }

    // Validate amount
    if (data.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Generate reference
    const reference = `PAY-${generateBookingReference()}`;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: data.bookingId,
        customerId: data.customerId,
        providerId: data.providerId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        reference,
        status: "PENDING",
        metadata: data.metadata || {},
      },
    });

    // Create audit log
    await createAuditLog({
      userId: data.customerId,
      action: "INITIATE_PAYMENT",
      entity: "Payment",
      entityId: payment.id,
      changes: {
        bookingId: data.bookingId,
        amount: data.amount,
        method: data.paymentMethod,
      },
    });

    logger.info(
      `Payment initiated for booking ${data.bookingId}: ${reference}`,
    );

    // Send notification
    try {
      await sendPaymentNotification(data.bookingId, data.amount, "PENDING");
    } catch (error) {
      logger.error("Failed to send payment notification:", error);
    }

    return mapPaymentToResponse(payment);
  } catch (error) {
    logger.error("Initiate payment failed:", error);
    throw error;
  }
}

/**
 * Verify payment with gateway
 */
export async function verifyPayment(
  data: PaymentVerificationData,
): Promise<PaymentResponse> {
  try {
    // Find payment by transaction ID
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { transactionId: data.transactionId },
          { reference: data.transactionId },
        ],
      },
    });

    if (!payment) {
      throw new Error(
        `Payment with transaction ${data.transactionId} not found`,
      );
    }

    if (payment.status === "PAID") {
      throw new Error("Payment already verified");
    }

    // Update payment status
    const statusMap: Record<string, PaymentStatus> = {
      SUCCESS: "PAID",
      FAILED: "FAILED",
      PENDING: "PENDING",
    };

    const status = statusMap[data.status] || "PENDING";

    const updateData: any = {
      status,
      transactionId: data.transactionId || payment.transactionId,
    };

    if (status === "PAID") {
      updateData.paidAt = new Date();
    }

    if (status === "FAILED") {
      updateData.metadata = {
        ...((payment.metadata as any) || {}),
        failureReason: data.metadata?.failureReason || "Payment failed",
      };
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: updateData,
    });

    // If payment is successful, update booking
    if (status === "PAID") {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CONFIRMED" },
      });

      // Create notification
      await sendPaymentNotification(payment.bookingId, payment.amount, "PAID");
    }

    // Create audit log
    await createAuditLog({
      userId: "system",
      action: "VERIFY_PAYMENT",
      entity: "Payment",
      entityId: payment.id,
      changes: { status, transactionId: data.transactionId },
    });

    logger.info(`Payment ${payment.id} verified: ${status}`);

    return mapPaymentToResponse(updatedPayment);
  } catch (error) {
    logger.error("Verify payment failed:", error);
    throw error;
  }
}

/**
 * Process refund for payment
 */
export async function processRefund(
  data: RefundData,
): Promise<PaymentResponse> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: data.paymentId },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      throw new Error(`Payment ${data.paymentId} not found`);
    }

    if (payment.status !== "PAID") {
      throw new Error(`Cannot refund payment with status ${payment.status}`);
    }

    if (payment.refundedAt) {
      throw new Error("Payment already refunded");
    }

    const refundAmount = data.amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw new Error("Refund amount exceeds payment amount");
    }

    // Process refund (integration with gateway would go here)
    // For now, mark as refunded

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
        refundReason: data.reason,
        metadata: {
          ...((payment.metadata as any) || {}),
          refundAmount,
          refundReason: data.reason,
        },
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: "CANCELLED" },
    });

    // Create audit log
    await createAuditLog({
      userId: "system",
      action: "PROCESS_REFUND",
      entity: "Payment",
      entityId: payment.id,
      changes: { amount: refundAmount, reason: data.reason },
    });

    // Send notification
    await sendPaymentNotification(payment.bookingId, refundAmount, "REFUNDED");

    logger.info(`Refund processed for payment ${payment.id}`);

    return mapPaymentToResponse(updatedPayment);
  } catch (error) {
    logger.error("Process refund failed:", error);
    throw error;
  }
}

/**
 * Get payment by ID
 */
export async function getPaymentById(
  id: string,
): Promise<PaymentResponse | null> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            customer: {
              select: { id: true, fullName: true, email: true },
            },
            provider: {
              select: { id: true, businessName: true },
            },
          },
        },
      },
    });

    if (!payment) {
      return null;
    }

    return mapPaymentToResponse(payment);
  } catch (error) {
    logger.error(`Get payment ${id} failed:`, error);
    throw error;
  }
}

/**
 * Get payment by booking ID
 */
export async function getPaymentByBookingId(
  bookingId: string,
): Promise<PaymentResponse | null> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      return null;
    }

    return mapPaymentToResponse(payment);
  } catch (error) {
    logger.error(`Get payment by booking ${bookingId} failed:`, error);
    throw error;
  }
}

/**
 * Get payments by customer ID
 */
export async function getPaymentsByCustomer(
  customerId: string,
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: PaymentResponse[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  try {
    const where = { customerId };

    const [data, totalItems] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: data.map(mapPaymentToResponse),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    logger.error(`Get payments by customer ${customerId} failed:`, error);
    throw error;
  }
}

/**
 * Get payments by provider ID
 */
export async function getPaymentsByProvider(
  providerId: string,
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: PaymentResponse[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  try {
    const where = { providerId };

    const [data, totalItems] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: data.map(mapPaymentToResponse),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    logger.error(`Get payments by provider ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Get payment statistics
 */
export async function getPaymentStats(
  startDate?: Date,
  endDate?: Date,
  providerId?: string,
): Promise<PaymentStats> {
  try {
    const where: any = {};

    if (providerId) {
      where.providerId = providerId;
    }

    if (startDate) {
      where.createdAt = { gte: startDate };
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: endDate };
    }

    const [
      totalPayments,
      successfulPayments,
      failedPayments,
      pendingPayments,
      refundedPayments,
      totalRevenue,
      paymentsByMethod,
    ] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.count({ where: { ...where, status: "PAID" } }),
      prisma.payment.count({ where: { ...where, status: "FAILED" } }),
      prisma.payment.count({ where: { ...where, status: "PENDING" } }),
      prisma.payment.count({ where: { ...where, status: "REFUNDED" } }),
      prisma.payment.aggregate({
        where: { ...where, status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ["paymentMethod"],
        where,
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

    const averagePaymentAmount =
      successfulPayments > 0
        ? (totalRevenue._sum.amount || 0) / successfulPayments
        : 0;

    const methodStats: Record<string, number> = {};
    paymentsByMethod.forEach((item: any) => {
      methodStats[item.paymentMethod] = item._count.id;
    });

    // Daily payments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyData = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(amount) as amount
      FROM payments
      WHERE created_at >= ${thirtyDaysAgo}
      ${providerId ? Prisma.sql`AND provider_id = ${providerId}` : Prisma.empty}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const dailyPayments = (dailyData as any[]).map((item) => ({
      date: item.date.toISOString().split("T")[0],
      count: Number(item.count),
      amount: Number(item.amount),
    }));

    return {
      totalPayments,
      successfulPayments,
      failedPayments,
      pendingPayments,
      refundedPayments,
      totalRevenue: totalRevenue._sum.amount || 0,
      averagePaymentAmount,
      paymentsByMethod: methodStats,
      dailyPayments,
    };
  } catch (error) {
    logger.error("Get payment stats failed:", error);
    throw error;
  }
}

/**
 * Get provider earnings
 */
export async function getProviderEarnings(
  providerId: string,
  period: "today" | "week" | "month" | "year" = "month",
): Promise<{
  totalEarnings: number;
  totalBookings: number;
  pendingPayouts: number;
  completedPayouts: number;
  earningsByDate: {
    date: string;
    amount: number;
    bookings: number;
  }[];
}> {
  try {
    let startDate = new Date();

    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const where = {
      providerId,
      status: "PAID",
      paidAt: { gte: startDate },
    };

    const [
      totalEarnings,
      totalBookings,
      pendingPayouts,
      completedPayouts,
      earningsByDate,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.booking.count({
        where: {
          providerId,
          status: "COMPLETED",
          completedAt: { gte: startDate },
        },
      }),
      prisma.payment.count({
        where: {
          providerId,
          status: "PENDING",
        },
      }),
      prisma.payment.count({
        where: {
          providerId,
          status: "PAID",
        },
      }),
      prisma.$queryRaw`
        SELECT 
          DATE(paid_at) as date,
          SUM(amount) as amount,
          COUNT(*) as bookings
        FROM payments
        WHERE provider_id = ${providerId}
          AND status = 'PAID'
          AND paid_at >= ${startDate}
        GROUP BY DATE(paid_at)
        ORDER BY date ASC
      `,
    ]);

    const earningsByDateFormatted = (earningsByDate as any[]).map((item) => ({
      date: item.date.toISOString().split("T")[0],
      amount: Number(item.amount),
      bookings: Number(item.bookings),
    }));

    return {
      totalEarnings: totalEarnings._sum.amount || 0,
      totalBookings,
      pendingPayouts,
      completedPayouts,
      earningsByDate: earningsByDateFormatted,
    };
  } catch (error) {
    logger.error(`Get provider earnings for ${providerId} failed:`, error);
    throw error;
  }
}

/**
 * Save payment method for user
 */
export async function savePaymentMethod(data: PaymentMethodData): Promise<any> {
  try {
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new Error(`User ${data.userId} not found`);
    }

    // Check if payment method already exists
    const existing = await prisma.systemSetting.findFirst({
      where: {
        key: `payment_method_${data.userId}_${data.type}`,
      },
    });

    const methodData = {
      type: data.type,
      provider: data.provider,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      isDefault: data.isDefault || false,
      metadata: data.metadata || {},
    };

    if (existing) {
      const updated = await prisma.systemSetting.update({
        where: { key: existing.key },
        data: {
          value: methodData,
        },
      });

      logger.info(`Payment method updated for user ${data.userId}`);

      return updated;
    }

    const newMethod = await prisma.systemSetting.create({
      data: {
        key: `payment_method_${data.userId}_${data.type}`,
        value: methodData,
        description: `Payment method for user ${data.userId}`,
        isPublic: false,
      },
    });

    logger.info(`Payment method saved for user ${data.userId}`);

    return newMethod;
  } catch (error) {
    logger.error("Save payment method failed:", error);
    throw error;
  }
}

/**
 * Get payment methods for user
 */
export async function getPaymentMethods(userId: string): Promise<any[]> {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { startsWith: `payment_method_${userId}` },
      },
    });

    return settings.map((setting) => ({
      id: setting.key,
      ...setting.value,
    }));
  } catch (error) {
    logger.error(`Get payment methods for ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Delete payment method for user
 */
export async function deletePaymentMethod(
  userId: string,
  methodType: string,
): Promise<boolean> {
  try {
    const key = `payment_method_${userId}_${methodType}`;

    const existing = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!existing) {
      return false;
    }

    await prisma.systemSetting.delete({
      where: { key },
    });

    logger.info(`Payment method ${methodType} deleted for user ${userId}`);

    return true;
  } catch (error) {
    logger.error(`Delete payment method for ${userId} failed:`, error);
    throw error;
  }
}

/**
 * Process webhook from payment gateway
 */
export async function processPaymentWebhook(
  gateway: "TELEBIRR" | "CHAPA",
  payload: any,
): Promise<{ handled: boolean; status: string }> {
  try {
    logger.info(`Processing ${gateway} webhook`);

    // Extract transaction details based on gateway
    let transactionId: string;
    let status: string;
    let reference: string;
    let metadata: Record<string, any> = {};

    if (gateway === "TELEBIRR") {
      transactionId = payload.transactionId || payload.id;
      status = payload.status || "PENDING";
      reference = payload.reference || payload.orderId;
      metadata = {
        telebirrTransactionId: payload.transactionId,
        telebirrStatus: payload.status,
        telebirrData: payload,
      };
    } else if (gateway === "CHAPA") {
      transactionId = payload.tx_ref || payload.id;
      status = payload.status || "pending";
      reference = payload.tx_ref || payload.orderId;
      metadata = {
        chapaTransactionId: payload.tx_ref,
        chapaStatus: payload.status,
        chapaData: payload,
      };
    } else {
      throw new Error(`Unsupported gateway: ${gateway}`);
    }

    // Find payment by reference
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ reference }, { transactionId: transactionId }],
      },
    });

    if (!payment) {
      logger.warn(`Payment not found for webhook: ${reference}`);
      return { handled: false, status: "PAYMENT_NOT_FOUND" };
    }

    // Map gateway status to system status
    const statusMap: Record<string, PaymentStatus> = {
      SUCCESS: "PAID",
      success: "PAID",
      COMPLETED: "PAID",
      completed: "PAID",
      PAID: "PAID",
      paid: "PAID",
      FAILED: "FAILED",
      failed: "FAILED",
      PENDING: "PENDING",
      pending: "PENDING",
    };

    const systemStatus = statusMap[status] || "PENDING";

    // Update payment
    const updateData: any = {
      status: systemStatus,
      transactionId: transactionId || payment.transactionId,
      metadata: {
        ...((payment.metadata as any) || {}),
        ...metadata,
        webhookProcessed: true,
        webhookAt: new Date().toISOString(),
      },
    };

    if (systemStatus === "PAID") {
      updateData.paidAt = new Date();
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: updateData,
    });

    // If successful, update booking
    if (systemStatus === "PAID") {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CONFIRMED" },
      });

      await sendPaymentNotification(payment.bookingId, payment.amount, "PAID");
    }

    // Create audit log
    await createAuditLog({
      userId: "webhook",
      action: "PROCESS_WEBHOOK",
      entity: "Payment",
      entityId: payment.id,
      changes: { gateway, status: systemStatus, transactionId },
    });

    logger.info(`Webhook processed for payment ${payment.id}: ${systemStatus}`);

    return { handled: true, status: systemStatus };
  } catch (error) {
    logger.error("Process payment webhook failed:", error);
    throw error;
  }
}

/**
 * Check if payment exists
 */
export async function paymentExists(id: string): Promise<boolean> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!payment;
  } catch (error) {
    logger.error(`Check payment exists ${id} failed:`, error);
    return false;
  }
}

/**
 * Check if booking has payment
 */
export async function bookingHasPayment(bookingId: string): Promise<boolean> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      select: { id: true },
    });
    return !!payment;
  } catch (error) {
    logger.error(`Check booking has payment ${bookingId} failed:`, error);
    return false;
  }
}

/**
 * Map payment to response
 */
function mapPaymentToResponse(payment: any): PaymentResponse {
  return {
    id: payment.id,
    bookingId: payment.bookingId,
    amount: payment.amount,
    status: payment.status as PaymentStatus,
    paymentMethod: payment.paymentMethod,
    transactionId: payment.transactionId,
    reference: payment.reference,
    paidAt: payment.paidAt,
    refundedAt: payment.refundedAt,
    refundReason: payment.refundReason,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  initiatePayment,
  verifyPayment,
  processRefund,
  getPaymentById,
  getPaymentByBookingId,
  getPaymentsByCustomer,
  getPaymentsByProvider,
  getPaymentStats,
  getProviderEarnings,
  savePaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
  processPaymentWebhook,
  paymentExists,
  bookingHasPayment,
};
