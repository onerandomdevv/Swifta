import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  Matches,
} from "class-validator";
import { UserRole } from "@twizrr/shared";

export class RegisterDto {
  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: "User phone number in E.164 format",
    example: "+2348012345678",
  })
  @IsString()
  phone!: string;

  @ApiProperty({
    description: "User's first name",
    example: "John",
  })
  @IsString()
  @Matches(/^[\p{L}\s'-]+$/u, {
    message: "First name contains invalid characters",
  })
  firstName!: string;

  @ApiPropertyOptional({
    description: "User's middle name",
    example: "Quincy",
  })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({
    description: "User's last name",
    example: "Doe",
  })
  @IsString()
  @Matches(/^[\p{L}\s'-]+$/u, {
    message: "Last name contains invalid characters",
  })
  lastName!: string;

  @ApiProperty({
    description:
      "User password (min 8 chars, 1 upper, 1 lower, 1 number, 1 special)",
    example: "P@ssword123!",
  })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
    {
      message:
        "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character",
    },
  )
  password!: string;

  @ApiPropertyOptional({
    description: "Business name (for merchants)",
    example: "John's Electronics",
  })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({
    description: "Company name (legal)",
    example: "Doe Enterprises Ltd",
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    description: "Registered company address",
    example: "123 Lagos St, Victoria Island",
  })
  @IsOptional()
  @IsString()
  companyAddress?: string;

  @ApiPropertyOptional({
    description: "CAC Registration Number",
    example: "RC1234567",
  })
  @IsOptional()
  @IsString()
  cacNumber?: string;

  @ApiProperty({
    description: "User role",
    enum: UserRole,
    example: UserRole.BUYER,
  })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({
    description: "Buyer type (CONSUMER, etc.)",
    example: "CONSUMER",
  })
  @IsOptional()
  @IsString()
  buyerType?: string;

  @ApiPropertyOptional({
    description: "Merchant sub-domain/slug",
    example: "johns-electronics",
  })
  @IsOptional()
  @IsString()
  slug?: string;
}
