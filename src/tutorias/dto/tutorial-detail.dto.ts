import { ApiProperty } from '@nestjs/swagger';

class StudentInfoDto {
  @ApiProperty({
    description: 'Nombre del estudiante',
    example: 'Juan Pérez',
  })
  name: string;

  @ApiProperty({
    description:
      'Avatar del estudiante (generado automáticamente con UI Avatars)',
    example:
      'https://ui-avatars.com/api/?name=Juan+Pérez&background=0D8ABC&color=fff&size=128&bold=true&rounded=true',
  })
  avatar: string;
}

export class TutorialDetailDto {
  @ApiProperty({
    description: 'ID de la tutoría',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Información del estudiante',
    type: StudentInfoDto,
  })
  student: StudentInfoDto;

  @ApiProperty({
    description: 'Materia de la tutoría',
    example: 'Cálculo Diferencial',
  })
  subject: string;

  @ApiProperty({
    description: 'Fecha de la tutoría',
    example: '20 de mayo, 2024',
  })
  date: string;

  @ApiProperty({
    description: 'Hora de la tutoría',
    example: '14:00 - 15:00',
  })
  time: string;

  @ApiProperty({
    description: 'Modalidad de la tutoría',
    example: 'Virtual',
  })
  modality: string;

  @ApiProperty({
    description: 'Link de reunión (solo para Virtual)',
    example: 'https://zoom.us/...',
    nullable: true,
  })
  meetingLink: string | null;

  @ApiProperty({
    description: 'Ubicación de reunión (solo para Presencial)',
    example: 'Biblioteca Central, Sala 3',
    nullable: true,
  })
  location: string | null;

  @ApiProperty({
    description: 'Precio por hora',
    example: '$15/h',
  })
  pricePerHour: string;

  @ApiProperty({
    description: 'Mensaje del estudiante',
    example: 'Necesito ayuda con límites y derivadas',
  })
  studentMessage: string;
}
