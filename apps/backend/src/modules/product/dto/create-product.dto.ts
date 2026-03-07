import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsIn } from "class-validator";
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
  @IsIn(PRODUCT_CATEGORIES, { message: "Invalid category" })
  categoryTag: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  minOrderQuantity?: number;

  @IsOptional()
  @IsString()
  warehouseLocation?: string;

  @IsOptional()
  @IsString()
  pricePerUnitKobo?: string;
}
