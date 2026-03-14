import { ApiProperty } from '@nestjs/swagger';

export class GlobalCountsDto {
  @ApiProperty({ description: 'Solicitudes en estado PENDIENTE', example: 5 })
  pending: number;

  @ApiProperty({ description: 'Solicitudes en estado EXPIRADA', example: 2 })
  expired: number;

  @ApiProperty({
    description: 'Solicitudes respondidas (ACEPTADA + RECHAZADA)',
    example: 3,
  })
  responded: number;
}
