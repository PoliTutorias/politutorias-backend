import { IsOptional, IsString, IsInt, Min, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para parámetros de consulta de búsqueda de ofertas (HU17)
 *
 * Permite buscar ofertas por término de búsqueda y paginar resultados.
 */
export class OffersQueryParams {
  @ApiPropertyOptional({
    description:
      'Término de búsqueda para filtrar ofertas por título o nombre del tutor',
    example: 'Cálculo',
    type: String,
  })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional({
    description: 'Número de página de resultados a recuperar',
    example: 1,
    minimum: 1,
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser al menos 1.' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de resultados por página',
    example: 10,
    minimum: 1,
    default: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero.' })
  @IsPositive({ message: 'El límite debe ser un número positivo.' })
  limit?: number = 10;
}
