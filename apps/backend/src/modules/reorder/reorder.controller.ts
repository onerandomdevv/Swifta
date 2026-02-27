import { Controller, Post, Patch, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ReorderService } from './reorder.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, JwtPayload } from '@hardware-os/shared';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReorderController {
  constructor(private readonly reorderService: ReorderService) {}

  @Post('rfqs/from-reorder/:reminderId')
  @Roles(UserRole.BUYER)
  createRFQFromReminder(
    @CurrentUser() user: JwtPayload,
    @Param('reminderId', ParseUUIDPipe) reminderId: string,
  ) {
    return this.reorderService.createRFQFromReminder(reminderId, user.sub);
  }

  @Patch('reorder-reminders/:id/dismiss')
  dismiss(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reorderService.dismiss(id, user.sub);
  }
}
