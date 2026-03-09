import { IsPhoneNumber, IsNotEmpty, IsString, Length } from "class-validator";

export class VerifyPhoneOtpDto {
  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code: string;
}
