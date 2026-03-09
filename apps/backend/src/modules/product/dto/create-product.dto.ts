import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsIn,
} from "class-validator";
import { PRODUCT_CATEGORIES } from "@hardware-os/shared";

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsString()
  @IsNotEmpty()
  categoryTag: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  minOrderQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minOrderQuantityConsumer?: number;

  @IsOptional()
  @IsString()
  warehouseLocation?: string;

  @IsOptional()
  @IsString()
  pricePerUnitKobo?: string;

  @IsOptional()
  @IsString()
  retailPriceKobo?: string;
}
