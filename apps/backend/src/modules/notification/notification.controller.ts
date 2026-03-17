import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "@swifta/shared";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: PaginationQueryDto) {
    return this.notificationService.getUserNotifications(
      user.sub,
      query.page,
      query.limit,
    );
  }

  @Get("unread-count")
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationService.getUnreadCount(user.sub);
  }

  @Patch(":id/read")
  markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.notificationService.markAsRead(user.sub, id);
  }

  @Patch("read-all")
  markAllAsRead(@CurrentUser() user: JwtPayload) {
    return this.notificationService.markAllAsRead(user.sub);
  }
}
