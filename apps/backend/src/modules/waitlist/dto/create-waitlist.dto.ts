import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";

export class CreateWaitlistDto {
  @ApiProperty({
    description: "The name of the business",
    example: "Twizrr Foodies",
  })
  @IsString()
  @IsNotEmpty({ message: "Business name is required" })
  businessName!: string;

  @ApiProperty({
    description: "The email address of the business contact",
    example: "contact@twizrr.com",
  })
  @IsEmail({}, { message: "Please provide a valid email address" })
  @IsNotEmpty({ message: "Email is required" })
  email!: string;

  @ApiPropertyOptional({
    description: "The Nigerian phone number in E.164 format (+234...)",
    example: "+2348012345678",
  })
  @IsString()
  @IsOptional()
  @Matches(/^\+234[789]\d{9}$/, {
    message:
      "Phone number must be a valid Nigerian number in E.164 format (e.g., +234XXXXXXXXXX)",
  })
  phone?: string;
}
