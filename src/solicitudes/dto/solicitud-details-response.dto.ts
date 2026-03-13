import { ApiProperty } from '@nestjs/swagger';

export class SolicitudDetailsResponseDto {
  @ApiProperty({ description: 'UUID de la solicitud', example: 'uuid-123' })
  id: string;

  @ApiProperty({
    description: 'Nombre completo del estudiante',
    example: 'Ana García',
  })
  nombreEstudiante: string;

  @ApiProperty({
    description: 'Materia de la oferta',
    example: 'Cálculo Diferencial',
  })
  materia: string;

  @ApiProperty({
    description: 'Fecha y hora formateada (DD Mmm YYYY HH:mm)',
    example: '25 may 2024 10:30',
  })
  fechaHora: string;

  @ApiProperty({
    description:
      'Primeros 50 caracteres del mensaje seguido de "..." si es más largo',
    example: 'Necesito ayuda con los temas de límites y derivad...',
  })
  mensajeResumen: string;

  @ApiProperty({
    description: 'Estado de la solicitud',
    enum: ['PENDIENTE', 'EXPIRADA'],
    example: 'PENDIENTE',
  })
  estado: string;

  @ApiProperty({ description: 'Modalidad de la tutoría', example: 'Virtual' })
  modalidad: string;

  @ApiProperty({ description: 'Precio por hora de la oferta', example: 15.5 })
  precioHora: number;

  @ApiProperty({
    description: 'Mensaje completo del estudiante',
    example: 'Necesito ayuda con los temas de límites y derivadas.',
  })
  mensajeCompleto: string;
}
