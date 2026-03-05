import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsIn,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
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
      'Modalidades a filtrar separadas por coma. Valores permitidos: PRESENCIAL, VIRTUAL, VIRTUAL/PRESENCIAL (también se acepta AMBOS como alias de VIRTUAL/PRESENCIAL)',
    example: 'PRESENCIAL,AMBOS',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => {
          const trimmed = v.trim();
          // Alias: AMBOS (frontend legacy) → VIRTUAL/PRESENCIAL
          if (trimmed.toUpperCase() === 'AMBOS') return 'VIRTUAL/PRESENCIAL';
          // Búsqueda case-insensitive para aceptar variantes del enum
          return (
            VALID_MODALITIES.find(
              (m) => m.toLowerCase() === trimmed.toLowerCase(),
            ) ?? trimmed
          );
        })
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

  @ApiPropertyOptional({
    type: String,
    description:
      'Día de la semana para filtrar por disponibilidad del tutor. Valores: Lun, Mar, Mié, Jue, Vie, Sáb, Dom',
    example: 'Lun',
  })
  @IsOptional()
  @IsString({ message: 'disponibilidad debe ser un texto válido.' })
  @IsIn(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], {
    message:
      'disponibilidad debe ser uno de: Lun, Mar, Mié, Jue, Vie, Sáb, Dom',
  })
  disponibilidad?: string;
}
