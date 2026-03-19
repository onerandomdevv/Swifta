import { IsObject, IsOptional } from "class-validator";

export class UpdatePreferencesDto {
  @IsObject()
  @IsOptional()
  notificationPreferences?: Record<string, any>;
}
