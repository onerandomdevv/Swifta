import { Test, TestingModule } from "@nestjs/testing";
import { WaitlistService } from "./waitlist.service";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { ConfigService } from "@nestjs/config";
import { ConflictException } from "@nestjs/common";

describe("WaitlistService", () => {
  let service: WaitlistService;
  let prisma: PrismaService;
  let emailService: EmailService;

  const mockPrisma = {
    merchantWaitlist: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockEmailService = {
    sendWelcomeEmail: jest.fn(),
    sendWaitlistAlert: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaitlistService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<WaitlistService>(WaitlistService);
    prisma = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should successfully create a waitlist entry and send a welcome email", async () => {
      const createDto = {
        businessName: "Test Business",
        email: "test@example.com",
        phone: "+2348012345678",
      };

      const mockEntry = {
        id: "123",
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.merchantWaitlist.create.mockResolvedValue(mockEntry);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(true);
      mockConfigService.get.mockReturnValue(undefined); // No admin email configured

      const result = await service.create(createDto);

      expect(result).toEqual(mockEntry);
      expect(prisma.merchantWaitlist.create).toHaveBeenCalledWith({
        data: {
          businessName: createDto.businessName,
          email: createDto.email.toLowerCase(),
          phone: createDto.phone,
        },
      });
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        createDto.email,
        createDto.businessName,
        "MERCHANT",
      );
      expect(emailService.sendWaitlistAlert).not.toHaveBeenCalled();
    });

    it("should send an admin alert if ADMIN_EMAIL is configured", async () => {
      const createDto = {
        businessName: "Test Business",
        email: "test@example.com",
      };

      const mockEntry = {
        id: "123",
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.merchantWaitlist.create.mockResolvedValue(mockEntry);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(true);
      mockEmailService.sendWaitlistAlert.mockResolvedValue(true);
      mockConfigService.get.mockReturnValue("admin@twizrr.com");

      await service.create(createDto);

      expect(emailService.sendWaitlistAlert).toHaveBeenCalledWith(
        "admin@twizrr.com",
        createDto.businessName,
        createDto.email,
        "N/A",
      );
    });

    it("should throw a ConflictException if email already exists", async () => {
      const createDto = {
        businessName: "Duplicate",
        email: "dup@example.com",
      };

      mockPrisma.merchantWaitlist.create.mockRejectedValue({ code: "P2002" });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it("should bubble up non-P2002 errors during creation", async () => {
      const createDto = {
        businessName: "Error",
        email: "err@example.com",
      };

      mockPrisma.merchantWaitlist.create.mockRejectedValue(
        new Error("DB Error"),
      );

      await expect(service.create(createDto)).rejects.toThrow("DB Error");
    });
  });

  describe("findAll", () => {
    it("should return an array of waitlist entries", async () => {
      const mockEntries = [
        { id: "1", businessName: "Biz A", email: "a@b.com" },
        { id: "2", businessName: "Biz B", email: "c@d.com" },
      ];

      mockPrisma.merchantWaitlist.findMany.mockResolvedValue(mockEntries);

      const result = await service.findAll();

      expect(result).toEqual(mockEntries);
      expect(prisma.merchantWaitlist.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
      });
    });
  });
});
