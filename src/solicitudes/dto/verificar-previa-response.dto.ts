import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerificarPreviaResponseDto {
  @ApiProperty({
    description:
      'Indica si ya existe una solicitud PENDIENTE con horario solapado para esta oferta',
    example: false,
  })
  existe: boolean;

  @ApiPropertyOptional({
    description:
      'Mensaje descriptivo cuando existe colisión. Null si no hay solicitud previa.',
    example:
      'Horario ya solicitado. Ya tienes una solicitud activa para este bloque.',
    nullable: true,
  })
  mensaje: string | null;
}
