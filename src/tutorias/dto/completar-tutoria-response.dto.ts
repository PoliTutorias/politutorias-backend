import { ApiProperty } from '@nestjs/swagger';

class CompletarTutoriaDataDto {
  @ApiProperty({
    description: 'ID de la tutoría',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Estado de la tutoría',
    example: 'COMPLETADA',
  })
  status: string;

  @ApiProperty({
    description: 'Fecha de actualización',
    example: '2024-05-20T14:30:00.000Z',
  })
  updatedAt: string;
}

export class CompletarTutoriaResponseDto {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Tutoría marcada como completada exitosamente.',
  })
  message: string;

  @ApiProperty({
    description: 'Datos de la tutoría actualizada',
    type: CompletarTutoriaDataDto,
  })
  data: CompletarTutoriaDataDto;
}
