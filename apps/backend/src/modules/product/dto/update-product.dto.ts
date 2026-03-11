import { IsOptional, IsString, IsInt, Min, IsBoolean } from "class-validator";

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  categoryTag?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  minOrderQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minOrderQuantityConsumer?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  warehouseLocation?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  pricePerUnitKobo?: string;

  @IsOptional()
  @IsString()
  wholesalePriceKobo?: string;

  @IsOptional()
  @IsString()
  retailPriceKobo?: string;
}
