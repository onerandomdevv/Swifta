import { Module, forwardRef } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtModule, type JwtSignOptions } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { InternalAuthController } from "./internal-auth.controller";
import { AuthService } from "./auth.service";
import { JwtAccessStrategy } from "./strategies/jwt-access.strategy";
import { JwtRefreshStrategy } from "./strategies/jwt-refresh.strategy";
import { PrismaModule } from "../../prisma/prisma.module";
import { RedisModule } from "../../redis/redis.module";
import { AdminModule } from "../admin/admin.module";
import { NotificationModule } from "../notification/notification.module";
import { EmailModule } from "../email/email.module";
import { WhatsAppModule } from "../../channels/whatsapp/whatsapp.module";

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("jwt.accessSecret"),
        signOptions: {
          expiresIn: configService.getOrThrow<string>(
            "jwt.accessTtl",
          ) as JwtSignOptions["expiresIn"],
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    PrismaModule,
    RedisModule,
    NotificationModule,
    EmailModule,
    forwardRef(() => AdminModule),
    forwardRef(() => WhatsAppModule),
  ],
  controllers: [AuthController, InternalAuthController],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
