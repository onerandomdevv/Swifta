import { IsString, IsNotEmpty } from "class-validator";

export class UpdateBankAccountDto {
  @IsString()
  @IsNotEmpty()
  bankAccountNumber!: string;

  @IsString()
  @IsNotEmpty()
  bankCode!: string;
}
