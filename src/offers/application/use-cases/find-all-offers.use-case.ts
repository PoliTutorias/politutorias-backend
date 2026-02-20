import { Injectable, Inject } from '@nestjs/common';
import { IOffersRepository } from '../../domain/interfaces/offers.repository.interface';
import { OfferQueryDto } from '../../dto/offer-query.dto';
import { PaginatedOffersResponse } from '../../interfaces/paginated-offers-response.interface';

/**
 * Caso de uso: obtener listado paginado y filtrado de ofertas.
 * Depende de la interfaz IOffersRepository (DIP), no de la implementación concreta.
 */
@Injectable()
export class FindAllOffersUseCase {
  constructor(
    @Inject(IOffersRepository)
    private readonly offersRepository: IOffersRepository,
  ) {}

  async execute(query: OfferQueryDto): Promise<PaginatedOffersResponse> {
    return this.offersRepository.findAll(query);
  }
}
