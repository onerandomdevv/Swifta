import { IsEmail, IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { UserRole } from '@hardware-os/shared';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsEnum(UserRole)
  role: UserRole;
}
