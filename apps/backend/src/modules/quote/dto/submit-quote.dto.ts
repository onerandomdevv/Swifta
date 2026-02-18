import { IsUUID, IsNumber, IsOptional, IsDateString, IsString } from 'class-validator';

export class SubmitQuoteDto {
  @IsUUID()
  rfqId: string;

  @IsNumber()
  unitPriceKobo: bigint;

  @IsNumber()
  totalPriceKobo: bigint;

  @IsOptional()
  @IsNumber()
  deliveryFeeKobo: bigint = BigInt(0);

  @IsDateString()
  validUntil: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
