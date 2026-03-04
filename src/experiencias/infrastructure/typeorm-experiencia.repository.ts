import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExperienciaEntity } from '../entities/experiencia.entity';
import { IExperienciaRepository } from '../../domain/ports/experiencia.repository.port';

/**
 * Implementación concreta de IExperienciaRepository usando TypeORM.
 *
 * Adapter entre el port del dominio y el ORM.
 * — Repository Pattern + DIP (SOLID)
 */
@Injectable()
export class ExperienciaTypeOrmRepository implements IExperienciaRepository {
  constructor(
    @InjectRepository(ExperienciaEntity)
    private readonly ormRepo: Repository<ExperienciaEntity>,
  ) {}

  create(data: Partial<ExperienciaEntity>): ExperienciaEntity {
    return this.ormRepo.create(data);
  }

  save(entity: ExperienciaEntity): Promise<ExperienciaEntity> {
    return this.ormRepo.save(entity);
  }
}
