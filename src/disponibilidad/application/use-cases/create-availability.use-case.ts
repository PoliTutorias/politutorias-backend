import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { IAvailabilityRepository } from '../ports/availability.repository.interface';
import { AVAILABILITY_REPOSITORY_TOKEN } from '../ports/availability.repository.interface';
import type { AvailabilityBlockDto } from '../../dto/availability-block.dto';
import { SaveAvailabilityResponseDto } from '../dtos/save-availability-response.dto';
import { AvailabilityBlockResponseDto } from '../dtos/availability-block-response.dto';

@Injectable()
export class CreateAvailabilityUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY_TOKEN)
    private availabilityRepository: IAvailabilityRepository,
  ) {}

  async execute(
    tutorId: string,
    blocks: AvailabilityBlockDto[],
  ): Promise<SaveAvailabilityResponseDto> {
    try {
      const authoritativeTutorId = tutorId;

      // 1. Eliminar toda la disponibilidad anterior para este tutor
      await this.availabilityRepository.deleteByTutorId(authoritativeTutorId);

      // 2. Crear nuevas entidades a partir de los bloques
      const availabilityEntities = blocks.map((block) =>
        this.availabilityRepository.create({
          tutorId: authoritativeTutorId,
          day: block.day,
          hour: block.hour,
        }),
      );

      // 3. Guardar todas las nuevas entidades
      const savedBlocks =
        await this.availabilityRepository.saveAll(availabilityEntities);

      // 4. Mapear a DTOs de respuesta y retornar la respuesta en el formato acordado
      const blocksDtos = savedBlocks.map(
        (block) =>
          new AvailabilityBlockResponseDto(block.id, block.day, block.hour),
      );

      return new SaveAvailabilityResponseDto(
        'Disponibilidad registrada exitosamente para el tutor.',
        authoritativeTutorId,
        blocksDtos,
      );
    } catch (error) {
      console.error('Error in CreateAvailabilityUseCase:', error);
      throw new InternalServerErrorException(
        'Error interno al guardar la disponibilidad.',
      );
    }
  }
}
