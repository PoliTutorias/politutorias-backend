import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO con el detalle completo de una sesión de tutoría.
 *
 * Usado por el modal "Detalles de la Sesión" en el frontend.
 * Los campos condicionales (meetingLink / meetingLocation) dependen de la modalidad.
 */
export class SessionDetailDto {
  @ApiProperty({ description: 'ID de la solicitud (sesión)', example: '550e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty({ description: 'Nombre del estudiante', example: 'Ana García' })
  studentName: string;

  @ApiProperty({ description: 'Email del estudiante', nullable: true, example: 'ana.g@epn.edu.ec' })
  studentEmail: string | null;

  @ApiProperty({ description: 'Título de la materia/oferta', example: 'Cálculo Vectorial' })
  subject: string;

  @ApiProperty({ description: 'Fecha de la sesión (ISO)', example: '2026-03-25' })
  date: string;

  @ApiProperty({ description: 'Hora de la sesión', example: '14:00' })
  hour: string;

  @ApiProperty({ description: 'Modalidad de la sesión', example: 'Virtual' })
  modality: string;

  @ApiProperty({ description: 'Precio por hora', example: 10 })
  pricePerHour: number;

  @ApiPropertyOptional({
    description: 'Enlace de la reunión virtual (solo si modalidad es Virtual)',
    example: 'https://meet.google.com/abc-defg-hij',
  })
  meetingLink: string | null;

  @ApiPropertyOptional({
    description: 'Lugar de encuentro presencial (solo si modalidad es Presencial)',
    example: 'Biblioteca Central, Sala de estudio 3',
  })
  meetingLocation: string | null;

  @ApiProperty({ description: 'Mensaje del estudiante', example: 'Necesito repasar integrales.' })
  studentMessage: string;

  @ApiProperty({ description: 'Estado de la sesión: PENDING o COMPLETED', example: 'PENDING' })
  status: 'PENDING' | 'COMPLETED';
}
