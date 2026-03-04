import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExperienciaEntity } from './entities/experiencia.entity';
import { ExperienciaDto } from '../common/dtos/experiencia.dto';
import { ExperienciaTypeOrmRepository } from './infrastructure/typeorm-experiencia.repository';
import { AddExperienciaUseCase } from './application/use-cases/add-experiencia.use-case';

/**
 * ExperienciasService — Facade (HU42)
 *
 * Preserva la API pública para compatibilidad con los tests existentes,
 * mientras delega la lógica al UseCase y el acceso a datos al Adapter.
 * — Fachada + DIP (SOLID): no importa TypeORM directamente en el Use Case.
 */
@Injectable()
export class ExperienciasService {
  private readonly useCase: AddExperienciaUseCase;

  constructor(
    @InjectRepository(ExperienciaEntity)
    private readonly ormRepo: Repository<ExperienciaEntity>,
  ) {
    const adapter = new ExperienciaTypeOrmRepository(ormRepo);
    this.useCase = new AddExperienciaUseCase(adapter);
  }

  add(userId: string, dto: ExperienciaDto): Promise<ExperienciaEntity> {
    return this.useCase.execute(userId, dto);
  }
}
