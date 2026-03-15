import {
  Controller,
  Post,
  Patch,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ReorderService } from "./reorder.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole, JwtPayload } from "@swifta/shared";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReorderController {
  constructor(private readonly reorderService: ReorderService) {}



  @Patch("reorder-reminders/:id/dismiss")
  dismiss(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.reorderService.dismiss(id, user.sub);
  }
}
