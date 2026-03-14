import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class FilterParamsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado. RESPONDIDA = ACEPTADA + RECHAZADA',
    enum: ['PENDIENTE', 'EXPIRADA', 'RESPONDIDA'],
  })
  @IsOptional()
  @IsIn(['PENDIENTE', 'EXPIRADA', 'RESPONDIDA'], {
    message: 'status debe ser PENDIENTE, EXPIRADA o RESPONDIDA',
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
    description: 'Registros por página (máximo 100)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un entero' })
  @Min(1, { message: 'limit debe ser al menos 1' })
  @Max(100, { message: 'limit no puede superar 100' })
  limit?: number = 10;
}
