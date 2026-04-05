import { IsString, IsNotEmpty } from "class-validator";

export class SendPhoneOtpDto {
  @IsNotEmpty()
  @IsString()
  phone!: string;
}
