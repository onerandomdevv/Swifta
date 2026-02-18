import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenPair, JwtPayload } from '@hardware-os/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redis: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
        where: { OR: [{ email: dto.email }, { phone: dto.phone }] }
    });
    if (existingUser) {
        throw new ConflictException('User with email or phone already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
        data: {
            email: dto.email,
            phone: dto.phone,
            passwordHash,
            role: dto.role,
            // If merchant, create profile
            ...(dto.role === 'MERCHANT' && dto.businessName ? {
                merchantProfile: {
                    create: {
                        businessName: dto.businessName
                    }
                }
            } : {})
        }
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
        include: { merchantProfile: true }
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
        throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshTokens(userId: string, refreshToken: string) {
      // In a real app, verify refresh token matches what's in DB/Redis if we store it
      const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { merchantProfile: true }
      });
      if (!user) throw new UnauthorizedException();
      
      return this.generateTokens(user);
  }

  async logout(userId: string) {
      // Invalidate tokens if needed via Redis blacklist
      return { message: 'Logged out successfully' };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  private async generateTokens(user: any): Promise<TokenPair> {
    const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        merchantId: user.merchantProfile?.id
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

    return { accessToken, refreshToken };
  }
}
