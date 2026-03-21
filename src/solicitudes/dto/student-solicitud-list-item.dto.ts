import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para un elemento de la lista de solicitudes (perspectiva estudiante - HU-33)
 */
export class StudentSolicitudListItemDto {
  @ApiProperty({
    description: 'UUID de la solicitud',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'URL del avatar del tutor',
    example: 'https://example.com/avatars/tutor.jpg',
    nullable: true,
  })
  tutorAvatarUrl: string | null;

  @ApiProperty({
    description: 'Nombre completo del tutor',
    example: 'Juan Pérez',
  })
  tutorName: string;

  @ApiProperty({
    description: 'Materia de la oferta',
    example: 'Cálculo Diferencial',
  })
  subject: string;

  @ApiProperty({
    description:
      'Fecha y hora del horario propuesto por el estudiante — horarios[0] (ISO 8601)',
    example: '2026-03-23T15:00:00.000Z',
  })
  date: string;

  @ApiProperty({
    description: 'Modalidad de la tutoría',
    enum: ['PRESENCIAL', 'VIRTUAL', 'VIRTUAL/PRESENCIAL'],
    example: 'Virtual',
  })
  modality: string;

  @ApiProperty({
    description: 'Precio por hora de la oferta',
    example: 20,
  })
  pricePerHour: number;

  @ApiProperty({
    description: 'Estado de la solicitud',
    enum: ['PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'EXPIRADA'],
    example: 'PENDIENTE',
  })
  status: string;
}
