import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExperienciaDto } from './experiencia.dto';

export class PerfilProfesionalDto {
  @ApiPropertyOptional({ type: [ExperienciaDto] })
  @IsOptional()
  @IsArray({ message: 'experiencias debe ser un array.' })
  @ValidateNested({
    each: true,
    message: 'Cada experiencia.puesto debe ser una cadena de texto.',
  })
  @Type(() => ExperienciaDto)
  experiencias?: ExperienciaDto[];

  @ApiPropertyOptional({ type: [String], example: ['Cálculo', 'Física'] })
  @IsOptional()
  @IsArray({ message: 'materias debe ser un array de textos.' })
  @IsString({
    each: true,
    message: 'Cada materia debe ser una cadena de texto.',
  })
  materias?: string[];
}
