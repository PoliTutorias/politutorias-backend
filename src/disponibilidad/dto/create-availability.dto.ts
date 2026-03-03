import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  ValidationOptions,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AvailabilityBlockDto } from './availability-block.dto';

// Validador personalizado para mensaje específico de array mínimo
function CustomArrayMinSize(
  minSize: number,
  validationOptions?: ValidationOptions,
) {
  return function (target: object, propertyName: string) {
    const message = `Se debe seleccionar al menos un horario disponible.`;
    return ArrayMinSize(minSize, {
      message,
      ...validationOptions,
    })(target, propertyName);
  };
}

export class CreateAvailabilityDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description:
      'UUID del tutor. Nota: Se ignora si está presente un JWT válido.',
  })
  @IsString({ message: 'El tutorId debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El tutorId no puede estar vacío.' })
  tutorId: string;

  @ApiProperty({
    type: [AvailabilityBlockDto],
    description: 'Lista de bloques horarios disponibles para el tutor',
    example: [
      {
        day: 'Lun',
        hour: '09:00',
      },
      {
        day: 'Mié',
        hour: '14:00',
      },
    ],
  })
  @IsArray({ message: 'Blocks debe ser un array.' })
  @CustomArrayMinSize(1)
  @ValidateNested({ each: true, message: 'Cada bloque debe ser válido.' })
  @Type(() => AvailabilityBlockDto)
  blocks: AvailabilityBlockDto[];
}
