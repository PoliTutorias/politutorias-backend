import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfertasController } from './ofertas.controller';
import { TutorOfertasController } from './tutor-ofertas.controller';
import { CreateOfertaUseCase } from './application/use-cases/create-oferta.use-case';
import { GetAllOfertasUseCase } from './application/use-cases/get-all-ofertas.use-case';
import { Oferta } from './domain/entities/oferta.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { TypeOrmOfertaRepository } from './infrastructure/persistence/typeorm-oferta.repository';
import { IOfertaRepository } from './application/ports/oferta.repository.interface';
import { OfertasService } from './ofertas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Oferta, Tutor])],
  controllers: [OfertasController, TutorOfertasController],
  providers: [
    CreateOfertaUseCase,
    GetAllOfertasUseCase,
    OfertasService,
    {
      provide: IOfertaRepository,
      useClass: TypeOrmOfertaRepository,
    },
  ],
})
export class OfertasModule {}
