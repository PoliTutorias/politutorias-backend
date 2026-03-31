import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class HistorialEstudianteQueryDto {
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
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un entero' })
  @Min(1, { message: 'limit debe ser al menos 1' })
  @Max(100, { message: 'limit no puede superar 100' })
  limit?: number = 5;
}
