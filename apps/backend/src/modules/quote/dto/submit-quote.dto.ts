import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsDateString,
  IsString,
  IsNotEmpty,
  Min,
} from "class-validator";

export class SubmitQuoteDto {
  @IsUUID()
  @IsNotEmpty()
  rfqId: string;

  @IsNumber()
  @Min(1)
  unitPriceKobo: bigint;

  @IsNumber()
  @Min(1)
  totalPriceKobo: bigint;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFeeKobo?: bigint;

  @IsDateString()
  @IsNotEmpty()
  validUntil: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
