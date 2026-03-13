import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SolicitudEstado } from '../entities/solicitud.entity';
import { HorarioItemDto } from './horario-item.dto';

export class SolicitudResponseDto {
  @ApiProperty({
    description: 'UUID de la solicitud creada',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'UUID del estudiante extraído del JWT',
    example: 'test-user-123',
  })
  estudianteId: string;

  @ApiProperty({
    description: 'UUID de la oferta de tutoría',
    example: '550e8400-e29b-41d4-a716-446655440099',
    format: 'uuid',
  })
  ofertaId: string;

  @ApiProperty({
    description: 'UUID del tutor resuelto automáticamente desde la oferta',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  tutorId: string;

  @ApiProperty({
    description: 'Mensaje del estudiante dirigido al tutor',
    example:
      'Necesito apoyo con los temas de límites y derivadas. Tengo examen la próxima semana.',
  })
  mensaje: string;

  @ApiPropertyOptional({
    description:
      'Modalidad de la tutoría. Asignada automáticamente si la oferta es de modalidad única.',
    example: 'Virtual',
    nullable: true,
  })
  modalidad: string | null;

  @ApiProperty({
    description: 'Bloques horarios propuestos por el estudiante',
    type: [HorarioItemDto],
    example: [
      { fecha: '2026-04-15', hora: '10:00' },
      { fecha: '2026-04-16', hora: '14:00' },
    ],
  })
  horarios: HorarioItemDto[];

  @ApiProperty({
    description: 'Estado actual de la solicitud',
    enum: SolicitudEstado,
    example: SolicitudEstado.PENDIENTE,
  })
  estado: SolicitudEstado;

  @ApiProperty({
    description: 'Fecha y hora de creación de la solicitud (ISO 8601)',
    example: '2026-04-14T18:30:00.000Z',
  })
  createdAt: string;
}
