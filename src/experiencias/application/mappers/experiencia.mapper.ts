import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExperienciaEntity } from '../../entities/experiencia.entity';

/**
 * DTO de respuesta para ExperienciaEntity.
 * Refleja exactamente el contrato HTTP acordado con el frontend.
 */
export class ExperienciaResponseDto {
  @ApiProperty({ example: 'uuid-v4' })
  id: string;

  @ApiProperty({ example: 'tutor-uuid' })
  tutorId: string;

  @ApiProperty({ example: 'Profesor de Cálculo I' })
  puesto: string;

  @ApiProperty({ example: 'Universidad Nacional' })
  institucion: string;

  @ApiProperty({ example: '08/2020' })
  fechaInicio: string;

  @ApiPropertyOptional({ example: 'Presente' })
  fechaFin?: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date | string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date | string;
}

/**
 * Mapper entre ExperienciaEntity y ExperienciaResponseDto.
 *
 * Punto de extensión: si el contrato de respuesta evoluciona, sólo
 * se modifica este archivo. — SRP (SOLID)
 */
export class ExperienciaMapper {
  static toResponseDto(entity: ExperienciaEntity): ExperienciaResponseDto {
    const dto = new ExperienciaResponseDto();
    dto.id = entity.id;
    dto.tutorId = entity.tutorId;
    dto.puesto = entity.puesto;
    dto.institucion = entity.institucion;
    dto.fechaInicio = entity.fechaInicio;
    dto.fechaFin = entity.fechaFin;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
