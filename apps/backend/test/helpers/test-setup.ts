import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@hardware-os/shared';

export class TestSetup {
  public app: INestApplication;
  public prisma: PrismaService;
  public jwtService: JwtService;

  async init(): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    this.prisma = moduleFixture.get<PrismaService>(PrismaService);
    this.jwtService = moduleFixture.get<JwtService>(JwtService);

    // Mimic the main.ts setup required for exact route matching
    await this.app.init();
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
    await this.app.close();
  }

  async createMockBuyer() {
    const email = `test.buyer.${Date.now()}@hardware.os`;
    const user = await this.prisma.user.create({
      data: {
        email,
        phone: `+234${Math.floor(1000000000 + Math.random() * 900000000)}`,
        passwordHash: 'hashed_password', // Bypassing bcrypt for raw DB seed
        fullName: 'Test Buyer',
        role: UserRole.BUYER,
        emailVerified: true,
      },
    });

    const token = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      { secret: process.env.JWT_ACCESS_SECRET || 'fallback-secret', expiresIn: '15m' }
    );

    return { user, token };
  }

  async createMockMerchant() {
    const email = `test.merchant.${Date.now()}@hardware.os`;
    const user = await this.prisma.user.create({
      data: {
        email,
        phone: `+234${Math.floor(1000000000 + Math.random() * 900000000)}`,
        passwordHash: 'hashed_password', // Bypassing bcrypt for raw DB seed
        fullName: 'Test Merchant',
        role: UserRole.MERCHANT,
        emailVerified: true,
        merchantProfile: {
          create: {
            businessName: 'Golden Path Cement Co.',
            businessAddress: '123 E2E Street, Lagos',
            businessType: 'SUPPLIER',
            cacNumber: 'RC123456',
            verification: 'VERIFIED',
          },
        },
      },
      include: {
        merchantProfile: true,
      },
    });

    const token = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, merchantId: user.merchantProfile?.id },
      { secret: process.env.JWT_ACCESS_SECRET || 'fallback-secret', expiresIn: '15m' }
    );

    return { user, merchantProfile: user.merchantProfile, token };
  }
}
