import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewStudentDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Juan' })
  firstName: string;

  @ApiProperty({ example: 'P.' })
  lastName: string;

  @ApiPropertyOptional({
    example: 'https://ui-avatars.com/api/?name=Juan+P',
    nullable: true,
  })
  avatarUrl: string | null;
}

export class ReviewItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ type: ReviewStudentDto })
  student: ReviewStudentDto;

  @ApiProperty({ example: '2024-05-24T10:00:00.000Z' })
  date: string;

  @ApiProperty({ example: 5 })
  stars: number;

  @ApiProperty({ example: 'Matemáticas Avanzadas' })
  tutoringSubject: string;

  @ApiPropertyOptional({
    example: 'Excelente tutor, explica muy claro.',
    nullable: true,
  })
  comment: string | null;
}

export class StarDistributionDto {
  @ApiProperty({
    example: 80,
    description: 'Porcentaje de reseñas con 5 estrellas',
  })
  '5': number;

  @ApiProperty({
    example: 15,
    description: 'Porcentaje de reseñas con 4 estrellas',
  })
  '4': number;

  @ApiProperty({
    example: 3,
    description: 'Porcentaje de reseñas con 3 estrellas',
  })
  '3': number;

  @ApiProperty({
    example: 1,
    description: 'Porcentaje de reseñas con 2 estrellas',
  })
  '2': number;

  @ApiProperty({
    example: 1,
    description: 'Porcentaje de reseñas con 1 estrella',
  })
  '1': number;
}

export class ReviewSummaryDto {
  @ApiProperty({
    example: 4.7,
    description: 'Promedio de calificación redondeado a 1 decimal',
  })
  avgRating: number;

  @ApiProperty({ example: 120, description: 'Total de reseñas del tutor' })
  totalReviews: number;

  @ApiProperty({ type: StarDistributionDto })
  starDistribution: StarDistributionDto;
}

export class TutorReviewsResponseDto {
  @ApiProperty({ type: [ReviewItemDto] })
  reviews: ReviewItemDto[];

  @ApiProperty({ type: ReviewSummaryDto })
  summary: ReviewSummaryDto;

  @ApiProperty({
    example: 120,
    description: 'Total de reseñas (con filtro aplicado)',
  })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 5 })
  limit: number;
}
