import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilProfesionalDto } from '../common/dtos/perfil-profesional.dto';
import { ExperienciaEntity } from '../experiencias/entities/experiencia.entity';
import { MateriaEntity } from '../materias/entities/materia.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { FinalizarPerfilProfesionalUseCase } from './application/use-cases/finalizar-perfil-profesional.use-case';
import { PerfilProfesionalEntity } from './entities/perfil-profesional.entity';
import { PerfilProfesionalTypeOrmRepository } from './infrastructure/typeorm-perfil-profesional.repository';

/**
 * PerfilService — Facade (HU42)
 *
 * Preserva la API pública para compatibilidad con los tests existentes,
 * mientras delega la lógica al UseCase y el acceso a datos al Adapter.
 * — Fachada + DIP (SOLID): no importa TypeORM directamente en el Use Case.
 */
@Injectable()
export class PerfilService {
  private readonly useCase: FinalizarPerfilProfesionalUseCase;

  constructor(
    @InjectRepository(PerfilProfesionalEntity)
    private readonly perfilOrmRepo: Repository<PerfilProfesionalEntity>,
    @InjectRepository(ExperienciaEntity)
    private readonly experienciaOrmRepo: Repository<ExperienciaEntity>,
    @InjectRepository(MateriaEntity)
    private readonly materiaOrmRepo: Repository<MateriaEntity>,
    @InjectRepository(Tutor)
    private readonly tutorRepository: Repository<Tutor>,
  ) {
    const adapter = new PerfilProfesionalTypeOrmRepository(perfilOrmRepo);
    this.useCase = new FinalizarPerfilProfesionalUseCase(adapter);
  }

  async finalizar(
    userId: string,
    dto: PerfilProfesionalDto,
  ): Promise<PerfilProfesionalEntity> {
    // Resolver userId (JWT sub) → tutor UUID para guardar con el ID correcto
    const tutor = await this.tutorRepository.findOne({
      where: { userId },
    });
    const tutorId = tutor?.id ?? userId;

    // 1. Guardar perfil profesional (materias como simple-array)
    const perfil = await this.useCase.execute(tutorId, dto);

    // 2. Guardar experiencias en tabla tutor_experiencias
    if (dto.experiencias?.length) {
      for (const exp of dto.experiencias) {
        const entity = this.experienciaOrmRepo.create({
          tutorId,
          puesto: exp.puesto,
          institucion: exp.institucion,
          fechaInicio: exp.fechaInicio,
          fechaFin: exp.fechaFin,
        });
        await this.experienciaOrmRepo.save(entity);
      }
    }

    // 3. Guardar materias en tabla tutor_materias
    if (dto.materias?.length) {
      for (const nombre of dto.materias) {
        const existing = await this.materiaOrmRepo.findOne({
          where: { tutorId, nombre },
        });
        if (!existing) {
          const entity = this.materiaOrmRepo.create({ tutorId, nombre });
          await this.materiaOrmRepo.save(entity);
        }
      }
    }

    return perfil;
  }
}
