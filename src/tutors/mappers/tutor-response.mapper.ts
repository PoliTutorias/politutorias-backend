import { ApiProperty } from '@nestjs/swagger';
import { Tutor } from '../entities/tutor.entity';

/**
 * Clase DTO de respuesta documentada con Swagger.
 * Refleja exactamente el contrato HTTP acordado con el frontend.
 */
export class TutorResponseDto {
  @ApiProperty({
    example: 'uuid-v4',
    description: 'Identificador único del perfil',
  })
  id: string;

  @ApiProperty({
    example: 'auth0|abc123',
    description: 'ID del usuario autenticado',
  })
  userId: string;

  @ApiProperty({ example: 'Juan Carlos Pérez' })
  nombreCompleto: string;

  @ApiProperty({ example: '3001234567' })
  numeroWhatsapp: string;

  @ApiProperty({ example: 'FIS - Sistemas' })
  facultad: string;

  @ApiProperty({ example: '5° Semestre' })
  semestreActual: string;

  @ApiProperty({
    example: 'Tutor con experiencia en cálculo y álgebra lineal.',
  })
  biografiaCorta: string;

  @ApiProperty({
    example: 'https://storage.example.com/fotos/tutor-abc123.jpg',
    nullable: true,
    required: false,
  })
  fotoPerfil: string | null;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date | string;

  @ApiProperty({ example: '2026-02-01T00:00:00.000Z' })
  updatedAt: Date | string;
}

/**
 * Mapper entre TutorEntity y la estructura de respuesta para el frontend.
 * Punto de extensión: si el contrato de respuesta evoluciona, sólo
 * se modifica este archivo, sin tocar la entidad ni el UseCase.
 * — Principio de Responsabilidad Única (SRP)
 */
export class TutorResponseMapper {
  static toResponseDto(tutor: Tutor): TutorResponseDto {
    return {
      id: tutor.id,
      userId: tutor.userId,
      nombreCompleto: tutor.nombreCompleto,
      numeroWhatsapp: tutor.numeroWhatsapp,
      facultad: tutor.facultad,
      semestreActual: tutor.semestreActual,
      biografiaCorta: tutor.biografiaCorta,
      fotoPerfil: tutor.fotoPerfil ?? null,
      createdAt: tutor.createdAt,
      updatedAt: tutor.updatedAt,
    };
  }
}
