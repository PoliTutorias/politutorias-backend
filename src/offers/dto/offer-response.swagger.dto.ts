/**
 * DTOs decorados con @ApiProperty para que Swagger pueda generar el schema
 * del endpoint GET /api/offers (HU03).
 *
 * Estas clases implementan las interfaces de `paginated-offers-response.interface.ts`
 * y añaden únicamente los metadatos necesarios para la documentación OpenAPI.
 * No reemplazan la lógica de negocio ni los tipos de retorno de los servicios.
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  TutorInOfferResponse,
  OfferResponseDto,
  PaginatedOffersResponse,
} from '../interfaces/paginated-offers-response.interface';

export class TutorInOfferResponseDto implements TutorInOfferResponse {
  @ApiProperty({
    description: 'UUID del tutor',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id: string;

  @ApiProperty({ description: 'Nombre completo del tutor', example: 'Ana García' })
  name: string;

  @ApiProperty({
    description: 'URL de la foto de perfil del tutor',
    example: 'https://example.com/photos/ana.jpg',
  })
  photo: string;
}

export class OfferResponseItemDto implements OfferResponseDto {
  @ApiProperty({
    description: 'UUID de la oferta',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Título de la oferta',
    example: 'Cálculo Diferencial e Integral',
  })
  title: string;

  @ApiProperty({
    description: 'Precio de la tutoría en USD',
    example: 12.5,
  })
  price: number;

  @ApiProperty({
    description: 'Modalidad de la oferta',
    enum: ['Virtual', 'Presencial', 'Virtual/Presencial', 'Híbrida'],
    example: 'Virtual',
  })
  modality: string;

  @ApiProperty({
    description: 'Descripción detallada de la oferta',
    example: 'Tutorías especializadas en límites, derivadas e integrales.',
  })
  description: string;

  @ApiProperty({
    description: 'Áreas de conocimiento / etiquetas de la oferta',
    type: [String],
    example: ['Matemáticas', 'Cálculo'],
  })
  tags: string[];

  @ApiProperty({
    description: 'Calificación promedio de la oferta (0.0 – 5.0)',
    example: 4.8,
  })
  rating: number;

  @ApiProperty({
    description: 'Número de reseñas que respaldan el rating',
    example: 24,
  })
  reviewsCount: number;

  @ApiProperty({
    description: 'Información del tutor que ofrece la tutoría',
    type: () => TutorInOfferResponseDto,
    nullable: true,
  })
  tutor: TutorInOfferResponseDto | null;

  @ApiProperty({
    description: 'Fecha de creación de la oferta',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;
}

export class PaginatedOffersResponseDto implements PaginatedOffersResponse {
  @ApiProperty({
    description: 'Lista de ofertas para la página solicitada',
    type: [OfferResponseItemDto],
  })
  offers: OfferResponseItemDto[];

  @ApiProperty({
    description: 'Total de resultados que coinciden con los filtros aplicados',
    example: 13,
  })
  totalResults: number;

  @ApiProperty({ description: 'Página actual', example: 1 })
  currentPage: number;

  @ApiProperty({
    description: 'Cantidad de resultados por página (igual al parámetro limit)',
    example: 10,
  })
  itemsPerPage: number;

  @ApiProperty({ description: 'Total de páginas disponibles', example: 2 })
  totalPages: number;
}
