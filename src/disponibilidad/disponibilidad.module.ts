import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisponibilidadController } from './disponibilidad.controller';
import { AvailabilityEntity } from './entities/availability.entity';
import { TypeORMAvailabilityRepository } from './infrastructure/persistence/typeorm-availability.repository';
import { CreateAvailabilityUseCase } from './application/use-cases/create-availability.use-case';
import { AVAILABILITY_REPOSITORY_TOKEN } from './application/ports/availability.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([AvailabilityEntity])],
  controllers: [DisponibilidadController],
  providers: [
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
})
export class DisponibilidadModule {}
