import { IsString, IsOptional } from "class-validator";

export class UssdCallbackDto {
  @IsString()
  sessionId!: string;

  @IsString()
  phoneNumber!: string;

  @IsString()
  serviceCode!: string;

  @IsString()
  @IsOptional()
  text!: string;
}
