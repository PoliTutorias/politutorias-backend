import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Status de una sesión en el DTO de respuesta.
 * - 'ACEPTADA':  sesión futura confirmada (estado en BD: ACEPTADA y fecha futura)
 * - 'COMPLETED': sesión pasada (calculado en runtime; en BD puede ser ACEPTADA o COMPLETADA)
 */
export type SolicitudStatus = 'ACEPTADA' | 'COMPLETED';

/**
 * DTO para un item de la lista de sesiones del estudiante.
 * Se usa tanto en "proximas" como en "anteriores".
 */
export class AgendaStudentListItemDTO {
  @ApiProperty({ description: 'UUID de la solicitud', example: 'abc-123' })
  id: string;

  @ApiProperty({
    description: 'Nombre completo del tutor',
    example: 'Juan Pérez',
  })
  tutorName: string;

  @ApiPropertyOptional({
    description: 'URL del avatar del tutor',
    nullable: true,
  })
  tutorAvatarUrl: string | null;

  @ApiProperty({
    description: 'Nombre de la materia/oferta',
    example: 'Cálculo I',
  })
  subjectName: string;

  @ApiProperty({
    description: 'Fecha y hora ISO de la sesión',
    example: '2099-07-25T10:00:00.000Z',
  })
  date: string;

  @ApiProperty({ description: 'Hora de la sesión (HH:mm)', example: '10:00' })
  time: string;

  @ApiProperty({ description: 'Modalidad de la sesión', example: 'Virtual' })
  modality: string;

  @ApiProperty({
    description: 'Estado de la sesión en el DTO',
    enum: ['ACEPTADA', 'COMPLETED'],
  })
  status: SolicitudStatus;
}

/**
 * DTO para el detalle completo de una sesión del estudiante.
 * Extiende AgendaStudentListItemDTO con campos adicionales.
 */
export class AgendaStudentDetailDTO extends AgendaStudentListItemDTO {
  @ApiPropertyOptional({
    description: 'Enlace de reunión virtual',
    nullable: true,
  })
  meetingLink: string | null;

  @ApiPropertyOptional({
    description: 'Ubicación de la reunión presencial',
    nullable: true,
  })
  meetingLocation: string | null;

  @ApiProperty({
    description: 'Mensaje del estudiante al solicitar la tutoría',
  })
  studentMessage: string;

  @ApiPropertyOptional({ description: 'Precio de la oferta', example: 25000 })
  price: number;
}

/**
 * DTO de respuesta completo para GET /api/estudiante/agenda.
 * Agrupa las sesiones en "proximas" (futuras) y "anteriores" (pasadas).
 */
export class EstudianteAgendaResponseDto {
  @ApiProperty({
    type: [AgendaStudentListItemDTO],
    description: 'Sesiones futuras confirmadas',
  })
  proximas: AgendaStudentListItemDTO[];

  @ApiProperty({
    type: [AgendaStudentListItemDTO],
    description: 'Sesiones pasadas (historial)',
  })
  anteriores: AgendaStudentListItemDTO[];

  @ApiProperty({ description: 'Total de sesiones futuras', example: 3 })
  totalProximas: number;

  @ApiProperty({ description: 'Total de sesiones pasadas', example: 7 })
  totalAnteriores: number;

  @ApiProperty({ description: 'Página actual de anteriores', example: 1 })
  currentPage: number;

  @ApiProperty({ description: 'Total de páginas de anteriores', example: 2 })
  totalPagesAnteriores: number;
}
