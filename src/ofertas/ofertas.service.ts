import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilterQueryParams } from '../common/dtos/filter-query-params.dto';
import { FindOfertasByPriceUseCase } from './application/use-cases/find-ofertas-by-price.use-case';
import { Oferta } from './domain/entities/oferta.entity';
import { OfertaResponseDto } from './dto/oferta-response.dto';
import { OfertaDto } from './dto/oferta.dto';
import { OffersQueryParams } from './dto/offers-query.dto';
import {
  OfferResponseDto,
  PaginatedOffersResponse,
} from './dto/paginated-offers-response.dto';
import { OfertaMapper } from './mappers/oferta.mapper';

/**
 * Servicio para gestionar ofertas de tutoría.
 *
 * Incluye funcionalidad de HU02 (obtener ofertas por tutor) y HU17 (búsqueda de ofertas).
 */
@Injectable()
export class OfertasService {
  private readonly findOfertasByPriceUseCase: FindOfertasByPriceUseCase;

  constructor(
    @InjectRepository(Oferta)
    private readonly ofertaRepository: Repository<Oferta>,
  ) {
    // Instanciado directamente para mantener compatibilidad con los tests
    // unitarios existentes que solo proveen InjectRepository(Oferta).
    this.findOfertasByPriceUseCase = new FindOfertasByPriceUseCase(
      this.ofertaRepository,
      new OfertaMapper(),
    );
  }

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
   * Mapea una entidad `Oferta` (con relación `tutor` cargada) al DTO de respuesta.
   *
   * Responsabilidad única: transformación de entidad → DTO (SRP / Mapper Pattern).
   *
   * Conversiones aplicadas:
   *  - `price`       : decimal → `number` via `parseFloat`
   *  - `categories`  → `tags`
   *  - `tutor.photoUrl` → `tutor.photo`
   *  - `createdAt`   : `Date` → ISO 8601 `string` via `toISOString()`
   *
   * @param offer - Entidad `Oferta` con `tutor` cargado a través de `leftJoinAndSelect`
   * @returns `OfferResponseDto` listo para serializar en la respuesta HTTP
   */
  private mapToOfferResponseDto(offer: Oferta): OfferResponseDto {
    return {
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
            name: offer.tutor.nombreCompleto,
            photo: '',
          }
        : null,
      createdAt: offer.createdAt.toISOString(),
    };
  }

  /**
   * HU17: Busca y pagina ofertas de tutoría por término de búsqueda.
   *
   * Responsabilidad: orquestar la consulta (QueryBuilder), paginación
   * y delegar el mapeo de entidades a `mapToOfferResponseDto`.
   *
   * @param query - Parámetros de consulta (searchTerm, page, limit)
   * @returns Respuesta paginada con ofertas que coinciden con el criterio
   *
   * Búsqueda:
   * - Busca en el título de la oferta (title) o nombre del tutor (name)
   * - Búsqueda insensible a mayúsculas/minúsculas mediante LOWER()
   * - Si searchTerm está vacío o es solo espacios, retorna todas las ofertas
   * - Ordena por fecha de creación (más recientes primero)
   */
  async searchOffers(
    query: OffersQueryParams,
  ): Promise<PaginatedOffersResponse> {
    const { searchTerm, page = 1, limit = 10 } = query;

    const queryBuilder = this.ofertaRepository.createQueryBuilder('offer');

    // Cargar relación tutor para acceder a su nombre y foto en el mapeo
    queryBuilder.leftJoinAndSelect('offer.tutor', 'tutor');

    // Aplicar filtro de búsqueda solo cuando el término no es vacío/solo espacios
    if (searchTerm && searchTerm.trim() !== '') {
      queryBuilder.andWhere(
        '(LOWER(offer.title) LIKE LOWER(:searchTerm) OR LOWER(tutor.name) LIKE LOWER(:searchTerm))',
        { searchTerm: `%${searchTerm.trim()}%` },
      );
    }

    // Ordenamiento por defecto: más recientes primero
    queryBuilder.orderBy('offer.createdAt', 'DESC');

    // Calcular offset y aplicar paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    try {
      const [ofertas, totalResults] = await queryBuilder.getManyAndCount();

      return {
        offers: ofertas.map((offer) => this.mapToOfferResponseDto(offer)),
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

  /**
   * HU27: Filtra ofertas por rango de precio (minPrice / maxPrice).
   *
   * Delega la lógica de filtrado y mapeo a `FindOfertasByPriceUseCase`.
   *
   * @param filterParams - Parámetros opcionales `minPrice` y `maxPrice`.
   * @returns Objeto con el array de DTOs de respuesta y el total de registros.
   */
  async findFilteredOfertas(
    filterParams: FilterQueryParams,
  ): Promise<{ ofertas: OfertaResponseDto[]; total: number }> {
    return this.findOfertasByPriceUseCase.execute(filterParams);
  }
}
