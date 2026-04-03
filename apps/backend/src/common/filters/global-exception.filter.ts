import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { ApiError } from "@twizrr/shared";
import * as fs from "fs";
import * as path from "path";

// Prisma error types — imported by name to avoid hard dependency on @prisma/client at filter level
const PRISMA_UNIQUE_CONSTRAINT = "P2002";
const PRISMA_NOT_FOUND = "P2025";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let errorMessage: string;
    let code: string;

    if (exception instanceof HttpException) {
      // NestJS HTTP exceptions (BadRequest, Unauthorized, etc.)
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      errorMessage =
        typeof exceptionResponse === "object"
          ? (exceptionResponse as any).message || exception.message
          : exceptionResponse;
      code = status.toString();
    } else if (this.isPrismaKnownError(exception)) {
      // Prisma known request errors (unique constraint, not found, etc.)
      const prismaResult = this.handlePrismaError(exception);
      status = prismaResult.status;
      errorMessage = prismaResult.message;
      code = prismaResult.code;
    } else if (this.isPrismaValidationError(exception)) {
      // Prisma validation errors (bad query shape)
      status = HttpStatus.BAD_REQUEST;
      errorMessage = "Invalid request data";
      code = "VALIDATION_ERROR";
    } else {
      // Unknown errors — log full details, return generic message
      this.logger.error(
        {
          err:
            exception instanceof Error
              ? exception
              : new Error(String(exception)),
        },
        "Unhandled exception",
      );
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorMessage = "Internal server error";
      code = "INTERNAL_ERROR";
    }

    // Flatten array messages (from ValidationPipe)
    if (Array.isArray(errorMessage)) {
      errorMessage = errorMessage.join("; ");
    }

    const errorResponse: ApiError = {
      statusCode: status,
      code,
      error: errorMessage,
    };

    response.status(status).json(errorResponse);
  }

  private isPrismaKnownError(exception: unknown): boolean {
    return (
      typeof exception === "object" &&
      exception !== null &&
      "code" in exception &&
      "clientVersion" in exception
    );
  }

  private isPrismaValidationError(exception: unknown): boolean {
    return (
      typeof exception === "object" &&
      exception !== null &&
      exception.constructor?.name === "PrismaClientValidationError"
    );
  }

  private handlePrismaError(exception: any): {
    status: number;
    message: string;
    code: string;
  } {
    switch (exception.code) {
      case PRISMA_UNIQUE_CONSTRAINT: {
        const fields = exception.meta?.target?.join(", ") || "field";
        return {
          status: HttpStatus.CONFLICT,
          message: `A record with this ${fields} already exists`,
          code: "UNIQUE_CONSTRAINT",
        };
      }
      case PRISMA_NOT_FOUND:
        return {
          status: HttpStatus.NOT_FOUND,
          message: exception.meta?.cause || "Record not found",
          code: "NOT_FOUND",
        };
      default: {
        // Log the full error to a debug file for capture
        try {
          const logPath = path.join(process.cwd(), "error_debug.log");
          const logContent =
            `\n[${new Date().toISOString()}] PRISMA ERROR: ${exception.code}\n` +
            `Message: ${exception.message}\n` +
            `Meta: ${JSON.stringify(exception.meta, null, 2)}\n` +
            `Stack: ${exception.stack}\n` +
            `------------------------------------------\n`;
          fs.appendFileSync(logPath, logContent);
        } catch (e) {
          this.logger.error("Failed to write to error_debug.log", e);
        }

        return {
          status: HttpStatus.BAD_REQUEST,
          message: "Database operation failed",
          code: `PRISMA_${exception.code}`,
        };
      }
    }
  }
}
