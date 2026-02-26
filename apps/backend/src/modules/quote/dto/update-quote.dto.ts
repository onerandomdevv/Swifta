import {
  IsNumber,
  IsOptional,
  IsDateString,
  IsString,
  Min,
} from "class-validator";

export class UpdateQuoteDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  unitPriceKobo?: bigint;

  @IsOptional()
  @IsNumber()
  @Min(1)
  totalPriceKobo?: bigint;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFeeKobo?: bigint;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
