import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({
    description: "Email or phone number (+234...)",
    example: "admin@twizrr.com",
  })
  @IsString()
  identifier!: string;

  @ApiProperty({
    description: "User password",
    example: "strongPassword123",
  })
  @IsString()
  password!: string;
}
