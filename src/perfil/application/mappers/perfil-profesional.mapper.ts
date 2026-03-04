import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PerfilProfesionalEntity } from '../../entities/perfil-profesional.entity';

/**
 * DTO de respuesta para PerfilProfesionalEntity.
 * Refleja exactamente el contrato HTTP acordado con el frontend.
 */
export class PerfilProfesionalResponseDto {
  @ApiProperty({ example: 'uuid-v4' })
  id: string;

  @ApiProperty({ example: 'tutor-uuid' })
  tutorId: string;

  @ApiPropertyOptional({ type: [String], example: ['Cálculo', 'Física'] })
  materias: string[];

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date | string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date | string;
}

/**
 * Mapper entre PerfilProfesionalEntity y PerfilProfesionalResponseDto.
 *
 * Punto de extensión: si el contrato de respuesta evoluciona, sólo
 * se modifica este archivo. — SRP (SOLID)
 */
export class PerfilProfesionalMapper {
  static toResponseDto(
    entity: PerfilProfesionalEntity,
  ): PerfilProfesionalResponseDto {
    const dto = new PerfilProfesionalResponseDto();
    dto.id = entity.id;
    dto.tutorId = entity.tutorId;
    dto.materias = entity.materias ?? [];
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
