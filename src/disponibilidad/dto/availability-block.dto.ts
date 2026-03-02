import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AvailabilityBlockDto {
  @ApiProperty({
    example: 'Lun',
    description: 'Día de la semana. Valores: Lun, Mar, Mié, Jue, Vie, Sáb, Dom',
  })
  @IsString({ message: 'El día debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El día no puede estar vacío.' })
  day: string;

  @ApiProperty({
    example: '09:00',
    description: 'Hora en formato HH:mm (24 horas)',
  })
  @IsString({ message: 'La hora debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La hora no puede estar vacía.' })
  hour: string;
}
