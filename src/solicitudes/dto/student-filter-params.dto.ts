import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * DTO para parámetros de filtrado (perspectiva estudiante - HU-33)
 * Incluye TODAS como opción adicional a la perspectiva tutor
 */
export class StudentFilterParamsDto {
  @ApiPropertyOptional({
    description:
      'Filtrar por estado. RESPONDIDA = ACEPTADA + RECHAZADA. TODAS = sin filtro',
    enum: ['PENDIENTE', 'EXPIRADA', 'RESPONDIDA', 'TODAS'],
  })
  @IsOptional()
  @IsIn(['PENDIENTE', 'EXPIRADA', 'RESPONDIDA', 'TODAS'], {
    message: 'status debe ser PENDIENTE, EXPIRADA, RESPONDIDA o TODAS',
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'Número de página (mínimo 1)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un entero' })
  @Min(1, { message: 'page debe ser al menos 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description:
      'Registros por página (máximo 100, default 5 para estudiantes)',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un entero' })
  @Min(1, { message: 'limit debe ser al menos 1' })
  @Max(100, { message: 'limit no puede superar 100' })
  limit?: number = 5;
}
