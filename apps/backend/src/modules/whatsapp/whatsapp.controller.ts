import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  HttpCode,
  Logger,
} from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import type { Request, Response } from "express";
import * as crypto from "crypto";
import { SkipThrottle } from "@nestjs/throttler";
import { RedisService } from "../../redis/redis.service";
import { WHATSAPP_QUEUE } from "../../queue/queue.constants";
import { WA_MSG_DEDUP_PREFIX, MSG_DEDUP_TTL } from "./whatsapp.constants";

/**
 * WhatsApp Webhook Controller
 *
 * GET  /whatsapp/webhook — Meta verification challenge
 * POST /whatsapp/webhook — Incoming message handler (async via BullMQ)
 *
 * Both endpoints are public (no JWT auth) and skip throttle.
 */
@SkipThrottle()
@Controller("whatsapp")
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
    @InjectQueue(WHATSAPP_QUEUE) private whatsappQueue: Queue,
  ) {}

  // -----------------------------------------------------------------------
  // GET /whatsapp/webhook — Meta webhook verification
  // -----------------------------------------------------------------------
  @Get("webhook")
  verifyWebhook(
    @Query("hub.mode") mode: string,
    @Query("hub.verify_token") token: string,
    @Query("hub.challenge") challenge: string,
    @Res() res: Response,
  ) {
    const verifyToken = this.configService.get<string>("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token === verifyToken) {
      this.logger.log("WhatsApp webhook verified successfully");
      // Must return challenge as plain text, not wrapped in JSON
      return res.status(200).send(challenge);
    }

    this.logger.warn("WhatsApp webhook verification failed — token mismatch");
    return res.status(403).send("Forbidden");
  }

  // -----------------------------------------------------------------------
  // POST /whatsapp/webhook — Incoming messages
  // -----------------------------------------------------------------------
  @Post("webhook")
  @HttpCode(200)
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    // 1. Verify signature
    const signature = req.headers["x-hub-signature-256"] as string;
    if (!this.verifySignature(req.rawBody, signature)) {
      this.logger.warn("WhatsApp webhook signature verification failed");
      // Return 200 anyway to avoid Meta retries on forged requests
      return { status: "ignored" };
    }

    const body = req.body;

    // 2. Extract message data from Meta's nested payload
    try {
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Ignore status updates (delivered, read receipts, etc.)
      if (!value?.messages || value.messages.length === 0) {
        return { status: "ok" };
      }

      const message = value.messages[0];
      const phone = message.from; // Sender's phone number (e.g. "2348147846093")
      const messageId = message.id; // Unique Meta message ID
      const messageType = message.type; // "text", "interactive", "image", etc.

      // Extract message content based on type
      let messageText: string | undefined;
      let interactiveReply:
        | { type: string; id: string; title: string }
        | undefined;
      let imageId: string | undefined;

      if (messageType === "text") {
        messageText = message.text?.body?.trim();
      } else if (messageType === "interactive") {
        // Handle Reply Button responses
        if (message.interactive?.button_reply) {
          interactiveReply = {
            type: "button_reply",
            id: message.interactive.button_reply.id,
            title: message.interactive.button_reply.title,
          };
        }
        // Handle List Message responses
        if (message.interactive?.list_reply) {
          interactiveReply = {
            type: "list_reply",
            id: message.interactive.list_reply.id,
            title: message.interactive.list_reply.title,
          };
        }
      } else if (messageType === "image") {
        imageId = message.image?.id;
      }

      // Skip if no usable content
      if (!messageText && !interactiveReply && !imageId) {
        return { status: "ok" };
      }

      // 3. Deduplicate — Meta sometimes sends duplicates
      const dedupKey = `${WA_MSG_DEDUP_PREFIX}${messageId}`;
      const alreadyProcessed = await this.redisService.get(dedupKey);
      if (alreadyProcessed) {
        this.logger.debug(`Duplicate message ignored: ${messageId}`);
        return { status: "ok" };
      }
      await this.redisService.set(dedupKey, "1", MSG_DEDUP_TTL);

      // 4. Queue for async processing — return 200 immediately
      await this.whatsappQueue.add(
        "process-message",
        { phone, messageText, messageId, interactiveReply, imageId },
        {
          attempts: 2,
          backoff: { type: "exponential", delay: 3000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );

      this.logger.log(
        `Queued WhatsApp message from ${phone}: type=${messageType}, text="${(messageText || "").substring(0, 50)}", interactive=${interactiveReply?.id || "none"}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing webhook payload: ${error instanceof Error ? error.message : error}`,
      );
    }

    // Always return 200 to Meta — never let processing failures cause retries
    return { status: "ok" };
  }

  // -----------------------------------------------------------------------
  // Signature verification
  // -----------------------------------------------------------------------
  private verifySignature(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ): boolean {
    if (!rawBody || !signature) return false;

    const appSecret = this.configService.get<string>("WHATSAPP_APP_SECRET");
    if (!appSecret) {
      this.logger.error("WHATSAPP_APP_SECRET not configured");
      return false;
    }

    const expectedSignature =
      "sha256=" +
      crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }
}
