import { InternalServerErrorException } from '@nestjs/common';
import { ExperienciaEntity } from '../../entities/experiencia.entity';
import { IExperienciaRepository } from '../../domain/ports/experiencia.repository.port';
import { ExperienciaDto } from '../../../common/dtos/experiencia.dto';

/**
 * Caso de uso: Registrar una nueva experiencia académica/profesional de un tutor.
 *
 * Orquesta la lógica de negocio sin acoplamientos a TypeORM ni a NestJS HTTP.
 * Depende únicamente del port IExperienciaRepository. — SRP + DIP (SOLID)
 */
export class AddExperienciaUseCase {
  constructor(private readonly repository: IExperienciaRepository) {}

  async execute(
    tutorId: string,
    dto: ExperienciaDto,
  ): Promise<ExperienciaEntity> {
    try {
      const entity = this.repository.create({ tutorId, ...dto });
      return await this.repository.save(entity);
    } catch {
      throw new InternalServerErrorException(
        'Error interno al registrar la experiencia.',
      );
    }
  }
}
