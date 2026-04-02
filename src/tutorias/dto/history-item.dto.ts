import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HistoryItemDto {
  @ApiProperty({
    description: 'ID de la tutoría',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del estudiante',
    example: 'Juan Pérez',
  })
  studentName: string;

  @ApiProperty({
    description: 'Nombre de la materia',
    example: 'Cálculo Diferencial',
  })
  subjectName: string;

  @ApiProperty({
    description: 'Fecha de la tutoría',
    example: '2024-05-20',
  })
  date: string;

  @ApiProperty({
    description: 'Horario de la tutoría',
    example: '11:00',
  })
  time: string;

  @ApiProperty({
    description: 'Estado de la tutoría',
    example: 'Completada',
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
