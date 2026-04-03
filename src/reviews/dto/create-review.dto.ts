import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  tutoriaId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    example: 'Excelente explicacion y paciencia.',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  comment?: string;
}
