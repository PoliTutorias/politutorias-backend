import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum Facultades {
  FIS_SISTEMAS = 'FIS - Sistemas',
  FCEC = 'FCEC',
  FIAL = 'FIAL',
  FCBT = 'FCBT',
  FCCMH = 'FCCMH',
  FCEF = 'FCEF',
}

export enum Semestres {
  PRIMERO = '1° Semestre',
  SEGUNDO = '2° Semestre',
  TERCERO = '3° Semestre',
  CUARTO = '4° Semestre',
  QUINTO = '5° Semestre',
  SEXTO = '6° Semestre',
  SEPTIMO = '7° Semestre',
  OCTAVO = '8° Semestre',
  NOVENO = '9° Semestre',
  DECIMO = '10° Semestre',
}

export class RegistrarDatosBasicosDto {
  @ApiProperty({
    description: 'Nombre completo del tutor (solo letras y espacios)',
    example: 'Juan Carlos Pérez',
    minLength: 3,
    maxLength: 60,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
  @MaxLength(60, { message: 'El nombre no debe exceder los 60 caracteres.' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, {
    message: 'El nombre solo puede contener letras y espacios.',
  })
  nombreCompleto: string;

  @ApiProperty({
    description: 'Número de WhatsApp (solo dígitos, entre 10 y 13 dígitos)',
    example: '3001234567',
    minLength: 10,
    maxLength: 13,
  })
  @IsNotEmpty({ message: 'El número de WhatsApp es obligatorio.' })
  @IsNumberString(
    {},
    { message: 'El número de WhatsApp solo debe contener dígitos.' },
  )
  @MinLength(10, {
    message: 'El número de WhatsApp debe tener entre 10 y 13 dígitos.',
  })
  @MaxLength(13, {
    message: 'El número de WhatsApp debe tener entre 10 y 13 dígitos.',
  })
  numeroWhatsapp: string;

  @ApiProperty({
    description: 'Facultad a la que pertenece el tutor',
    enum: Facultades,
    example: Facultades.FIS_SISTEMAS,
  })
  @IsNotEmpty({ message: 'La facultad es obligatoria.' })
  @IsEnum(Facultades, { message: 'Selecciona una facultad válida.' })
  facultad: Facultades;

  @ApiProperty({
    description: 'Semestre actual que cursa el tutor',
    enum: Semestres,
    example: Semestres.QUINTO,
  })
  @IsNotEmpty({ message: 'El semestre actual es obligatorio.' })
  @IsEnum(Semestres, { message: 'Selecciona un semestre válido.' })
  semestreActual: Semestres;

  @ApiProperty({
    description: 'Biografía corta del tutor (entre 20 y 300 caracteres)',
    example:
      'Tutor con más de tres años de experiencia en matemáticas y física universitaria.',
    minLength: 20,
    maxLength: 300,
  })
  @IsString({ message: 'La biografía debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La biografía es obligatoria.' })
  @MinLength(20, { message: 'La biografía debe tener al menos 20 caracteres.' })
  @MaxLength(300, {
    message: 'La biografía no debe exceder los 300 caracteres.',
  })
  biografiaCorta: string;

  @ApiProperty({
    description: 'URL de la fotografía de perfil del tutor',
    example: 'https://storage.example.com/fotos/tutor-abc123.jpg',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'La foto de perfil debe ser una cadena de texto.' })
  @IsUrl({}, { message: 'La foto de perfil debe ser una URL válida.' })
  fotoPerfil?: string;
}
