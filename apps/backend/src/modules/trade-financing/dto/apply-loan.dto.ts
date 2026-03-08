import { IsUUID, IsInt, Min, Max } from "class-validator";

export class ApplyLoanDto {
  @IsUUID()
  orderId: string;

  @IsInt()
  @Min(7)
  @Max(365)
  tenureDays: number;
}
