import { ApiProperty } from '@nestjs/swagger';
import { CalendarDayDto } from './calendar-day.dto';

/**
 * Sesión resumida para el panel lateral "ESTE MES".
 */
export class MonthSessionCardDto {
  @ApiProperty({ description: 'ID de la solicitud (sesión)', example: '550e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty({ description: 'Título de la materia/oferta', example: 'Cálculo Vectorial' })
  subject: string;

  @ApiProperty({ description: 'Nombre del estudiante', example: 'Ana García' })
  studentName: string;

  @ApiProperty({ description: 'Fecha de la sesión (ISO)', example: '2026-03-25' })
  date: string;

  @ApiProperty({ description: 'Hora de la sesión', example: '14:00' })
  hour: string;

  @ApiProperty({ description: 'Modalidad', example: 'Virtual' })
  modality: string;

  @ApiProperty({ description: 'Estado de la sesión: PENDING o COMPLETED', example: 'PENDING' })
  status: 'PENDING' | 'COMPLETED';
}

/**
 * DTO principal retornado por GET /api/tutor/agenda/:year/:month
 *
 * Contiene toda la información necesaria para renderizar:
 * 1. El calendario mensual (calendarDays)
 * 2. El panel lateral "ESTE MES" (upcomingSessions)
 * 3. El resumen numérico (totalSessions)
 */
export class InitialAgendaDataDto {
  @ApiProperty({ description: 'Año consultado', example: 2026 })
  year: number;

  @ApiProperty({ description: 'Mes consultado (1-12)', example: 3 })
  month: number;

  @ApiProperty({ description: 'Total de sesiones confirmadas en el mes', example: 5 })
  totalSessions: number;

  @ApiProperty({
    description: 'Días del mes con información de sesiones (solo incluye días que tienen al menos 1 sesión)',
    type: [CalendarDayDto],
  })
  calendarDays: CalendarDayDto[];

  @ApiProperty({
    description: 'Sesiones futuras del mes ordenadas cronológicamente (para el panel "ESTE MES")',
    type: [MonthSessionCardDto],
  })
  upcomingSessions: MonthSessionCardDto[];
}
