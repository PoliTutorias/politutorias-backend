import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RejectionReason } from '../entities/solicitud.entity';

export class RejectSolicitudDto {
  @ApiProperty({
    description: 'Motivo de rechazo',
    enum: RejectionReason,
    example: RejectionReason.CONFLICTO_HORARIOS,
  })
  @IsEnum(RejectionReason, { message: 'reason debe ser un motivo válido' })
  reason: RejectionReason;

  @ApiPropertyOptional({
    description: 'Comentario adicional (máximo 300 caracteres)',
    example: 'Tengo una clase presencial a esa misma hora.',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300, {
    message: 'El comentario no puede superar los 300 caracteres',
  })
  comment?: string;
}
