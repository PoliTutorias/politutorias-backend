import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import {
  IOffersRepository,
} from './domain/interfaces/offers.repository.interface';
import { TypeOrmOffersRepository } from './infrastructure/typeorm/typeorm-offers.repository';
import { FindAllOffersUseCase } from './application/use-cases/find-all-offers.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Oferta, Tutor])],
  controllers: [OffersController],
  providers: [
    // Servicio principal (mantiene compatibilidad con tests existentes)
    OffersService,

    // Capa de infraestructura: implementación concreta del repositorio
    TypeOrmOffersRepository,

    // Inversión de dependencias: IOffersRepository → TypeOrmOffersRepository
    {
      provide: IOffersRepository,
      useClass: TypeOrmOffersRepository,
    },

    // Caso de uso desacoplado de la implementación de persistencia
    FindAllOffersUseCase,
  ],
})
export class OffersModule {}
