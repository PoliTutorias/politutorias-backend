import { InternalServerErrorException } from '@nestjs/common';
import { PerfilProfesionalEntity } from '../../entities/perfil-profesional.entity';
import { IPerfilProfesionalRepository } from '../../domain/ports/perfil-profesional.repository.port';
import { PerfilProfesionalDto } from '../../../common/dtos/perfil-profesional.dto';

/**
 * Caso de uso: Finalizar (crear o actualizar) el perfil profesional de un tutor.
 *
 * Implementa la regla de negocio de unicidad del perfil profesional por tutor.
 * Depende únicamente del port IPerfilProfesionalRepository. — SRP + DIP (SOLID)
 */
export class FinalizarPerfilProfesionalUseCase {
  constructor(private readonly repository: IPerfilProfesionalRepository) {}

  async execute(
    tutorId: string,
    dto: PerfilProfesionalDto,
  ): Promise<PerfilProfesionalEntity> {
    try {
      let perfil = await this.repository.findByTutorId(tutorId);

      if (!perfil) {
        perfil = this.repository.create({ tutorId });
      }

      perfil.materias = dto.materias ?? [];

      return await this.repository.save(perfil);
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(
        'Error interno al finalizar el perfil profesional.',
      );
    }
  }
}
