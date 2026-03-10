import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tutor } from '../tutors/entities/tutor.entity';
import { EXPERIENCIA_REPOSITORY_TOKEN } from './domain/ports/experiencia.repository.port';
import { ExperienciaEntity } from './entities/experiencia.entity';
import { ExperienciasController } from './experiencias.controller';
import { ExperienciasService } from './experiencias.service';
import { ExperienciaTypeOrmRepository } from './infrastructure/typeorm-experiencia.repository';

/**
 * ExperienciasModule — HU42
 *
 * Registra la arquitectura en capas:
 *   Controller (HTTP) → Service (Facade) → UseCase → Repository Port → TypeORM Adapter
 */
@Module({
  imports: [TypeOrmModule.forFeature([ExperienciaEntity, Tutor])],
  controllers: [ExperienciasController],
  providers: [
    // Adapter concreto para el port IExperienciaRepository
    ExperienciaTypeOrmRepository,
    {
      provide: EXPERIENCIA_REPOSITORY_TOKEN,
      useClass: ExperienciaTypeOrmRepository,
    },
    // Facade pública — compatibilidad con tests y e2e
    ExperienciasService,
  ],
  exports: [ExperienciasService],
})
export class ExperienciasModule {}
