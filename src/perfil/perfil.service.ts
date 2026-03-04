import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilProfesionalEntity } from './entities/perfil-profesional.entity';
import { ExperienciaEntity } from '../experiencias/entities/experiencia.entity';
import { MateriaEntity } from '../materias/entities/materia.entity';
import { PerfilProfesionalDto } from '../common/dtos/perfil-profesional.dto';
import { PerfilProfesionalTypeOrmRepository } from './infrastructure/typeorm-perfil-profesional.repository';
import { FinalizarPerfilProfesionalUseCase } from './application/use-cases/finalizar-perfil-profesional.use-case';

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
    private readonly _experienciaOrmRepo: Repository<ExperienciaEntity>,
    @InjectRepository(MateriaEntity)
    private readonly _materiaOrmRepo: Repository<MateriaEntity>,
  ) {
    const adapter = new PerfilProfesionalTypeOrmRepository(perfilOrmRepo);
    this.useCase = new FinalizarPerfilProfesionalUseCase(adapter);
  }

  finalizar(
    userId: string,
    dto: PerfilProfesionalDto,
  ): Promise<PerfilProfesionalEntity> {
    return this.useCase.execute(userId, dto);
  }
}
