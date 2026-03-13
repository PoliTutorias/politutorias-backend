import {
  IsUUID,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { HorarioItemDto } from './horario-item.dto';

export class VerificarPreviaDto {
  @ApiProperty({
    description: 'UUID de la oferta de tutoría a verificar',
    example: '550e8400-e29b-41d4-a716-446655440099',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  ofertaId: string;

  @ApiProperty({
    description:
      'Bloques horarios a verificar si ya están ocupados por una solicitud PENDIENTE.',
    type: [HorarioItemDto],
    example: [{ fecha: '2026-04-15', hora: '10:00' }],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HorarioItemDto)
  horarios: HorarioItemDto[];
}
