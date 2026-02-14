import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Oferta } from './domain/entities/oferta.entity';
import { OfertaDto } from './dto/oferta.dto';
import { OffersQueryParams } from './dto/offers-query.dto';
import {
  PaginatedOffersResponse,
  OfferResponseDto,
} from './dto/paginated-offers-response.dto';

/**
 * Servicio para gestionar ofertas de tutoría.
 *
 * Incluye funcionalidad de HU02 (obtener ofertas por tutor) y HU17 (búsqueda de ofertas).
 */
@Injectable()
export class OfertasService {
  constructor(
    @InjectRepository(Oferta)
    private readonly ofertaRepository: Repository<Oferta>,
  ) {}

  /**
   * Obtiene todas las ofertas de un tutor específico.
   *
   * @param tutorId - UUID del tutor
   * @returns Array de OfertaDto (vacío si no hay ofertas)
   *
   * Mapeo de campos:
   * - modality → isPresencial (true solo si es exactamente "Presencial")
   * - price → pricePerHour
   * - categories → tags
   */
  async findAllByTutorId(tutorId: string): Promise<OfertaDto[]> {
    const offers = await this.ofertaRepository.find({
      where: { tutorId: tutorId },
    });

    if (!offers || offers.length === 0) {
      return [];
    }

    return offers.map((offer) => ({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      isPresencial: offer.modality === 'Presencial', // Mapeo requerido
      pricePerHour: offer.price, // Mapeo requerido
      tags: offer.categories, // Mapeo requerido
      createdAt: offer.createdAt.toISOString(), // Formato ISO 8601
    }));
  }

  /**
   * HU17: Busca y pagina ofertas de tutoría por término de búsqueda.
   *
   * @param query - Parámetros de consulta (searchTerm, page, limit)
   * @returns Respuesta paginada con ofertas que coinciden con el criterio
   *
   * Búsqueda:
   * - Busca en el título de la oferta (title) o nombre del tutor (name)
   * - Búsqueda insensible a mayúsculas/minúsculas
   * - Si searchTerm está vacío, retorna todas las ofertas
   * - Ordena por fecha de creación (más recientes primero)
   */
  async searchOffers(
    query: OffersQueryParams,
  ): Promise<PaginatedOffersResponse> {
    const { searchTerm, page = 1, limit = 10 } = query;

    const queryBuilder = this.ofertaRepository.createQueryBuilder('offer');

    // Añadir relación con el tutor para acceder a su nombre y foto
    queryBuilder.leftJoinAndSelect('offer.tutor', 'tutor');

    // Aplicar filtro de búsqueda si existe un término
    if (searchTerm && searchTerm.trim() !== '') {
      queryBuilder.andWhere(
        '(LOWER(offer.title) LIKE LOWER(:searchTerm) OR LOWER(tutor.name) LIKE LOWER(:searchTerm))',
        { searchTerm: `%${searchTerm.trim()}%` },
      );
    }

    // Ordenamiento por defecto: más recientes primero
    queryBuilder.orderBy('offer.createdAt', 'DESC');

    // Aplicar paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    try {
      const [offers, totalResults] = await queryBuilder.getManyAndCount();

      // Mapear OfertaEntity a OfferResponseDto
      const formattedOffers: OfferResponseDto[] = offers.map((offer) => ({
        id: offer.id,
        title: offer.title,
        price: parseFloat(offer.price.toString()),
        modality: offer.modality,
        description: offer.description,
        tags: offer.categories,
        rating: offer.rating,
        reviewsCount: offer.reviewsCount,
        tutor: offer.tutor
          ? {
              id: offer.tutor.id,
              name: offer.tutor.name,
              photo: offer.tutor.photoUrl || '',
            }
          : null,
        createdAt: offer.createdAt,
      }));

      return {
        offers: formattedOffers,
        totalResults,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalResults / limit),
      };
    } catch (error) {
      console.error('Error fetching offers:', error);
      throw new InternalServerErrorException(
        'Error al consultar las ofertas de tutoría.',
      );
    }
  }
}
