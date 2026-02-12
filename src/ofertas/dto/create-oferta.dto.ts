import { IsString, IsNotEmpty, IsNumber, IsPositive, Min, MinLength, MaxLength, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOfertaDto {
  @ApiProperty({
    description: 'Título de la oferta de tutoría',
    example: 'Cálculo Vectorial',
    minLength: 3,
    maxLength: 80,
  })
  @IsString({ message: 'El título debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MinLength(3, { message: 'El título de la oferta debe tener al menos 3 caracteres.' })
  @MaxLength(80, { message: 'El título de la oferta debe tener como máximo 80 caracteres.' })
  title: string;

  @ApiProperty({
    description: 'Precio por hora de la tutoría en dólares',
    example: 10,
    minimum: 5,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio por hora debe ser un número.' })
  @IsPositive({ message: 'El precio por hora debe ser un valor positivo.' })
  @Min(5, { message: 'El precio mínimo por hora es de $5.' })
  price: number;

  @ApiProperty({
    description: 'Modalidad de la tutoría',
    example: 'Presencial',
    enum: ['Presencial', 'Virtual', 'Híbrida'],
  })
  @IsString({ message: 'La modalidad debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La modalidad es obligatoria.' })
  modality: string;

  @ApiProperty({
    description: 'Categorías temáticas de la tutoría',
    example: ['Matemáticas', 'Física'],
    type: [String],
    minItems: 1,
    maxItems: 5,
  })
  @IsArray({ message: 'Las categorías deben ser un array.' })
  @ArrayMinSize(1, { message: 'Debe seleccionar al menos una categoría.' })
  @ArrayMaxSize(5, { message: 'No puede seleccionar más de 5 categorías.' })
  @IsString({ each: true, message: 'Cada categoría debe ser una cadena de texto.' })
  categories: string[];

  @ApiProperty({
    description: 'Descripción detallada de la oferta de tutoría',
    example: 'Se enseñará cálculo vectorial, incluyendo integrales de línea y superficie.',
    minLength: 20,
    maxLength: 250,
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La descripción es obligatoria.' })
  @MinLength(20, { message: 'La descripción debe tener al menos 20 caracteres.' })
  @MaxLength(250, { message: 'La descripción debe tener como máximo 250 caracteres.' })
  description: string;
}
