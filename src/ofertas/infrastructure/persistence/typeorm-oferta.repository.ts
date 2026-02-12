import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Oferta } from '../../domain/entities/oferta.entity';
import { IOfertaRepository } from '../../application/ports/oferta.repository.interface';
import { OfertaAlreadyExistsException } from '../../application/exceptions/oferta-already-exists.exception';

// Database error codes for unique constraint violations
const POSTGRES_UNIQUE_VIOLATION = '23505';
const SQLITE_CONSTRAINT_VIOLATION = 'SQLITE_CONSTRAINT';
const DUPLICATE_OFFER_MESSAGE = 'Ya existe una oferta con este título para este tutor.';

@Injectable()
export class TypeOrmOfertaRepository implements IOfertaRepository {
  constructor(
    @InjectRepository(Oferta)
    private readonly ofertaRepository: Repository<Oferta>,
  ) {}

  async save(oferta: Oferta): Promise<Oferta> {
    try {
      return await this.ofertaRepository.save(oferta);
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new OfertaAlreadyExistsException(DUPLICATE_OFFER_MESSAGE);
      }
      throw error;
    }
  }

  /**
   * Checks if the error is a unique constraint violation from TypeORM/database.
   * Supports PostgreSQL and SQLite error codes.
   */
  private isUniqueConstraintViolation(error: any): boolean {
    return (
      error.code === POSTGRES_UNIQUE_VIOLATION ||
      error.code === SQLITE_CONSTRAINT_VIOLATION
    );
  }
}
