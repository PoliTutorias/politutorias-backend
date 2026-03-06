import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { FindManyOptions, Repository } from 'typeorm';
import { FilterQueryParams } from '../common/dtos/filter-query-params.dto';
import { AvailabilityEntity } from '../disponibilidad/entities/availability.entity';
import { FindOfertasByPriceUseCase } from './application/use-cases/find-ofertas-by-price.use-case';
import { GetFilteredOfertasUseCase } from './application/use-cases/get-filtered-ofertas.use-case';
import { Oferta } from './domain/entities/oferta.entity';
import { GetOfertasFilterDto } from './dto/get-ofertas-filter.dto';
import { OfertaItemDto } from './dto/oferta-item.dto';
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
  private readonly getFilteredOfertasUseCase: GetFilteredOfertasUseCase;

  constructor(
    @InjectRepository(Oferta)
    private readonly ofertaRepository: Repository<Oferta>,
    @InjectRepository(AvailabilityEntity)
    private readonly availabilityRepository: Repository<AvailabilityEntity>,
  ) {
    this.findOfertasByPriceUseCase = new FindOfertasByPriceUseCase(
      this.ofertaRepository,
      new OfertaMapper(),
    );
    this.getFilteredOfertasUseCase = new GetFilteredOfertasUseCase({
      findAndCountFiltered: (options) =>
        this.ofertaRepository.findAndCount({
          ...options,
          relations: ['tutor'],
        } as FindManyOptions<Oferta>),
    });
  }

  /**
   * Obtiene todas las ofertas de un tutor específico.
   *
   * @param tutorId - UUID del tutor
   * @returns Array de OfertaDto (vacío si no hay ofertas)
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
      modality: offer.modality,
      pricePerHour: offer.price,
      tags: offer.categories,
      createdAt: offer.createdAt.toISOString(),
    }));
  }

  /**
   * Mapea una entidad `Oferta` al DTO de respuesta.
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
   */
  async searchOffers(
    query: OffersQueryParams,
  ): Promise<PaginatedOffersResponse> {
    const { searchTerm, page = 1, limit = 10 } = query;

    const queryBuilder = this.ofertaRepository.createQueryBuilder('offer');
    queryBuilder.leftJoinAndSelect('offer.tutor', 'tutor');

    if (searchTerm && searchTerm.trim() !== '') {
      queryBuilder.andWhere(
        '(LOWER(offer.title) LIKE LOWER(:searchTerm) OR LOWER(tutor.nombreCompleto) LIKE LOWER(:searchTerm))',
        { searchTerm: `%${searchTerm.trim()}%` },
      );
    }

    queryBuilder.orderBy('offer.createdAt', 'DESC');

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
   */
  async findFilteredOfertas(
    filterParams: FilterQueryParams,
  ): Promise<{ ofertas: OfertaResponseDto[]; total: number }> {
    return this.findOfertasByPriceUseCase.execute(filterParams);
  }

  /**
   * HU26 + HU16: Filtra ofertas por modalidad, precio y/o disponibilidad.
   *
   * Si `disponibilidad` está presente, busca tutorIds que tengan
   * disponibilidad en ese día y los inyecta como filtro adicional
   * en el use-case existente.
   *
   * @param filterDto - DTO con campos opcionales `modalidad`, `minPrice`, `maxPrice`, `disponibilidad`.
   * @returns Objeto con `data` (array de OfertaItemDto) y `total` (conteo).
   */
  async getFilteredOfertas(
    filterDto: GetOfertasFilterDto,
  ): Promise<{ data: OfertaItemDto[]; total: number }> {
    try {
      // HU16: Si se filtra por disponibilidad, primero obtener los tutorIds relevantes
      if (filterDto.disponibilidad) {
        const availabilities = await this.availabilityRepository.find({
          where: { day: filterDto.disponibilidad },
          select: ['tutorId'],
        });

        const tutorIds = [...new Set(availabilities.map((a) => a.tutorId))];

        if (tutorIds.length === 0) {
          return { data: [], total: 0 };
        }

        // Inyectar los tutorIds encontrados como filtro adicional
        (filterDto as GetOfertasFilterDto & { tutorIds?: string[] }).tutorIds =
          tutorIds;
      }

      const [entities, total] =
        await this.getFilteredOfertasUseCase.execute(filterDto);

      const data = plainToInstance(OfertaItemDto, entities, {
        excludeExtraneousValues: true,
      });

      return { data, total };
    } catch (error) {
      console.error('Error al filtrar ofertas:', error);
      throw new InternalServerErrorException(
        'Error interno al filtrar ofertas.',
      );
    }
  }
}
