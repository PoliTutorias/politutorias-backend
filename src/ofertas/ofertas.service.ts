import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { FindManyOptions, In, Repository } from 'typeorm';
import { FilterQueryParams } from '../common/dtos/filter-query-params.dto';
import { AvailabilityEntity } from '../disponibilidad/entities/availability.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { FindOfertasByPriceUseCase } from './application/use-cases/find-ofertas-by-price.use-case';
import { GetFilteredOfertasUseCase } from './application/use-cases/get-filtered-ofertas.use-case';
import { GetOfertaByIdUseCase } from './application/use-cases/get-oferta-by-id.use-case';
import { Oferta } from './domain/entities/oferta.entity';
import { GetOfertasFilterDto } from './dto/get-ofertas-filter.dto';
import { OfertaDetalleResponseDto } from './dto/oferta-detalle-response.dto';
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
 * Incluye funcionalidad de HU02 (obtener ofertas por tutor), HU17 (búsqueda de ofertas)
 * y HU32 (ver detalle de una oferta).
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
    @InjectRepository(Tutor)
    private readonly tutorRepository: Repository<Tutor>,
    private readonly getOfertaByIdUseCase: GetOfertaByIdUseCase,
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
   * HU32: Obtiene el detalle completo de una oferta de tutoría por su ID.
   *
   * @param id - UUID de la oferta
   * @returns OfertaDetalleResponseDto con datos de la oferta y el tutor
   * @throws NotFoundException si la oferta no existe (RN-02)
   */
  async findOne(id: string): Promise<OfertaDetalleResponseDto> {
    return this.getOfertaByIdUseCase.execute(id);
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
      title: offer.titulo || offer.title || '',
      description: offer.descripcion || offer.description || '',
      modality: offer.modalidad || offer.modality || '',
      pricePerHour: offer.precioHora ?? offer.price ?? 0,
      tags: offer.categories ?? [],
      createdAt: offer.createdAt.toISOString(),
    }));
  }

  /**
   * Mapea una entidad `Oferta` al DTO de respuesta.
   */
  private mapToOfferResponseDto(
    offer: Oferta,
    availability?: { day: string; hour: string }[],
  ): OfferResponseDto {
    return {
      id: offer.id,
      title: offer.titulo || offer.title || '',
      price: parseFloat((offer.precioHora ?? offer.price ?? 0).toString()),
      modality: offer.modalidad || offer.modality || '',
      description: offer.descripcion || offer.description || '',
      tags: offer.categories ?? [],
      rating: offer.rating,
      reviewsCount: offer.reviewsCount,
      availability: availability ?? [],
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

      // Batch fetch availability for all tutors in this page
      const tutorIds = [
        ...new Set(
          ofertas
            .map((o) => o.tutorId)
            .filter((id): id is string => id != null),
        ),
      ];

      const availabilityMap = new Map<
        string,
        { day: string; hour: string }[]
      >();
      if (tutorIds.length > 0) {
        const allAvailability = await this.availabilityRepository.find({
          where: { tutorId: In(tutorIds) },
          order: { day: 'ASC', hour: 'ASC' },
        });

        for (const av of allAvailability) {
          const existing = availabilityMap.get(av.tutorId) ?? [];
          existing.push({ day: av.day, hour: av.hour });
          availabilityMap.set(av.tutorId, existing);
        }
      }

      return {
        offers: ofertas.map((offer) =>
          this.mapToOfferResponseDto(
            offer,
            availabilityMap.get(offer.tutorId) ?? [],
          ),
        ),
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
   * HU26 + HU16 + HU17: Filtra ofertas por modalidad, precio, disponibilidad
   * y/o término de búsqueda (searchTerm).
   *
   * Si `disponibilidad` está presente, busca tutorIds que tengan
   * disponibilidad en ese día y los inyecta como filtro adicional.
   *
   * Si `searchTerm` está presente, aplica una búsqueda LIKE sobre el título
   * de la oferta y el nombre del tutor, combinándola con los demás filtros.
   *
   * @param filterDto - DTO con campos opcionales `modalidad`, `minPrice`, `maxPrice`, `disponibilidad`, `searchTerm`.
   * @returns Objeto con `data` (array de OfertaItemDto) y `total` (conteo).
   */
  async getFilteredOfertas(
    filterDto: GetOfertasFilterDto,
  ): Promise<{ data: OfertaItemDto[]; total: number }> {
    try {
      // HU16: Si se filtra por disponibilidad, primero obtener los tutorIds relevantes
      let availTutorIds: string[] | undefined;
      if (filterDto.disponibilidad) {
        // Soportar múltiples días separados por coma: "Lun,Mar,Vie"
        const days = filterDto.disponibilidad.split(',').map((d) => d.trim());
        const availabilities = await this.availabilityRepository.find({
          where: days.map((day) => ({ day })),
          select: ['tutorId'],
        });

        const rawIds = [...new Set(availabilities.map((a) => a.tutorId))];

        if (rawIds.length === 0) {
          return { data: [], total: 0 };
        }

        // Resolver cualquier userId (no-UUID) a su tutor UUID real,
        // ya que ofertas.tutorId es de tipo uuid en PostgreSQL.
        const UUID_RE =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const uuids = rawIds.filter((id) => UUID_RE.test(id));
        const nonUuids = rawIds.filter((id) => !UUID_RE.test(id));

        if (nonUuids.length > 0) {
          const tutors = await this.tutorRepository.find({
            where: nonUuids.map((uid) => ({ userId: uid })),
            select: ['id'],
          });
          uuids.push(...tutors.map((t) => t.id));
        }

        availTutorIds = [...new Set(uuids)];

        if (availTutorIds.length === 0) {
          return { data: [], total: 0 };
        }
      }

      let entities: Oferta[];
      let total: number;

      // Determine if we need QueryBuilder (when searchTerm is present)
      const trimmedSearch = filterDto.searchTerm?.trim();
      if (trimmedSearch && trimmedSearch.length > 0) {
        // Use QueryBuilder to combine text search with filters
        const qb = this.ofertaRepository.createQueryBuilder('oferta');
        qb.leftJoinAndSelect('oferta.tutor', 'tutor');

        // Always exclude legacy records with null titulo
        qb.andWhere('oferta.titulo IS NOT NULL');

        // Text search on titulo and tutor name
        qb.andWhere(
          '(LOWER(oferta.titulo) LIKE LOWER(:searchTerm) OR LOWER(tutor.nombreCompleto) LIKE LOWER(:searchTerm))',
          { searchTerm: `%${trimmedSearch}%` },
        );

        // Modalidad filter
        if (filterDto.modalidad && filterDto.modalidad.length > 0) {
          const expanded = new Set(filterDto.modalidad);
          if (expanded.has('PRESENCIAL') || expanded.has('VIRTUAL')) {
            expanded.add('VIRTUAL/PRESENCIAL');
          }
          qb.andWhere('oferta.modalidad IN (:...modalidades)', {
            modalidades: [...expanded],
          });
        }

        // Price filter
        if (
          filterDto.minPrice !== undefined &&
          filterDto.maxPrice !== undefined
        ) {
          qb.andWhere('oferta.precioHora BETWEEN :minPrice AND :maxPrice', {
            minPrice: filterDto.minPrice,
            maxPrice: filterDto.maxPrice,
          });
        } else if (filterDto.minPrice !== undefined) {
          qb.andWhere('oferta.precioHora >= :minPrice', {
            minPrice: filterDto.minPrice,
          });
        } else if (filterDto.maxPrice !== undefined) {
          qb.andWhere('oferta.precioHora <= :maxPrice', {
            maxPrice: filterDto.maxPrice,
          });
        }

        // Disponibilidad filter (tutorIds)
        if (availTutorIds && availTutorIds.length > 0) {
          qb.andWhere('oferta.tutorId IN (:...tutorIds)', {
            tutorIds: availTutorIds,
          });
        }

        qb.orderBy('oferta.fechaCreacion', 'DESC');

        [entities, total] = await qb.getManyAndCount();
      } else {
        // No searchTerm: use the existing use-case (preserves original logic)
        if (availTutorIds) {
          (
            filterDto as GetOfertasFilterDto & { tutorIds?: string[] }
          ).tutorIds = availTutorIds;
        }

        const [rawEntities, rawTotal] =
          await this.getFilteredOfertasUseCase.execute(filterDto);
        entities = rawEntities as Oferta[];
        total = rawTotal;
      }

      const data = plainToInstance(OfertaItemDto, entities, {
        excludeExtraneousValues: true,
      });

      // Batch fetch availability for all tutors in the result set
      const tutorIdsForAvail = [
        ...new Set(
          entities
            .map((e: Oferta) => e.tutorId)
            .filter((id): id is string => id != null),
        ),
      ];

      if (tutorIdsForAvail.length > 0) {
        const allAvailability = await this.availabilityRepository.find({
          where: { tutorId: In(tutorIdsForAvail) },
          order: { day: 'ASC', hour: 'ASC' },
        });

        const availMap = new Map<string, { day: string; hour: string }[]>();
        for (const av of allAvailability) {
          const existing = availMap.get(av.tutorId) ?? [];
          existing.push({ day: av.day, hour: av.hour });
          availMap.set(av.tutorId, existing);
        }

        // Inject horarios into each DTO
        for (let i = 0; i < data.length; i++) {
          const entity = entities[i];
          data[i].horarios = availMap.get(entity.tutorId) ?? [];
        }
      }

      return { data, total };
    } catch (error) {
      console.error('Error al filtrar ofertas:', error);
      throw new InternalServerErrorException(
        'Error interno al filtrar ofertas.',
      );
    }
  }
}
