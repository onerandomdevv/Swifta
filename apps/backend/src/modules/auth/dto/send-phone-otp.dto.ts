import { IsPhoneNumber, IsNotEmpty } from "class-validator";

export class SendPhoneOtpDto {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;
}
