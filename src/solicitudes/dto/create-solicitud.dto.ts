import {
  IsUUID,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HorarioItemDto } from './horario-item.dto';

export class CreateSolicitudDto {
  @ApiProperty({
    description: 'UUID de la oferta de tutoría a la que se envía la solicitud',
    example: '550e8400-e29b-41d4-a716-446655440099',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  ofertaId: string;

  @ApiProperty({
    description:
      'Mensaje del estudiante dirigido al tutor. Máximo 500 caracteres.',
    example:
      'Necesito apoyo con los temas de límites y derivadas. Tengo examen la próxima semana.',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: 'El mensaje no puede estar vacío' })
  @MaxLength(500, { message: 'El mensaje no puede superar los 500 caracteres' })
  mensaje: string;

  @ApiPropertyOptional({
    description:
      'Modalidad preferida por el estudiante. Requerida solo si la oferta tiene modalidad dual (VIRTUAL/PRESENCIAL).',
    example: 'Virtual',
    enum: ['Virtual', 'Presencial'],
  })
  @IsOptional()
  @IsString()
  modalidad?: string;

  @ApiProperty({
    description:
      'Lista de bloques horarios propuestos por el estudiante. Mínimo 1.',
    type: [HorarioItemDto],
    example: [
      { fecha: '2026-04-15', hora: '10:00' },
      { fecha: '2026-04-16', hora: '14:00' },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe seleccionar al menos un horario' })
  @ValidateNested({ each: true })
  @Type(() => HorarioItemDto)
  horarios: HorarioItemDto[];
}
