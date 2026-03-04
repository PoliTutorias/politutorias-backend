import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilProfesionalEntity } from '../entities/perfil-profesional.entity';
import { IPerfilProfesionalRepository } from '../domain/ports/perfil-profesional.repository.port';

/**
 * Implementación concreta de IPerfilProfesionalRepository usando TypeORM.
 *
 * Adapter entre el port del dominio y el ORM.
 * — Repository Pattern + DIP (SOLID)
 */
@Injectable()
export class PerfilProfesionalTypeOrmRepository implements IPerfilProfesionalRepository {
  constructor(
    @InjectRepository(PerfilProfesionalEntity)
    private readonly ormRepo: Repository<PerfilProfesionalEntity>,
  ) {}

  findByTutorId(tutorId: string): Promise<PerfilProfesionalEntity | null> {
    return this.ormRepo.findOne({ where: { tutorId } });
  }

  create(data: Partial<PerfilProfesionalEntity>): PerfilProfesionalEntity {
    return this.ormRepo.create(data);
  }

  save(entity: PerfilProfesionalEntity): Promise<PerfilProfesionalEntity> {
    return this.ormRepo.save(entity);
  }
}
