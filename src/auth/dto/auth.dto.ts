import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'Juan Carlos Pérez',
    description: 'Nombre completo del usuario',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres.' })
  name: string;

  @ApiProperty({
    example: 'juan.perez@epn.edu.ec',
    description: 'Correo electrónico (único)',
  })
  @IsEmail({}, { message: 'Ingresa un correo electrónico válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  email: string;

  @ApiProperty({
    example: 'MiContraseña123',
    description: 'Contraseña (mínimo 6 caracteres)',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'juan.perez@epn.edu.ec' })
  @IsEmail({}, { message: 'Ingresa un correo electrónico válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  email: string;

  @ApiProperty({ example: 'MiContraseña123' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  password: string;
}

export class AuthResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  user: {
    id: string;
    name: string;
    email: string;
    isTutor: boolean;
    tutorId?: string;
  };
}
