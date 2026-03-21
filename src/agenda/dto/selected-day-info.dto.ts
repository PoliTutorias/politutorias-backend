import { ApiProperty } from '@nestjs/swagger';
import { CalendarSessionSummaryDto } from './calendar-day.dto';

/**
 * DTO retornado por GET /api/tutor/agenda/sessions/day?date=2026-03-25
 *
 * Información para el panel lateral al seleccionar un día del calendario.
 */
export class SelectedDayInfoDto {
  @ApiProperty({ description: 'Fecha seleccionada (ISO)', example: '2026-03-25' })
  date: string;

  @ApiProperty({ description: 'Cantidad de sesiones en el día seleccionado', example: 2 })
  sessionCount: number;

  @ApiProperty({
    description: 'Lista de sesiones del día seleccionado',
    type: [CalendarSessionSummaryDto],
  })
  sessions: CalendarSessionSummaryDto[];
}
