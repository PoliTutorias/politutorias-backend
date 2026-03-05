import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';
import { OfferModality } from '../entities/oferta.entity';

const VALID_MODALITIES = Object.values(OfferModality);

/**
 * GetOfertasFilterDto — DTO combinado HU26 + HU27.
 *
 * - `modalidad`: lista de modalidades separadas por coma (ej. "PRESENCIAL,AMBOS").
 * - `minPrice` / `maxPrice`: rango de precio (HU27).
 */
export class GetOfertasFilterDto {
  @ApiPropertyOptional({
    type: String,
    description:
      'Modalidades a filtrar separadas por coma. Valores permitidos: PRESENCIAL, VIRTUAL, AMBOS',
    example: 'PRESENCIAL,AMBOS',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim().toUpperCase())
        .filter(Boolean);
    }
    return value as string[];
  })
  @IsArray()
  @IsIn(VALID_MODALITIES, {
    each: true,
    message: `Each modality must be one of the following values: ${VALID_MODALITIES.join(', ')}`,
  })
  modalidad?: string[];

  @ApiPropertyOptional({
    type: Number,
    description: 'Precio mínimo por hora en USD (>= 0)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'minPrice debe ser un número válido.' })
  @Min(0, { message: 'minPrice no puede ser negativo.' })
  minPrice?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Precio máximo por hora en USD (> 0)',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'maxPrice debe ser un número válido.' })
  @IsPositive({ message: 'maxPrice debe ser un número positivo.' })
  maxPrice?: number;
}
