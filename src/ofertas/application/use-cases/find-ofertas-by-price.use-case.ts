import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { FilterQueryParams } from '../../../common/dtos/filter-query-params.dto';
import { Oferta } from '../../domain/entities/oferta.entity';
import { OfertaResponseDto } from '../../dto/oferta-response.dto';
import { OfertaMapper } from '../../mappers/oferta.mapper';

/**
 * Use Case: Filtrar ofertas de tutoría por rango de precio (HU27).
 *
 * Encapsula toda la lógica de negocio para:
 *  - Construir la condición `where` según los filtros `minPrice` / `maxPrice`.
 *  - Consultar el repositorio con `findAndCount` incluyendo la relación `tutor`.
 *  - Mapear las entidades obtenidas al DTO de respuesta mediante `OfertaMapper`.
 *
 * Al ser `@Injectable()` puede ser provisto directamente por NestJS DI en módulos
 * que requieran invocar este caso de uso de forma autónoma. También puede ser
 * instanciado manualmente (p.ej. desde `OfertasService`) pasando las dependencias
 * directamente al constructor, lo que mantiene la compatibilidad con los tests
 * unitarios existentes de `OfertasService`.
 */
@Injectable()
export class FindOfertasByPriceUseCase {
  constructor(
    @InjectRepository(Oferta)
    private readonly ofertaRepository: Repository<Oferta>,
    private readonly ofertaMapper: OfertaMapper,
  ) {}

  /**
   * Ejecuta el filtrado de ofertas por rango de precio.
   *
   * @param filterParams - Parámetros opcionales `minPrice` y `maxPrice`.
   * @returns Objeto con el array de DTOs de respuesta y el total de registros.
   *
   * Lógica de condición `where`:
   *  - Ambos definidos  → `Between(minPrice, maxPrice)`
   *  - Solo `minPrice`  → `MoreThanOrEqual(minPrice)`
   *  - Solo `maxPrice`  → `LessThanOrEqual(maxPrice)`
   *  - Ninguno          → sin condición (retorna todas las ofertas)
   */
  async execute(
    filterParams: FilterQueryParams,
  ): Promise<{ ofertas: OfertaResponseDto[]; total: number }> {
    const whereCondition: Record<string, unknown> = {};

    if (
      filterParams.minPrice !== undefined &&
      filterParams.maxPrice !== undefined
    ) {
      whereCondition['price'] = Between(
        filterParams.minPrice,
        filterParams.maxPrice,
      );
    } else if (filterParams.minPrice !== undefined) {
      whereCondition['price'] = MoreThanOrEqual(filterParams.minPrice);
    } else if (filterParams.maxPrice !== undefined) {
      whereCondition['price'] = LessThanOrEqual(filterParams.maxPrice);
    }

    try {
      const [entities, total] = await this.ofertaRepository.findAndCount({
        where: whereCondition as FindOptionsWhere<Oferta>,
        relations: ['tutor'],
      });

      return {
        ofertas: entities.map((e) => this.ofertaMapper.toResponseDto(e)),
        total,
      };
    } catch (error) {
      console.error(
        'Error al consultar ofertas filtradas en el use case:',
        error,
      );
      throw new InternalServerErrorException(
        'Error interno al filtrar ofertas.',
      );
    }
  }
}
