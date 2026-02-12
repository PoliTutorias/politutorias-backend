import { Oferta } from '../../domain/entities/oferta.entity';

export const IOfertaRepository = Symbol('IOfertaRepository');

export interface IOfertaRepository {
  save(oferta: Oferta): Promise<Oferta>;
}
