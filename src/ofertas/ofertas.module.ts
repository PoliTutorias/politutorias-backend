import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityEntity } from '../disponibilidad/entities/availability.entity';
import { ExperienciaEntity } from '../experiencias/entities/experiencia.entity';
import { MateriaEntity } from '../materias/entities/materia.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { IOfertaRepository } from './application/ports/oferta.repository.interface';
import { CreateOfertaUseCase } from './application/use-cases/create-oferta.use-case';
import { FindOfertasByPriceUseCase } from './application/use-cases/find-ofertas-by-price.use-case';
import { GetAllOfertasUseCase } from './application/use-cases/get-all-ofertas.use-case';
import { GetFilteredOfertasUseCase } from './application/use-cases/get-filtered-ofertas.use-case';
import { GetOfertaByIdUseCase } from './application/use-cases/get-oferta-by-id.use-case';
import { Oferta } from './domain/entities/oferta.entity';
import { TypeOrmOfertaRepository } from './infrastructure/persistence/typeorm-oferta.repository';
import { OfertaMapper } from './mappers/oferta.mapper';
import { OfertasController } from './ofertas.controller';
import { OfertasService } from './ofertas.service';
import { TutorOfertasController } from './tutor-ofertas.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Oferta,
      Tutor,
      AvailabilityEntity,
      ExperienciaEntity,
      MateriaEntity,
    ]),
  ],
  controllers: [OfertasController, TutorOfertasController],
  providers: [
    CreateOfertaUseCase,
    FindOfertasByPriceUseCase,
    GetAllOfertasUseCase,
    GetFilteredOfertasUseCase,
    GetOfertaByIdUseCase,
    OfertaMapper,
    OfertasService,
    {
      provide: IOfertaRepository,
      useClass: TypeOrmOfertaRepository,
    },
  ],
})
export class OfertasModule {}
