import { IsUUID, IsInt, Min, IsString, IsOptional } from 'class-validator';

export class CreateRFQDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  deliveryAddress: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
