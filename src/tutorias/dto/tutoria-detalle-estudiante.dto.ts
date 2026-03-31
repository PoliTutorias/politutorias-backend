import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class TutorInfoDto {
  @ApiProperty({ example: 'Carlos López' })
  name: string;

  @ApiProperty({
    example:
      'https://ui-avatars.com/api/?name=Carlos+Lopez&background=0D8ABC&color=fff&size=128&bold=true&rounded=true',
  })
  avatar: string;
}

class ReviewInfoDto {
  @ApiProperty({ example: 4 })
  rating: number;

  @ApiPropertyOptional({ example: 'Excelente tutor, muy paciente.' })
  comment: string | null;

  @ApiProperty({ example: '2026-04-16T10:00:00.000Z' })
  createdAt: string;
}

export class TutoriaDetalleEstudianteDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ type: TutorInfoDto })
  tutor: TutorInfoDto;

  @ApiProperty({ example: 'Cálculo Diferencial' })
  subject: string;

  @ApiProperty({ example: '15 de abril, 2026' })
  date: string;

  @ApiProperty({ example: '14:00 - 15:00' })
  time: string;

  @ApiProperty({ example: 'Virtual' })
  modality: string;

  @ApiPropertyOptional({ example: 'https://zoom.us/j/123' })
  meetingLink: string | null;

  @ApiPropertyOptional({ example: 'Biblioteca Central, Sala 3' })
  location: string | null;

  @ApiProperty({ example: '$15/h' })
  pricePerHour: string;

  @ApiProperty({ example: 'Necesito ayuda con límites' })
  studentMessage: string;

  @ApiProperty({ example: 'Completada', enum: ['Completada', 'INASISTENCIA'] })
  status: string;

  @ApiPropertyOptional({ type: ReviewInfoDto, nullable: true })
  review: ReviewInfoDto | null;
}
