import { ApiProperty } from '@nestjs/swagger';

/**
 * Representa una sesión resumida dentro de un día del calendario.
 */
export class CalendarSessionSummaryDto {
  @ApiProperty({ description: 'ID de la solicitud (sesión)', example: '550e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty({ description: 'Título de la materia/oferta', example: 'Cálculo Vectorial' })
  subject: string;

  @ApiProperty({ description: 'Hora de la sesión', example: '14:00' })
  hour: string;

  @ApiProperty({ description: 'Nombre del estudiante', example: 'Ana García' })
  studentName: string;

  @ApiProperty({ description: 'Modalidad de la sesión', example: 'Virtual' })
  modality: string;
}

/**
 * Información de un día del calendario con indicadores de sesiones.
 */
export class CalendarDayDto {
  @ApiProperty({ description: 'Número del día del mes (1-31)', example: 15 })
  day: number;

  @ApiProperty({ description: 'Cantidad de sesiones en ese día', example: 2 })
  sessionCount: number;

  @ApiProperty({
    description: 'Etiquetas resumidas de las sesiones (para mostrar en el calendario)',
    example: ['14:00 Cálculo', '16:00 Física'],
    type: [String],
  })
  labels: string[];
}
