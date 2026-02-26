import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  Matches,
} from "class-validator";
import { UserRole } from "@hardware-os/shared";

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @Matches(/^[\p{L}\s'-]+$/u, {
    message: "First name contains invalid characters",
  })
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  @Matches(/^[\p{L}\s'-]+$/u, {
    message: "Last name contains invalid characters",
  })
  lastName: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
    {
      message:
        "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character",
    },
  )
  password: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsEnum(UserRole)
  role: UserRole;
}
