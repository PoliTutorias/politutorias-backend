import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export enum ModalidadConfirmacion {
  VIRTUAL = 'Virtual',
  PRESENCIAL = 'Presencial',
}

export class AcceptSolicitudDto {
  @IsOptional()
  @IsString()
  solicitudId?: string;

  @IsEnum(ModalidadConfirmacion, {
    message: 'modalidad debe ser Virtual o Presencial',
  })
  modalidad: ModalidadConfirmacion | string;

  @ValidateIf((o: AcceptSolicitudDto) => String(o.modalidad) === 'Virtual')
  @IsOptional()
  @IsUrl({}, { message: 'Ingresa una URL válida' })
  @IsNotEmpty({
    message: 'El link de reunión es requerido para modalidad Virtual',
  })
  acceptedMeetingLink?: string | null;

  @ValidateIf((o: AcceptSolicitudDto) => String(o.modalidad) === 'Presencial')
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Mínimo 10 caracteres' })
  @MaxLength(100, { message: 'Máximo 100 caracteres' })
  @IsNotEmpty({
    message: 'La ubicación es requerida para modalidad Presencial',
  })
  acceptedMeetingLocation?: string | null;
}
