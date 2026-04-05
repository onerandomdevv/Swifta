import {
  IsString,
  IsNumber,
  Min,
  IsNotEmpty,
  IsOptional,
} from "class-validator";

export class CreateSupplierProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  wholesalePriceKobo!: number;

  @IsNumber()
  @Min(1)
  minOrderQty!: number;

  @IsString()
  @IsNotEmpty()
  unit!: string;
}
