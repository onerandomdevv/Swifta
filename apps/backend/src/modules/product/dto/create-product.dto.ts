import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  unit: string;

  @IsString()
  categoryTag: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  minOrderQuantity?: number;
}
