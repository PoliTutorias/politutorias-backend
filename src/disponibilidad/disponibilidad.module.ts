import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tutor } from '../tutors/entities/tutor.entity';
import { AVAILABILITY_REPOSITORY_TOKEN } from './application/ports/availability.repository.interface';
import { CreateAvailabilityUseCase } from './application/use-cases/create-availability.use-case';
import { DisponibilidadController } from './disponibilidad.controller';
import { DisponibilidadService } from './disponibilidad.service';
import { AvailabilityEntity } from './entities/availability.entity';
import { TypeORMAvailabilityRepository } from './infrastructure/persistence/typeorm-availability.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AvailabilityEntity, Tutor])],
  controllers: [DisponibilidadController],
  providers: [
    DisponibilidadService,
    // Implementación concreta del repositorio
    TypeORMAvailabilityRepository,
    // Provider que mapea la interfaz al token de inyección de dependencias
    {
      provide: AVAILABILITY_REPOSITORY_TOKEN,
      useClass: TypeORMAvailabilityRepository,
    },
    // Caso de uso que depende de la interfaz del repositorio
    CreateAvailabilityUseCase,
  ],
  exports: [DisponibilidadService],
})
export class DisponibilidadModule {}
