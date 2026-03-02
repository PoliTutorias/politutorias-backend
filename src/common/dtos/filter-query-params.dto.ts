import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class FilterQueryParams {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'minPrice debe ser un número válido.' })
  @Min(0, { message: 'minPrice no puede ser negativo.' })
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'maxPrice debe ser un número válido.' })
  @IsPositive({ message: 'maxPrice debe ser un número positivo.' })
  maxPrice?: number;
}
