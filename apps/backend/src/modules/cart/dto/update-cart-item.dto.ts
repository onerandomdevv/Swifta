import { IsNotEmpty, IsNumber, Min } from "class-validator";

export class UpdateCartItemDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity!: number;
}
