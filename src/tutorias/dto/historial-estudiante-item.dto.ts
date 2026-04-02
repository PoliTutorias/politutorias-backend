import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HistorialEstudianteItemDto {
  @ApiProperty({
    description: 'ID de la tutoría',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del tutor',
    example: 'Carlos López',
  })
  tutorName: string;

  @ApiProperty({
    description: 'Nombre de la materia (título de la oferta)',
    example: 'Cálculo Diferencial',
  })
  subjectName: string;

  @ApiProperty({
    description: 'Fecha de la tutoría',
    example: '2026-04-15',
  })
  date: string;

  @ApiProperty({
    description: 'Hora de la tutoría',
    example: '14:00',
  })
  time: string;

  @ApiProperty({
    description: 'Estado de la tutoría',
    example: 'Completada',
    enum: ['Completada', 'INASISTENCIA'],
  })
  status: string;

  @ApiProperty({
    description: 'Precio por hora',
    example: '$15/h',
  })
  pricePerHour: string;

  @ApiPropertyOptional({
    description: 'Ubicación de reunión (solo para Presencial)',
    example: 'Biblioteca Central, Sala 3',
    nullable: true,
  })
  location: string | null;
}
