import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";
import { PriceType } from "@twizrr/shared";

export class AddToCartDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity: number;

  @IsEnum(PriceType)
  @IsOptional()
  priceType?: PriceType;
}
