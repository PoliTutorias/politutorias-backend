import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

/**
 * TutorBasicDto — HU26
 *
 * Subconjunto del tutor expuesto en la lista de ofertas.
 * Solo expone id, nombre y fotoUrl (sin calificaciones, que van en la raíz).
 */
export class TutorBasicDto {
  @ApiProperty({
    description: 'UUID del tutor',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Nombre completo del tutor',
    example: 'Juan Carlos Pérez',
  })
  @Expose()
  @Transform(
    ({ obj }: { obj: Record<string, unknown> }) =>
      (obj.nombreCompleto as string) ?? (obj.nombre as string),
  )
  nombre: string;

  @ApiProperty({
    description: 'URL de la foto de perfil del tutor',
    example: 'https://example.com/fotos/juan.jpg',
    nullable: true,
  })
  @Expose()
  @Transform(
    ({ obj }: { obj: Record<string, unknown> }) =>
      (obj.fotoPerfil as string | null) ??
      (obj.fotoUrl as string | null) ??
      null,
  )
  fotoUrl: string | null;
}

/**
 * OfertaItemDto — HU26
 *
 * DTO de respuesta para cada oferta en el endpoint GET /api/ofertas.
 *
 * Nota sobre el "aplanado" de calificaciones:
 *   - `calificacionPromedio` y `numResenas` viven en la entidad Tutor,
 *     pero el contrato HU26 los expone en la RAÍZ del objeto oferta.
 *   - Se usa @Transform con `obj` (la entidad fuente) para extraer los
 *     valores del sub-objeto `tutor` antes de que sea transformado.
 */
export class OfertaItemDto {
  @ApiProperty({
    description: 'UUID de la oferta',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Título de la oferta de tutoría',
    example: 'Cálculo Diferencial e Integral',
  })
  @Expose()
  titulo: string;

  @ApiProperty({
    description: 'Descripción detallada de la oferta',
    example: 'Tutorías especializadas en límites, derivadas e integrales.',
    nullable: true,
  })
  @Expose()
  descripcion: string | null;

  @ApiProperty({
    description: 'Modalidad de la tutoría',
    enum: ['PRESENCIAL', 'VIRTUAL', 'VIRTUAL/PRESENCIAL'],
    example: 'VIRTUAL',
  })
  @Expose()
  modalidad: string;

  @ApiProperty({ description: 'Precio por hora en USD', example: 15.0 })
  @Expose()
  precioHora: number;

  @ApiProperty({
    description: 'Área de conocimiento de la oferta',
    example: 'Matemáticas',
    nullable: true,
  })
  @Expose()
  areaConocimiento: string | null;

  @ApiProperty({
    description: 'Nivel educativo al que está dirigida la oferta',
    example: 'Universitario',
    nullable: true,
  })
  @Expose()
  nivel: string | null;

  @ApiProperty({
    description: 'Datos básicos del tutor que ofrece la tutoría',
    type: () => TutorBasicDto,
  })
  @Expose()
  @Type(() => TutorBasicDto)
  tutor: TutorBasicDto;

  /** Aplanado desde tutor.calificacionPromedio (Riesgo 1 del análisis HU26) */
  @ApiProperty({
    description: 'Calificación promedio del tutor (0–5)',
    example: 4.7,
    nullable: true,
  })
  @Expose()
  @Transform(
    ({ obj }: { obj: { tutor?: { calificacionPromedio?: number } } }) =>
      obj.tutor?.calificacionPromedio,
  )
  calificacionPromedio?: number;

  /** Aplanado desde tutor.numResenas (Riesgo 1 del análisis HU26) */
  @ApiProperty({
    description: 'Número total de reseñas del tutor',
    example: 45,
    nullable: true,
  })
  @Expose()
  @Transform(
    ({ obj }: { obj: { tutor?: { numResenas?: number } } }) =>
      obj.tutor?.numResenas,
  )
  numResenas?: number;

  /** Fecha en formato ISO 8601 string (Riesgo 2 del análisis HU26) */
  @ApiProperty({
    description: 'Fecha de creación de la oferta en formato ISO 8601',
    example: '2024-03-10T10:00:00.000Z',
  })
  @Expose()
  @Transform(({ value }: { value: unknown }) =>
    value instanceof Date ? value.toISOString() : (value as string),
  )
  fechaCreacion: string;

  /** Bloques de disponibilidad del tutor (inyectados manualmente post-transform) */
  @ApiProperty({
    description: 'Horarios de disponibilidad del tutor',
    example: [
      { day: 'Lun', hour: '14:00' },
      { day: 'Mar', hour: '09:00' },
    ],
    required: false,
  })
  horarios?: { day: string; hour: string }[];
}
