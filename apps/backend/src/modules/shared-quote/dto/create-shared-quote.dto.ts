import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class SharedQuoteItemDto {
  @IsString()
  productName: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPriceKobo: number;

  @IsNumber()
  totalKobo: number;
}

export class CreateSharedQuoteDto {
  @IsOptional()
  @IsString()
  buyerName?: string;

  @IsOptional()
  @IsString()
  buyerPhone?: string;

  @IsOptional()
  @IsString()
  buyerEmail?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SharedQuoteItemDto)
  items: SharedQuoteItemDto[];

  @IsOptional()
  @IsNumber()
  deliveryFeeKobo?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
