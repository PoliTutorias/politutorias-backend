import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StudentSolicitudListItemDto } from './student-solicitud-list-item.dto';
import { HorarioItemDto } from './horario-item.dto';

/**
 * DTO para detalle de solicitud (perspectiva estudiante - HU-33)
 * Extiende la información de lista con campos adicionales
 */
export class StudentSolicitudDetailDto extends StudentSolicitudListItemDto {
  @ApiProperty({
    description: 'Mensaje completo del estudiante',
    example: 'Necesito ayuda con los temas de límites y derivadas.',
  })
  mensaje: string;

  @ApiProperty({
    description: 'Horarios solicitados por el estudiante',
    type: [HorarioItemDto],
    example: [
      { fecha: '2024-05-15', hora: '10:00' },
      { fecha: '2024-05-16', hora: '14:00' },
    ],
  })
  horarios: HorarioItemDto[];

  @ApiPropertyOptional({
    description:
      'Link de la reunión virtual (solo presente si estado=ACEPTADA y modalidad=Virtual)',
    example: 'https://meet.google.com/abc-defg-hij',
    nullable: true,
  })
  acceptedMeetingLink?: string | null;

  @ApiPropertyOptional({
    description: 'Razón del rechazo (solo presente si estado=RECHAZADA)',
    example: 'No tengo disponibilidad en esos horarios',
    nullable: true,
  })
  rejectionReason?: string | null;
}
