import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvailabilityEntity } from './entities/availability.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

@Injectable()
export class DisponibilidadService {
  constructor(
    @InjectRepository(AvailabilityEntity)
    private availabilityRepository: Repository<AvailabilityEntity>,
  ) {}

  async save(userId: string, createAvailabilityDto: CreateAvailabilityDto) {
    try {
      const authoritativeTutorId = userId; // Priorizar el ID del JWT

      // 1. Eliminar toda la disponibilidad anterior para este tutor
      await this.availabilityRepository.delete({
        tutorId: authoritativeTutorId,
      });

      // 2. Crear nuevas entidades a partir de los bloques
      const availabilityEntities = createAvailabilityDto.blocks.map((block) =>
        this.availabilityRepository.create({
          tutorId: authoritativeTutorId,
          day: block.day,
          hour: block.hour,
        }),
      );

      // 3. Guardar todas las nuevas entidades
      const savedBlocks =
        await this.availabilityRepository.save(availabilityEntities);

      // 4. Retornar la respuesta en el formato acordado
      return {
        message: 'Disponibilidad registrada exitosamente para el tutor.',
        tutorId: authoritativeTutorId,
        blocks: savedBlocks.map((block) => ({
          id: block.id,
          day: block.day,
          hour: block.hour,
        })),
      };
    } catch (error) {
      console.error('Error saving availability in service:', error);
      // Lanzar una excepción de servidor interno para errores inesperados
      throw new InternalServerErrorException(
        'Error interno al guardar la disponibilidad.',
      );
    }
  }

  /**
   * HU07: Consultar disponibilidad del tutor
   * Retorna todos los bloques de disponibilidad para un tutor dado
   */
  async findByTutorId(tutorId: string): Promise<AvailabilityEntity[]> {
    return this.availabilityRepository.find({
      where: { tutorId },
      order: { day: 'ASC', hour: 'ASC' },
    });
  }
}
