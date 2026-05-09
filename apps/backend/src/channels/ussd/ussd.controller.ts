import { Controller, Post, Body, Res, Logger } from "@nestjs/common";
import { Response } from "express";
import { SkipThrottle } from "@nestjs/throttler";
import { UssdService } from "./ussd.service";
import { UssdCallbackDto } from "./ussd.dto";

@Controller("ussd")
@SkipThrottle()
export class UssdController {
  private readonly logger = new Logger(UssdController.name);

  constructor(private readonly ussdService: UssdService) {}

  @Post("callback")
  async handleCallback(@Body() dto: UssdCallbackDto, @Res() res: Response) {
    this.logger.log(
      `USSD callback | session: ${dto.sessionId} | phone: ${dto.phoneNumber} | text: ${dto.text}`,
    );

    const response = await this.ussdService.processSession(dto);

    res.set("Content-Type", "text/plain");
    res.send(response);
  }
}
