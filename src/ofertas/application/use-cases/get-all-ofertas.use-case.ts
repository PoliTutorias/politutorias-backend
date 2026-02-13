import { Inject, Injectable } from '@nestjs/common';
import { IOfertaRepository } from '../ports/oferta.repository.interface';
import { Oferta } from '../../domain/entities/oferta.entity';

@Injectable()
export class GetAllOfertasUseCase {
  constructor(
    @Inject(IOfertaRepository)
    private readonly ofertaRepository: IOfertaRepository,
  ) {}

  async execute(): Promise<Oferta[]> {
    return await this.ofertaRepository.findAll();
  }
}
