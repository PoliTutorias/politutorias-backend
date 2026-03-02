import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tutor } from '../entities/tutor.entity';
import { ITutorRepository } from '../domain/ports/tutor.repository.port';

/**
 * Implementación concreta del ITutorRepository usando TypeORM.
 * Adapter entre el puerto del dominio y el ORM.
 * — Patrón Repository + Principio de Inversión de Dependencias (SOLID-D)
 */
@Injectable()
export class TypeOrmTutorRepositoryAdapter implements ITutorRepository {
  constructor(
    @InjectRepository(Tutor)
    private readonly ormRepository: Repository<Tutor>,
  ) {}

  findByUserId(userId: string): Promise<Tutor | null> {
    return this.ormRepository.findOne({ where: { userId } });
  }

  save(tutor: Tutor): Promise<Tutor> {
    return this.ormRepository.save(tutor);
  }

  create(data: Partial<Tutor>): Tutor {
    return this.ormRepository.create(data);
  }
}
