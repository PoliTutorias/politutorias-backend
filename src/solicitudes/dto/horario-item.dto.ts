import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class HorarioItemDto {
  @ApiProperty({
    description: 'Fecha del horario solicitado en formato YYYY-MM-DD',
    example: '2026-04-15',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fecha debe tener formato YYYY-MM-DD',
  })
  fecha: string;

  @ApiProperty({
    description: 'Hora del bloque solicitado en formato HH:MM',
    example: '10:00',
    pattern: '^\\d{2}:\\d{2}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'hora debe tener formato HH:MM' })
  hora: string;
}
