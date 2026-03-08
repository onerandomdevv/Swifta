// BigInt JSON serialization polyfill — required for Prisma BigInt columns
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { Logger } from "nestjs-pino";
import { AppValidationPipe } from "./common/pipes/validation.pipe";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { ResponseTransformInterceptor } from "./common/interceptors/response-transform.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true, // Required for Paystack webhook HMAC verification
  });

  app.useLogger(app.get(Logger));

  // Global validation pipe (whitelist + transform + formatted errors)
  app.useGlobalPipes(new AppValidationPipe());

  // Global exception filter (formats all errors including Prisma)
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",")
      : "*",
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, "0.0.0.0");
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
