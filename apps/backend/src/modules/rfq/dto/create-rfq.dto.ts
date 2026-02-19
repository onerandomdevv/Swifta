import { IsUUID, IsInt, Min, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateRFQDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

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
