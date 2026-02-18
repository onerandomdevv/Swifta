import { Controller, Get, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '@hardware-os/shared';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.notificationService.getUserNotifications(user.sub, page, limit);
  }

  @Patch(':id/read')
  markAsRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notificationService.markAsRead(user.sub, id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: JwtPayload) {
      return this.notificationService.markAllAsRead(user.sub);
  }
}
