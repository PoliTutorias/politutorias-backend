import { Inject, Injectable } from '@nestjs/common';
import {
  Between,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
} from 'typeorm';
import { GetOfertasFilterDto } from '../../dto/get-ofertas-filter.dto';
import {
  IOfertaRepository,
  OfertaFilterOptions,
} from '../ports/oferta.repository.interface';

/**
 * Use Case: Obtener ofertas filtradas por modalidad (HU26).
 *
 * Responsabilidad única: construir las opciones de consulta a partir del DTO
 * de filtro y delegar la persistencia al repositorio abstracto.
 *
 * Principios aplicados:
 *  - SRP: solo se ocupa de la lógica de filtrado, sin efectos secundarios HTTP.
 *  - DIP: depende de `IOfertaRepository` (abstracción), no de TypeORM directamente.
 *  - ISP: usa únicamente `findAndCountFiltered`, el método específico que necesita.
 *
 * Esta clase puede instanciarse mediante NestJS DI (en producción) o de forma
 * manual pasándole cualquier objeto que implemente el método `findAndCountFiltered`
 * (facilita los tests unitarios de `OfertasService` sin modificarlos).
 */
@Injectable()
export class GetFilteredOfertasUseCase {
  constructor(
    @Inject(IOfertaRepository)
    private readonly repository: Pick<
      IOfertaRepository,
      'findAndCountFiltered'
    >,
  ) {}

  /**
   * Ejecuta el filtrado de ofertas.
   *
   * @param filterDto - DTO con `modalidad` opcional (array de strings).
   * @returns Par [entidades crudas, total] para que la capa superior haga el mapeo.
   *
   * Reglas de expansión de modalidad:
   *  - `PRESENCIAL`       → también incluye `VIRTUAL/PRESENCIAL`
   *  - `VIRTUAL`          → también incluye `VIRTUAL/PRESENCIAL`
   *  - `VIRTUAL/PRESENCIAL` sola → solo registros estrictamente `VIRTUAL/PRESENCIAL`
   * - Si `modalidad` es `undefined` o `[]` → no añade cláusula WHERE (devuelve todo).
   * - Siempre ordena por `fechaCreacion DESC` (más recientes primero).
   */
  async execute(filterDto: GetOfertasFilterDto): Promise<[unknown[], number]> {
    // Siempre excluir registros legacy (HU03/HU17/HU27) que tienen titulo = NULL.
    const where: Record<string, unknown> = {
      titulo: Not(IsNull()),
    };

    if (filterDto.modalidad && filterDto.modalidad.length > 0) {
      const expanded = new Set(filterDto.modalidad);
      // PRESENCIAL o VIRTUAL implican incluir también VIRTUAL/PRESENCIAL
      if (expanded.has('PRESENCIAL') || expanded.has('VIRTUAL')) {
        expanded.add('VIRTUAL/PRESENCIAL');
      }
      where['modalidad'] = In([...expanded]);
    }

    if (filterDto.minPrice !== undefined && filterDto.maxPrice !== undefined) {
      where['precioHora'] = Between(filterDto.minPrice, filterDto.maxPrice);
    } else if (filterDto.minPrice !== undefined) {
      where['precioHora'] = MoreThanOrEqual(filterDto.minPrice);
    } else if (filterDto.maxPrice !== undefined) {
      where['precioHora'] = LessThanOrEqual(filterDto.maxPrice);
    }

    // HU16: Filtrar por tutorIds (inyectados por OfertasService cuando hay filtro de disponibilidad)
    const dtoWithTutors = filterDto as { tutorIds?: string[] };
    if (dtoWithTutors.tutorIds && dtoWithTutors.tutorIds.length > 0) {
      where['tutor'] = { id: In(dtoWithTutors.tutorIds) };
    }

    const options: OfertaFilterOptions = {
      where,
      order: { fechaCreacion: 'DESC' },
    };

    return this.repository.findAndCountFiltered(options);
  }
}
