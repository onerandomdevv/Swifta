import {
  IsString,
  IsNotEmpty,
  Min,
  Max,
  IsOptional,
  IsInt,
} from "class-validator";

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
