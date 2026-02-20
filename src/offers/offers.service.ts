import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { OfferQueryDto } from './dto/offer-query.dto';
import { PaginatedOffersResponse } from './interfaces/paginated-offers-response.interface';
import { OfferMapper } from './application/mappers/offer.mapper';

/**
 * Servicio de aplicación para la HU03: GET /api/offers.
 *
 * Responsabilidades:
 *  - Construir la consulta TypeORM (filtros, ordenamiento, paginación).
 *  - Delegar el mapeo Entidad→DTO a OfferMapper (SRP).
 *  - Manejar errores de persistencia.
 */
@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Oferta)
    private readonly ofertaRepository: Repository<Oferta>,
  ) {}

  async findAll(query: OfferQueryDto): Promise<PaginatedOffersResponse> {
    try {
      const { page = 1, limit = 10 } = query;

      const qb = this.ofertaRepository.createQueryBuilder('offer');
      qb.leftJoinAndSelect('offer.tutor', 'tutor');

      this.applyFilters(qb, query);
      this.applySorting(qb, query);

      const skip = (page - 1) * limit;
      qb.skip(skip).take(limit);

      const [offers, totalResults] = await qb.getManyAndCount();

      return {
        offers: offers.map(OfferMapper.toDto),
        totalResults,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalResults / limit),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Internal server error',
        'Error al consultar la base de datos.',
      );
    }
  }

  // ── Métodos privados de composición de la query ──────────────────────────

  private applyFilters(
    qb: SelectQueryBuilder<Oferta>,
    query: OfferQueryDto,
  ): void {
    const { modality, areaConocimiento, minPrice, maxPrice } = query;

    if (modality) {
      qb.andWhere('offer.modality LIKE :modalityValue', {
        modalityValue: `%${modality}%`,
      });
    }

    if (areaConocimiento && areaConocimiento.length > 0) {
      // Operador && de PostgreSQL: intersección de arrays (AND lógico entre tags)
      qb.andWhere(
        'offer.categories && ARRAY[:...areaConocimiento]::text[]',
        { areaConocimiento },
      );
    }

    if (minPrice !== undefined) {
      qb.andWhere('offer.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      qb.andWhere('offer.price <= :maxPrice', { maxPrice });
    }
  }

  private applySorting(
    qb: SelectQueryBuilder<Oferta>,
    query: OfferQueryDto,
  ): void {
    const { sortBy, sortOrder } = query;
    const direction: 'ASC' | 'DESC' =
      sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const fieldMap: Record<string, string> = {
      price: 'offer.price',
      rating: 'offer.rating',
      date: 'offer.createdAt',
    };

    const orderField = (sortBy && fieldMap[sortBy]) ?? 'offer.createdAt';
    qb.orderBy(orderField, direction);
  }
}
