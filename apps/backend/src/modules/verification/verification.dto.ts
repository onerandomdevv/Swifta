import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUrl,
  IsIn,
} from "class-validator";
import { VerificationIdType } from "@twizrr/shared";

export class SubmitVerificationDto {
  @IsUrl({ protocols: ["https"], require_protocol: true })
  governmentIdUrl!: string;

  @IsEnum(VerificationIdType)
  @IsNotEmpty()
  idType!: VerificationIdType;

  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  cacCertUrl?: string;

  @IsNotEmpty()
  @IsIn(["TIER_2", "TIER_3"])
  targetTier!: "TIER_2" | "TIER_3";

  @IsOptional()
  @IsString()
  ninNumber?: string;

  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  proofOfAddressUrl?: string;
}

export class ReviewVerificationDto {
  @IsIn(["APPROVED", "REJECTED"], {
    message: "decision must be APPROVED or REJECTED",
  })
  decision!: "APPROVED" | "REJECTED";

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
