import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AvailabilityEntity } from '../../entities/availability.entity';
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
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    tutorId: string,
    blocks: AvailabilityBlockDto[],
  ): Promise<SaveAvailabilityResponseDto> {
    const authoritativeTutorId = tutorId;

    // Ejecutar toda la operación dentro de una transacción
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      try {
        // 1. Eliminar toda la disponibilidad anterior para este tutor
        await transactionalEntityManager.delete(AvailabilityEntity, {
          tutorId: authoritativeTutorId,
        });

        // 2. Crear nuevas entidades a partir de los bloques
        const availabilityEntities = blocks.map((block) =>
          this.availabilityRepository.create({
            tutorId: authoritativeTutorId,
            day: block.day,
            hour: block.hour,
          }),
        );

        // 3. Guardar todas las nuevas entidades dentro de la transacción
        const savedBlocks = await transactionalEntityManager.save(
          AvailabilityEntity,
          availabilityEntities,
        );

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
    });
  }
}
