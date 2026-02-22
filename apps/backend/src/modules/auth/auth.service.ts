import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomInt, randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { TokenPair, JwtPayload } from '@hardware-os/shared';

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_PREFIX = 'refresh_token:';
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

const EMAIL_OTP_PREFIX = 'email_otp:';
const EMAIL_OTP_TTL = 600; // 10 minutes in seconds
const EMAIL_OTP_RATE_PREFIX = 'email_otp_count:';
const EMAIL_OTP_RATE_TTL = 600; // 10 minutes window
const EMAIL_OTP_MAX_RESENDS = 3;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redis: RedisService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair & { user: any }> {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });
    if (existingUser) {
      throw new ConflictException('This email or phone number is already registered. Please log in instead.');
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

    // Generate and store OTP for email verification
    await this.generateAndStoreOtp(dto.email);

    return this.generateAndStoreTokens(user);
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const storedOtp = await this.redis.get(`${EMAIL_OTP_PREFIX}${dto.email}`);

    if (!storedOtp) {
      throw new BadRequestException('Verification code expired or not found. Please request a new one.');
    }

    if (storedOtp !== dto.code) {
      throw new BadRequestException('Invalid verification code.');
    }

    // Mark user as verified
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // Clean up OTP and rate limit keys
    await this.redis.del(`${EMAIL_OTP_PREFIX}${dto.email}`);
    await this.redis.del(`${EMAIL_OTP_RATE_PREFIX}${dto.email}`);

    this.logger.log(`Email verified for user ${dto.email}`);

    return { message: 'Email verified successfully.' };
  }

  async resendVerification(dto: ResendVerificationDto): Promise<{ message: string }> {
    // Verify the user exists and isn't already verified
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      // Return success even if user not found (don't leak user existence)
      return { message: 'If an account with that email exists, a new code has been sent.' };
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified.');
    }

    // Rate limiting: max 3 resends per 10 minutes
    const rateKey = `${EMAIL_OTP_RATE_PREFIX}${dto.email}`;
    const currentCount = await this.redis.get(rateKey);
    const count = currentCount ? parseInt(currentCount, 10) : 0;

    if (count >= EMAIL_OTP_MAX_RESENDS) {
      throw new BadRequestException('Too many resend attempts. Please wait 10 minutes before trying again.');
    }

    // Generate and store new OTP (overwrites the old one)
    await this.generateAndStoreOtp(dto.email);

    // Increment rate limit counter
    await this.redis.set(rateKey, (count + 1).toString(), EMAIL_OTP_RATE_TTL);

    return { message: 'If an account with that email exists, a new code has been sent.' };
  }

  async login(dto: LoginDto): Promise<TokenPair & { user: any }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { merchantProfile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Account not found. Please sign up to create an account.');
    }

    if (!(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAndStoreTokens(user);
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<TokenPair & { user: any }> {
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

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    
    // Always return same message to prevent email enumeration
    const successMessage = 'If an account exists for that email, a password reset link has been sent.';
    
    if (!user) {
      return { message: successMessage };
    }

    // Generate secure token
    const resetToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(resetToken).digest('hex');
    
    // Set expiry to 15 mins
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: expiresAt,
      },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    await this.emailService.sendPasswordResetEmail(dto.email, resetToken, frontendUrl);

    return { message: successMessage };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    // Hash the plain token to match what is stored in the database
    const hashedToken = createHash('sha256').update(dto.token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(), // must not be expired
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Log out all active sessions for this user globally for security
    await this.redis.del(`${REFRESH_TOKEN_PREFIX}${user.id}`);

    this.logger.log(`Password reset successfully for user: ${user.email}`);

    return { message: 'Password has been successfully reset' };
  }

  /**
   * Generates a cryptographically random 6-digit OTP, stores it in Redis,
   * and logs it to the console.
   */
  private async generateAndStoreOtp(email: string): Promise<void> {
    const otp = randomInt(100000, 999999).toString();

    await this.redis.set(`${EMAIL_OTP_PREFIX}${email}`, otp, EMAIL_OTP_TTL);

    await this.emailService.sendVerificationEmail(email, otp);
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
  private async generateAndStoreTokens(user: any): Promise<TokenPair & { user: any }> {
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

    return { 
      accessToken, 
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        merchantId: user.merchantProfile?.id,
      }
    };
  }
}
