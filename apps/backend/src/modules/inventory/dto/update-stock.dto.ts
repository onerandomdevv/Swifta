import { IsInt, IsString, IsOptional, IsNotEmpty } from "class-validator";

export class UpdateStockDto {
  @IsInt()
  @IsNotEmpty()
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
