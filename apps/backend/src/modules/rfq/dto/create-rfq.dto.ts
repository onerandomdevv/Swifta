import {
  IsUUID,
  IsInt,
  Min,
  IsString,
  IsOptional,
  IsNotEmpty,
  IsObject,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class UnlistedItemDetailsDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  unit: string;
}

export class CreateRFQDto {
  @IsUUID()
  @IsOptional()
  productId?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UnlistedItemDetailsDto)
  unlistedItemDetails?: UnlistedItemDetailsDto;

  @IsUUID()
  @IsOptional()
  targetMerchantId?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
