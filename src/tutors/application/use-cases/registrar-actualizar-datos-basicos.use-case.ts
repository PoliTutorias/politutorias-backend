import { Injectable, Inject } from '@nestjs/common';
import { Tutor } from '../../entities/tutor.entity';
import type { ITutorRepository } from '../../domain/ports/tutor.repository.port';
import { TUTOR_REPOSITORY_TOKEN } from '../../domain/ports/tutor.repository.port';
import { RegistrarDatosBasicosDto } from '../../dto/registrar-datos-basicos.dto';

/**
 * Caso de uso: Registrar o actualizar los datos básicos de un tutor (upsert).
 *
 * Responsabilidad única: orquestar la lógica de negocio del upsert.
 * Depende únicamente del port ITutorRepository, no de TypeORM.
 * — Principios SRP y DIP (SOLID)
 */
@Injectable()
export class RegistrarActualizarDatosBasicosTutorUseCase {
  constructor(
    @Inject(TUTOR_REPOSITORY_TOKEN)
    private readonly tutorRepository: ITutorRepository,
  ) {}

  async execute(userId: string, dto: RegistrarDatosBasicosDto): Promise<Tutor> {
    let tutor = await this.tutorRepository.findByUserId(userId);

    if (!tutor) {
      tutor = this.tutorRepository.create({ userId, ...dto });
    } else {
      Object.assign(tutor, dto);
    }

    return this.tutorRepository.save(tutor);
  }
}
