import { IsInt, IsPositive } from "class-validator";

export class RequestPayoutDto {
  @IsInt()
  @IsPositive()
  amount!: number;
}
