import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { LogisticsClient } from "./clients/logistics.client";
import { DeliveryStatus, OrderStatus, UserRole } from "@prisma/client";
import { WhatsAppService } from "../whatsapp/whatsapp.service";

@Injectable()
export class LogisticsService {
  private readonly logger = new Logger(LogisticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject("LogisticsClient") private readonly client: LogisticsClient,
    @Inject(forwardRef(() => WhatsAppService))
    private readonly whatsappService: WhatsAppService,
  ) {}

  async getQuote(
    pickupAddress: string,
    deliveryAddress: string,
    weightKg?: number,
  ) {
    // Basic validation
    if (!pickupAddress || !deliveryAddress) {
      throw new BadRequestException(
        "Pickup and delivery addresses are required",
      );
    }

    // Call the abstracted client
    return this.client.getQuote(pickupAddress, deliveryAddress, weightKg);
  }

  async bookPickup(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true, // buyer
        merchantProfile: true, // seller (merchant)
        supplierProfile: true, // seller (supplier)
        deliveryBooking: true,
      },
    });

    if (!order) throw new NotFoundException("Order not found");
    if (order.deliveryMethod !== "PLATFORM_LOGISTICS") {
      throw new BadRequestException("Order does not use platform logistics");
    }
    if (order.deliveryBooking) {
      this.logger.warn(`Order ${orderId} already has a delivery booking.`);
      return order.deliveryBooking;
    }

    try {
      // 1. Book with partner
      // Note: We need a reliable pickup address. In a real app we'd fetch the exact warehouse.
      // We fall back to merchant profile business address if warehouse isn't set.
      // Support both merchants and suppliers as sellers
      const pickupAddress =
        order.merchantProfile?.businessAddress ||
        order.supplierProfile?.companyAddress;
      const deliveryAddress = order.deliveryAddress;
      const contactPhone = order.user?.phone;

      if (!pickupAddress || !deliveryAddress) {
        throw new Error("Missing addresses for logistics booking");
      }

      if (!contactPhone) {
        throw new Error("Missing contact phone for logistics booking");
      }

      this.logger.log(
        `Booking pickup for order ${orderId} via logistics partner...`,
      );
      const { bookingRef, trackingUrl } = await this.client.bookPickup(
        orderId,
        pickupAddress,
        deliveryAddress,
        contactPhone,
      );

      // 2. Save DeliveryBooking record
      const booking = await this.prisma.deliveryBooking.create({
        data: {
          orderId: order.id,
          method: "PLATFORM_LOGISTICS",
          partnerName: process.env.LOGISTICS_PARTNER || "mock_partner", // Can make dynamic based on client used
          partnerRef: bookingRef,
          trackingUrl: trackingUrl,
          pickupAddress: pickupAddress,
          deliveryAddress: deliveryAddress,
          status: DeliveryStatus.PENDING,
          // Since it's a booking, actual costs might be settled offline, but we store the fee charged
          estimatedCostKobo: order.deliveryFeeKobo,
        },
      });

      this.logger.log(
        `Created delivery booking for order ${orderId}: Ref ${bookingRef}`,
      );
      return booking;
    } catch (error) {
      this.logger.error(
        `Failed to book pickup for order ${orderId}`,
        error instanceof Error ? error.stack : String(error),
      );

      // Save a failed booking so we can track the error and retry manually
      const failedBooking = await this.prisma.deliveryBooking.create({
        data: {
          orderId: order.id,
          method: "PLATFORM_LOGISTICS",
          pickupAddress:
            order.merchantProfile?.businessAddress ||
            order.supplierProfile?.companyAddress ||
            "Unknown",
          deliveryAddress: order.deliveryAddress || "Unknown",
          status: DeliveryStatus.FAILED,
          estimatedCostKobo: order.deliveryFeeKobo,
        },
      });

      // TODO: Send admin alert that booking failed and needs manual intervention

      return failedBooking;
    }
  }

  // Called by partner webhooks (e.g., GIG, Kwik)
  async handlePartnerWebhook(payload: any) {
    // 1. For a real provider, extract bookingRef, status, etc.
    // Assuming simple mapping for our mock
    const partnerRef = payload.bookingRef;
    const rawStatus = payload.status;

    if (!partnerRef || typeof partnerRef !== "string" || !partnerRef.trim()) {
      throw new BadRequestException(
        "Invalid webhook payload: missing bookingRef",
      );
    }

    if (
      !rawStatus ||
      !Object.values(DeliveryStatus).includes(rawStatus as DeliveryStatus)
    ) {
      throw new BadRequestException(
        `Invalid webhook payload: unknown status "${rawStatus}". Valid values: ${Object.values(DeliveryStatus).join(", ")}`,
      );
    }

    const newStatus = rawStatus as DeliveryStatus;

    this.logger.log(
      `Received webhook for booking ${partnerRef}: Status ${newStatus}`,
    );

    const booking = await this.prisma.deliveryBooking.findFirst({
      where: { partnerRef },
      include: {
        order: {
          include: {
            user: true,
            merchantProfile: true,
            supplierProfile: true,
          },
        },
      },
    });

    if (!booking) {
      this.logger.warn(
        `No delivery booking found for partnerRef: ${partnerRef}`,
      );
      return { success: false, reason: "Booking not found" };
    }

    // Skip if status hasn't changed to avoid duplicate notifications
    if (booking.status === newStatus) {
      return { success: true, message: "Status unchanged" };
    }

    // 2. Update booking
    const updateData: any = { status: newStatus };
    if (newStatus === DeliveryStatus.PICKED_UP)
      updateData.pickedUpAt = new Date();
    if (newStatus === DeliveryStatus.DELIVERED)
      updateData.deliveredAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryBooking.update({
        where: { id: booking.id },
        data: updateData,
      });

      // 3. Create OrderTracking event
      await tx.orderTracking.create({
        data: {
          orderId: booking.orderId,
          status: this.mapDeliveryStatusToOrderStatus(newStatus),
          note: `Logistics partner update: ${newStatus}`,
        },
      });

      // Update the main order status if appropriate (e.g., delivered)
      if (newStatus === DeliveryStatus.DELIVERED) {
        await tx.order.update({
          where: { id: booking.orderId },
          data: { status: OrderStatus.DELIVERED },
        });
      }
    });

    // 4. Send WhatsApp notifications based on status
    const buyerPhone = booking.order.user.phone;
    const trackingUrl = booking.trackingUrl;

    try {
      // Notify Buyer
      await this.whatsappService.sendBuyerLogisticsUpdate(
        buyerPhone,
        booking.orderId,
        newStatus,
        trackingUrl,
      );

      // Notify Merchant
      if (booking.order.merchantId) {
        await this.whatsappService.sendMerchantLogisticsUpdate(
          booking.order.merchantId,
          booking.orderId,
          newStatus,
        );
      }
    } catch (err) {
      this.logger.error(
        `Failed to send WhatsApp notification for booking ${partnerRef}`,
        err,
      );
    }

    return { success: true };
  }

  async getTrackingStatus(orderId: string, userId: string, role: string) {
    const booking = await this.prisma.deliveryBooking.findUnique({
      where: { orderId },
      include: {
        order: {
          include: { trackingEvents: true },
        },
      },
    });

    if (!booking)
      throw new NotFoundException("Delivery tracking not found for this order");

    const order = booking.order;
    const isBuyer = role === UserRole.BUYER && order.buyerId === userId;
    const isMerchant =
      role === UserRole.MERCHANT && order.merchantId === userId;
    const isAdmin =
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.OPERATOR ||
      role === UserRole.SUPPORT;

    if (!isBuyer && !isMerchant && !isAdmin) {
      throw new ForbiddenException(
        "You do not have permission to view this tracking information",
      );
    }

    return {
      bookingRef: booking.partnerRef,
      status: booking.status,
      trackingUrl: booking.trackingUrl,
      estimatedArrival: booking.estimatedArrival,
      history: order.trackingEvents.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      ),
    };
  }

  private mapDeliveryStatusToOrderStatus(status: DeliveryStatus): OrderStatus {
    switch (status) {
      case DeliveryStatus.PICKED_UP:
      case DeliveryStatus.IN_TRANSIT:
      case DeliveryStatus.ARRIVING:
        return OrderStatus.DISPATCHED;
      case DeliveryStatus.DELIVERED:
        return OrderStatus.DELIVERED;
      case DeliveryStatus.FAILED:
        return OrderStatus.DISPUTE; // Or essentially hold it.
      default:
        return OrderStatus.PREPARING;
    }
  }
}
