import { IsNotEmpty, IsInt, Min } from "class-validator";

export class UpdateCartItemDto {
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  quantity!: number;
}
