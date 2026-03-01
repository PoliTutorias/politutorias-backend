import { ApiProperty } from '@nestjs/swagger';
import { TutorResponseDto } from './tutor-response.dto';

/**
 * DTO de respuesta para una oferta de tutoría.
 *
 * Expone los campos en español según el contrato REST de HU27.
 * Los campos que aún no existen en la entidad actual (`carrera`,
 * `lugarReunion`, `imagenRepresentativaUrl`) se devuelven como `null`
 * hasta que la entidad sea extendida.
 */
export class OfertaResponseDto {
  @ApiProperty({
    description: 'UUID de la oferta',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Título de la oferta de tutoría',
    example: 'Cálculo Diferencial e Integral',
  })
  titulo: string;

  @ApiProperty({
    description: 'Carrera o área académica asociada (campo futuro)',
    example: null,
    nullable: true,
  })
  carrera: string | null;

  @ApiProperty({
    description: 'Modalidad de la tutoría: Virtual, Presencial, Híbrida, Virtual/Presencial',
    example: 'Virtual',
  })
  modalidad: string;

  @ApiProperty({
    description: 'Descripción detallada de la oferta',
    example: 'Tutorías especializadas en límites, derivadas e integrales.',
  })
  descripcion: string;

  @ApiProperty({
    description: 'Lugar de reunión para tutorías presenciales (campo futuro)',
    example: null,
    nullable: true,
  })
  lugarReunion: string | null;

  @ApiProperty({
    description: 'Precio por hora en USD',
    example: 12.5,
    minimum: 0,
  })
  precio: number;

  @ApiProperty({
    description: 'Información del tutor que ofrece la tutoría',
    type: () => TutorResponseDto,
    nullable: true,
  })
  tutor: TutorResponseDto | null;

  @ApiProperty({
    description: 'URL de la imagen representativa de la oferta (campo futuro)',
    example: null,
    nullable: true,
  })
  imagenRepresentativaUrl: string | null;

  @ApiProperty({
    description: 'Fecha de creación en formato ISO 8601',
    example: '2024-03-15T10:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Fecha de última actualización en formato ISO 8601',
    example: '2024-03-15T10:00:00.000Z',
  })
  updatedAt: string;
}
