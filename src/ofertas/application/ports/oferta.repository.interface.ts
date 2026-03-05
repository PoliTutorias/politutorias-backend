import { Oferta } from '../../domain/entities/oferta.entity';

export const IOfertaRepository = Symbol('IOfertaRepository');

/**
 * Opciones de filtrado agnósticas a TypeORM.
 * Permite que la capa de dominio/aplicación construya consultas sin depender
 * directamente del ORM (Dependency Inversion Principle).
 */
export interface OfertaFilterOptions {
  where?: Record<string, unknown>;
  order?: Record<string, 'ASC' | 'DESC'>;
  relations?: string[];
}

export interface IOfertaRepository {
  save(oferta: Oferta): Promise<Oferta>;
  findAll(): Promise<Oferta[]>;
  /**
   * HU26: Consulta paginada con filtros dinámicos.
   * Retorna un par [entidades, total] para soportar el conteo sin segunda query.
   */
  findAndCountFiltered(
    options: OfertaFilterOptions,
  ): Promise<[unknown[], number]>;
}
