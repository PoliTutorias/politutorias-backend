import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum RatingFilter {
  ALL = 'all',
  ONE = '1',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
}

export enum ReviewSortBy {
  CREATED_AT = 'createdAt',
  RATING = 'rating',
}

export class GetTutorReviewsQueryDto {
  @ApiPropertyOptional({
    description: 'Número de página (mínimo 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un entero' })
  @Min(1, { message: 'page debe ser al menos 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Registros por página (máximo 20)',
    example: 5,
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un entero' })
  @Min(1, { message: 'limit debe ser al menos 1' })
  @Max(20, { message: 'limit no puede superar 20' })
  limit?: number = 5;

  @ApiPropertyOptional({
    description: 'Campo de ordenamiento',
    enum: ReviewSortBy,
    default: ReviewSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsString()
  @IsEnum(ReviewSortBy, {
    message: 'sortBy debe ser createdAt o rating',
  })
  sortBy?: ReviewSortBy = ReviewSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Filtrar por estrellas',
    enum: RatingFilter,
    default: RatingFilter.ALL,
  })
  @IsOptional()
  @IsString()
  @IsEnum(RatingFilter, {
    message: 'ratingFilter debe ser all, 1, 2, 3, 4 o 5',
  })
  ratingFilter?: RatingFilter = RatingFilter.ALL;
}
