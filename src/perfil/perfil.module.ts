import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilController } from './perfil.controller';
import { PerfilService } from './perfil.service';
import { PerfilProfesionalEntity } from './entities/perfil-profesional.entity';
import { ExperienciaEntity } from '../experiencias/entities/experiencia.entity';
import { MateriaEntity } from '../materias/entities/materia.entity';
import { PerfilProfesionalTypeOrmRepository } from './infrastructure/typeorm-perfil-profesional.repository';
import { PERFIL_PROFESIONAL_REPOSITORY_TOKEN } from './domain/ports/perfil-profesional.repository.port';

/**
 * PerfilModule — HU42
 *
 * Registra la arquitectura en capas:
 *   Controller (HTTP) → Service (Facade) → UseCase → Repository Port → TypeORM Adapter
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PerfilProfesionalEntity,
      ExperienciaEntity,
      MateriaEntity,
    ]),
  ],
  controllers: [PerfilController],
  providers: [
    // Adapter concreto para el port IPerfilProfesionalRepository
    PerfilProfesionalTypeOrmRepository,
    {
      provide: PERFIL_PROFESIONAL_REPOSITORY_TOKEN,
      useClass: PerfilProfesionalTypeOrmRepository,
    },
    // Facade pública — compatibilidad con tests y e2e
    PerfilService,
  ],
  exports: [PerfilService],
})
export class PerfilModule {}
