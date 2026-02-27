import { IsNumber, IsPositive } from "class-validator";

export class RequestPayoutDto {
  @IsNumber()
  @IsPositive()
  amount: number;
}
