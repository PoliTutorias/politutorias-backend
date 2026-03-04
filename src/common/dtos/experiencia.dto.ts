import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExperienciaDto {
  @ApiProperty({ example: 'Profesor de Cálculo I' })
  @IsString({ message: 'El puesto debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El puesto es requerido.' })
  puesto: string;

  @ApiProperty({ example: 'Universidad Nacional' })
  @IsString({ message: 'La institución debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La institución es requerida.' })
  institucion: string;

  @ApiProperty({ example: '08/2020' })
  @IsString({ message: 'La fecha de inicio debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La fecha de inicio es requerida.' })
  @Matches(/^(0[1-9]|1[0-2])\/\d{4}$/, {
    message: 'Formato de fecha MM/AAAA inválido para fecha de inicio.',
  })
  @MaxLength(7, {
    message: 'Máximo 7 caracteres para fecha de inicio (MM/AAAA).',
  })
  fechaInicio: string;

  @ApiPropertyOptional({ example: 'Presente' })
  @IsOptional()
  @IsString({ message: 'La fecha de fin debe ser una cadena de texto.' })
  @Matches(/^((0[1-9]|1[0-2])\/\d{4}|Presente)$/, {
    message: 'Máximo 7 caracteres (MM/AAAA) o "Presente" (8 caracteres).',
  })
  @MaxLength(9, {
    message: 'Máximo 7 caracteres (MM/AAAA) o "Presente" (8 caracteres).',
  })
  fechaFin?: string;
}
