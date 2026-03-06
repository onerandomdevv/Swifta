import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUrl } from "class-validator";
import { VerificationIdType, VerificationRequestStatus } from "@hardware-os/shared";

export class SubmitVerificationDto {
  @IsUrl({ protocols: ["https"], require_protocol: true })
  governmentIdUrl: string;

  @IsEnum(VerificationIdType)
  @IsNotEmpty()
  idType: VerificationIdType;

  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  cacCertUrl?: string;
}

export class ReviewVerificationDto {
  @IsEnum(VerificationRequestStatus)
  decision: VerificationRequestStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
