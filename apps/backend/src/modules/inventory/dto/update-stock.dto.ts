import { IsInt, IsString, IsOptional } from 'class-validator';

export class UpdateStockDto {
  @IsInt()
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
