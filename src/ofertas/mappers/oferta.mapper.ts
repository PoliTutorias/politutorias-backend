import { Injectable } from '@nestjs/common';
import { Oferta } from '../domain/entities/oferta.entity';
import { OfertaResponseDto } from '../dto/oferta-response.dto';
import { TutorResponseDto } from '../dto/tutor-response.dto';

/**
 * Mapper sin estado que transforma una entidad `Oferta` en su DTO de respuesta.
 *
 * Responsabilidad única (SRP): conversión de entidad → DTO, incluyendo:
 *  - Renombrado de campos de inglés (entidad) a español (contrato REST)
 *  - `Oferta.title`     → `OfertaResponseDto.titulo`
 *  - `Oferta.price`     → `OfertaResponseDto.precio`  (parseFloat)
 *  - `Oferta.modality`  → `OfertaResponseDto.modalidad`
 *  - `Oferta.description` → `OfertaResponseDto.descripcion`
 *  - `Tutor.name`       → `TutorResponseDto.nombre`
 *  - `Tutor.photoUrl`   → `TutorResponseDto.fotoUrl`
 *  - `Tutor.email`      → `TutorResponseDto.contacto`
 *  - `Date`             → ISO 8601 string
 *
 * Campos aún no presentes en la entidad actual (`carrera`, `lugarReunion`,
 * `imagenRepresentativaUrl`) se exponen como `null` hasta que la entidad
 * sea extendida.
 */
@Injectable()
export class OfertaMapper {
  /**
   * Convierte una entidad `Oferta` (con relación `tutor` cargada) al DTO de respuesta.
   *
   * @param oferta - Entidad recuperada del repositorio con `relations: ['tutor']`
   * @returns `OfertaResponseDto` listo para serializar en la respuesta HTTP
   */
  toResponseDto(oferta: Oferta): OfertaResponseDto {
    const tutor: TutorResponseDto | null = oferta.tutor
      ? {
          id: oferta.tutor.id,
          nombre: oferta.tutor.nombreCompleto,
          fotoUrl: null,
          contacto: oferta.tutor.numeroWhatsapp ?? null,
        }
      : null;

    return {
      id: oferta.id,
      titulo: oferta.titulo || oferta.title || '',
      carrera: null, // campo aún no presente en la entidad actual
      modalidad: oferta.modalidad || oferta.modality || '',
      descripcion: oferta.descripcion || oferta.description || '',
      lugarReunion: null, // campo aún no presente en la entidad actual
      precio: parseFloat(String(oferta.precioHora ?? oferta.price ?? 0)),
      tutor,
      imagenRepresentativaUrl: null, // campo aún no presente en la entidad actual
      createdAt: oferta.createdAt?.toISOString() ?? '',
      updatedAt: oferta.updatedAt?.toISOString() ?? '',
    };
  }
}
