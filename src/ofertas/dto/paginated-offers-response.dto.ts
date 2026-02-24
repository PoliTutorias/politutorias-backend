import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la información del tutor en la respuesta de ofertas
 */
export class TutorResponseDto {
  @ApiProperty({ description: 'ID único del tutor', example: 'tutor-123' })
  id: string;

  @ApiProperty({ description: 'Nombre del tutor', example: 'Juan Pérez' })
  name: string;

  @ApiProperty({
    description: 'URL de la foto del tutor',
    example: 'https://example.com/tutor-juan.jpg',
    nullable: true,
  })
  photo: string;
}

/**
 * DTO para la respuesta de una oferta individual
 */
export class OfferResponseDto {
  @ApiProperty({
    description: 'ID único de la oferta',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Título de la oferta',
    example: 'Cálculo Diferencial',
  })
  title: string;

  @ApiProperty({ description: 'Precio por hora de la tutoría', example: 15.5 })
  price: number;

  @ApiProperty({
    description: 'Modalidad de la tutoría',
    example: 'Presencial',
    enum: ['Presencial', 'Virtual', 'Híbrida'],
  })
  modality: string;

  @ApiProperty({
    description: 'Descripción detallada de la oferta',
    example: 'Clases personalizadas de cálculo diferencial y aplicaciones.',
  })
  description: string;

  @ApiProperty({
    description: 'Etiquetas/categorías de la oferta',
    example: ['Matemáticas', 'Cálculo'],
    type: [String],
  })
  tags: string[];

  @ApiProperty({
    description: 'Calificación promedio de la oferta',
    example: 4.7,
    minimum: 0,
    maximum: 5,
  })
  rating: number;

  @ApiProperty({
    description: 'Número total de reseñas',
    example: 20,
    minimum: 0,
  })
  reviewsCount: number;

  @ApiProperty({
    description: 'Información del tutor',
    type: TutorResponseDto,
    nullable: true,
  })
  tutor: TutorResponseDto | null;

  @ApiProperty({
    description: 'Fecha de creación de la oferta en formato ISO 8601',
    example: '2023-10-26T10:00:00.000Z',
    type: String,
  })
  createdAt: Date | string;
}

/**
 * DTO para la respuesta paginada de ofertas
 */
export class PaginatedOffersResponse {
  @ApiProperty({
    description: 'Lista de ofertas',
    type: [OfferResponseDto],
  })
  offers: OfferResponseDto[];

  @ApiProperty({
    description: 'Número total de resultados encontrados',
    example: 13,
  })
  totalResults: number;

  @ApiProperty({
    description: 'Página actual',
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    description: 'Cantidad de items por página',
    example: 10,
  })
  itemsPerPage: number;

  @ApiProperty({
    description: 'Número total de páginas',
    example: 2,
  })
  totalPages: number;
}
