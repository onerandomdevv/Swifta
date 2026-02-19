import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenPair, JwtPayload } from '@hardware-os/shared';

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_PREFIX = 'refresh_token:';
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redis: RedisService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });
    if (existingUser) {
      throw new ConflictException('User with email or phone already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
        ...(dto.role === 'MERCHANT' && dto.businessName
          ? {
              merchantProfile: {
                create: {
                  businessName: dto.businessName,
                },
              },
            }
          : {}),
      },
      include: { merchantProfile: true },
    });

    return this.generateAndStoreTokens(user);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { merchantProfile: true },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAndStoreTokens(user);
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<TokenPair> {
    // Validate the refresh token against Redis
    await this.validateRefreshToken(userId, refreshToken);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { merchantProfile: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Rotate: generate new pair and store new refresh token (old one is overwritten)
    return this.generateAndStoreTokens(user);
  }

  async logout(userId: string): Promise<{ message: string }> {
    // Delete refresh token from Redis — invalidates all sessions for this user
    await this.redis.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
    return { message: 'Logged out successfully' };
  }

  /**
   * Validates the incoming refresh token against the hashed version stored in Redis.
   * Throws UnauthorizedException if token is invalid or expired.
   */
  private async validateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const storedHash = await this.redis.get(`${REFRESH_TOKEN_PREFIX}${userId}`);

    if (!storedHash) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    const isValid = await bcrypt.compare(refreshToken, storedHash);
    if (!isValid) {
      // Possible token theft — delete stored token to force re-login
      await this.redis.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
      this.logger.warn(`Invalid refresh token attempt for user ${userId}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Generates access + refresh tokens, hashes the refresh token,
   * and stores it in Redis with a 7-day TTL.
   */
  private async generateAndStoreTokens(user: any): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      merchantId: user.merchantProfile?.id,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessTtl'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshTtl'),
      }),
    ]);

    // Hash and store refresh token in Redis
    const refreshHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.redis.set(
      `${REFRESH_TOKEN_PREFIX}${user.id}`,
      refreshHash,
      REFRESH_TOKEN_TTL,
    );

    return { accessToken, refreshToken };
  }
}
