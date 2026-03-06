import { IsString, IsNotEmpty, IsOptional, IsEnum } from "class-validator";

export class SubmitVerificationDto {
  @IsString()
  @IsNotEmpty()
  governmentIdUrl: string;

  @IsString()
  @IsNotEmpty()
  idType: string;

  @IsOptional()
  @IsString()
  cacCertUrl?: string;
}

export class ReviewVerificationDto {
  @IsEnum(["APPROVED", "REJECTED"])
  decision: "APPROVED" | "REJECTED";

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
