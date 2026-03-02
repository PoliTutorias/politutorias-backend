import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de respuesta para el Tutor embebido en la respuesta de una oferta.
 *
 * Mapea campos en español tal como los expone el contrato REST de HU27.
 */
export class TutorResponseDto {
  @ApiProperty({
    description: 'UUID del tutor',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre completo del tutor',
    example: 'Juan Carlos Pérez',
  })
  nombre: string;

  @ApiProperty({
    description: 'URL de la foto de perfil del tutor',
    example: 'https://randomuser.me/api/portraits/men/1.jpg',
    nullable: true,
  })
  fotoUrl: string | null;

  @ApiProperty({
    description: 'Correo electrónico de contacto',
    example: 'jcperez@poli.edu.ec',
    nullable: true,
  })
  contacto: string | null;
}
