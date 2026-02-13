import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfertasController } from './ofertas.controller';
import { CreateOfertaUseCase } from './application/use-cases/create-oferta.use-case';
import { GetAllOfertasUseCase } from './application/use-cases/get-all-ofertas.use-case';
import { Oferta } from './domain/entities/oferta.entity';
import { TypeOrmOfertaRepository } from './infrastructure/persistence/typeorm-oferta.repository';
import { IOfertaRepository } from './application/ports/oferta.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([Oferta])],
  controllers: [OfertasController],
  providers: [
    CreateOfertaUseCase,
    GetAllOfertasUseCase,
    {
      provide: IOfertaRepository,
      useClass: TypeOrmOfertaRepository,
    },
  ],
})
export class OfertasModule {}
