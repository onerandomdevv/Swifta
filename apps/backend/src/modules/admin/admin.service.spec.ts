import { Test, TestingModule } from "@nestjs/testing";
import { AdminService } from "./admin.service";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../redis/redis.service";
import { NotificationTriggerService } from "../notification/notification-trigger.service";
import { AuditLogService } from "./audit-log.service";
import { VerificationService } from "../verification/verification.service";
import { getQueueToken } from "@nestjs/bullmq";
import { PAYOUT_QUEUE } from "../../queue/queue.constants";
import {
  OrderStatus,
  OrderDisputeStatus,
  InventoryEventType,
} from "@twizrr/shared";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("AdminService", () => {
  let service: AdminService;

  const mockPrisma: any = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    orderEvent: {
      create: jest.fn(),
    },
    inventoryEvent: {
      create: jest.fn(),
    },
    productStockCache: {
      updateMany: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockNotifications = {
    triggerDisputeResolved: jest.fn(),
  };

  const mockAuditLog = {
    log: jest.fn(),
  };

  const mockVerification = {
    verifyMerchant: jest.fn(),
  };

  const mockPayoutQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: NotificationTriggerService, useValue: mockNotifications },
        { provide: AuditLogService, useValue: mockAuditLog },
        { provide: VerificationService, useValue: mockVerification },
        { provide: getQueueToken(PAYOUT_QUEUE), useValue: mockPayoutQueue },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("resolveDispute", () => {
    const orderId = "order-123";
    const adminId = "admin-456";

    it("should throw NotFoundException if order does not exist", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.resolveDispute(orderId, "BUYER", adminId, "Test"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if order is not in DISPUTE status", async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: orderId,
        status: OrderStatus.PAID,
        disputeStatus: OrderDisputeStatus.PENDING,
      });

      await expect(
        service.resolveDispute(orderId, "BUYER", adminId, "Test"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should resolve in favor of BUYER, mark REFUND_PENDING, and release inventory", async () => {
      const mockOrder = {
        id: orderId,
        status: OrderStatus.DISPUTE,
        disputeStatus: OrderDisputeStatus.PENDING,
        items: [
          { productId: "prod-1", quantity: 2 },
          { productId: "prod-2", quantity: 1 },
        ],
        buyerId: "buyer-1",
        merchantId: "merchant-1",
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.REFUND_PENDING,
      });

      const result = await service.resolveDispute(
        orderId,
        "BUYER",
        adminId,
        "Item not as described",
      );

      expect(result.status).toBe(OrderStatus.REFUND_PENDING);

      // Verify Order Update (within transaction)
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: orderId },
          data: expect.objectContaining({
            status: OrderStatus.REFUND_PENDING,
            disputeStatus: OrderDisputeStatus.RESOLVED_BUYER,
            payoutStatus: "CANCELLED",
          }),
        }),
      );

      // Verify Inventory Events
      expect(mockPrisma.inventoryEvent.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.inventoryEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId: "prod-1",
            eventType: InventoryEventType.ORDER_RELEASED,
          }),
        }),
      );

      // Verify Stock Cache Update
      expect(mockPrisma.productStockCache.updateMany).toHaveBeenCalledTimes(2);

      // Verify Notifications
      expect(mockNotifications.triggerDisputeResolved).toHaveBeenCalledWith(
        "buyer-1",
        "merchant-1",
        orderId,
        "BUYER",
      );
    });

    it("should resolve in favor of MERCHANT, mark COMPLETED, and queue payout", async () => {
      const mockOrder = {
        id: orderId,
        status: OrderStatus.DISPUTE,
        disputeStatus: OrderDisputeStatus.PENDING,
        buyerId: "buyer-1",
        merchantId: "merchant-1",
        paymentMethod: "ESCROW",
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.COMPLETED,
      });

      const result = await service.resolveDispute(
        orderId,
        "MERCHANT",
        adminId,
        "Delivery confirmed by courier",
      );

      expect(result.status).toBe(OrderStatus.COMPLETED);

      // Verify Order Update
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: orderId },
          data: expect.objectContaining({
            status: OrderStatus.COMPLETED,
            disputeStatus: OrderDisputeStatus.RESOLVED_MERCHANT,
            payoutStatus: "PENDING",
          }),
        }),
      );

      // Verify Payout Queued
      expect(mockPayoutQueue.add).toHaveBeenCalled();

      // Verify Notifications
      expect(mockNotifications.triggerDisputeResolved).toHaveBeenCalledWith(
        "buyer-1",
        "merchant-1",
        orderId,
        "MERCHANT",
      );
    });
  });
});
