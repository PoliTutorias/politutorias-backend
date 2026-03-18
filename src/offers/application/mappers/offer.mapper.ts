import { Oferta } from '../../../ofertas/domain/entities/oferta.entity';
import {
  OfferResponseDto,
  TutorInOfferResponse,
} from '../../interfaces/paginated-offers-response.interface';

/**
 * Mapper estático responsable de transformar la entidad Oferta
 * (con su tutor relacionado) al DTO de respuesta OfferResponseDto.
 *
 * Centraliza:
 *  - categories → tags
 *  - photoUrl   → photo
 *  - price      → parseFloat (TypeORM devuelve Decimal en PostgreSQL)
 */
export class OfferMapper {
  static toDto(entity: Oferta): OfferResponseDto {
    const tutor: TutorInOfferResponse | null = entity.tutor
      ? {
          id: entity.tutor.id,
          name: entity.tutor.nombreCompleto,
          photo: '',
        }
      : null;

    return {
      id: entity.id,
      title: entity.titulo || entity.title || '',
      price: parseFloat((entity.precioHora ?? entity.price ?? 0).toString()),
      modality: entity.modalidad || entity.modality || '',
      description: entity.descripcion || entity.description || '',
      tags: entity.categories ?? [],
      rating: entity.rating,
      reviewsCount: entity.reviewsCount,
      tutor,
      createdAt: entity.createdAt,
    };
  }
}
