import { OfferQueryDto } from '../../dto/offer-query.dto';
import { PaginatedOffersResponse } from '../../interfaces/paginated-offers-response.interface';

/**
 * Contrato de acceso a datos para el dominio de Ofertas.
 * Las capas de aplicación dependen de esta interfaz, no de la implementación concreta (DIP).
 */
export const IOffersRepository = Symbol('IOffersRepository');

export interface IOffersRepository {
  findAll(query: OfferQueryDto): Promise<PaginatedOffersResponse>;
}
