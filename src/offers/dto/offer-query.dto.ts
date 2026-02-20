import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsArray,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OfferQueryDto {
  @ApiPropertyOptional({
    description: 'Número de página (1-based)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'page must not be less than 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de resultados por página (máximo 100)',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100, { message: 'limit must not be greater than 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrar por modalidad de la oferta',
    example: 'Virtual',
    enum: ['Virtual', 'Presencial', 'Virtual/Presencial', 'Híbrida'],
  })
  @IsOptional()
  @IsString()
  modality?: string;

  /**
   * Acepta uno o varios query params con el mismo nombre.
   * ?areaConocimiento=A          → ['A']
   * ?areaConocimiento=A&areaConocimiento=B → ['A', 'B']
   */
  @ApiPropertyOptional({
    description:
      'Filtrar por una o varias áreas de conocimiento (AND lógico). ' +
      'Repita el parámetro para indicar múltiples áreas.',
    type: [String],
    example: ['Matemáticas', 'Cálculo'],
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value) ? value : [value],
  )
  @IsArray()
  @IsString({ each: true })
  areaConocimiento?: string[];

  @ApiPropertyOptional({
    description: 'Precio mínimo de la oferta (en USD)',
    minimum: 0,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Precio máximo de la oferta (en USD)',
    minimum: 0,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Campo por el que ordenar los resultados',
    enum: ['price', 'rating', 'createdAt'],
    example: 'price',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento',
    enum: ['asc', 'desc'],
    default: 'asc',
    example: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;
}
