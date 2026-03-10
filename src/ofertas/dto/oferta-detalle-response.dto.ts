/**
 * DTOs de respuesta para HU-32: Ver Detalles de la Oferta.
 *
 * El endpoint GET /api/ofertas/:id retorna un objeto con la estructura
 * definida en OfertaDetalleResponseDto.
 */

export class DisponibilidadItemDto {
  /** Abreviatura del día: 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom' */
  day: string;

  /** Hora en formato HH:MM, e.g. '14:00' */
  hour: string;
}

export class ExperienciaTutorDto {
  id: string;

  /** Cargo o puesto desempeñado, e.g. 'Profesor Auxiliar' */
  puesto: string;

  /** Institución donde se desempeñó, e.g. 'Universidad Central' */
  institucion: string;

  /** Fecha de inicio en formato 'YYYY-MM', e.g. '2022-03' */
  fechaInicio: string;

  /** Fecha de fin en formato 'YYYY-MM'. Null si es experiencia actual. */
  fechaFin: string | null;
}

export class MateriaTutorDto {
  id: string;

  /** Nombre de la materia dominada, e.g. 'Cálculo Diferencial' */
  nombre: string;
}

export class TutorDetalleDto {
  id: string;
  nombreCompleto: string;
  fotoPerfil: string | null;

  /** Semestre actual del tutor (valor del enum Semestres) */
  semestreActual: string;

  /** Calificación promedio en escala 0-5 */
  calificacionPromedio: number;

  /** Número total de reseñas recibidas */
  numResenas: number;

  /** Biografía corta del tutor */
  biografiaCorta: string;

  /** Número de WhatsApp del tutor, e.g. '+593991234567' */
  numeroWhatsapp: string;

  experiencias: ExperienciaTutorDto[];
  materias: MateriaTutorDto[];
}

/**
 * DTO principal de respuesta para el detalle de una oferta de tutoría.
 * Contiene los datos de la oferta y los datos embebidos del tutor.
 *
 * Nota (RN-04): El frontend puede descartar las secciones del tutor en
 * esta vista, pero el backend los incluye en el contrato para otras HUs.
 */
export class OfertaDetalleResponseDto {
  id: string;
  title: string;
  modality: string;
  description: string;

  /** Categorías de la oferta, e.g. ['Matemáticas', 'Formación Básica'] */
  categories: string[];

  /** Precio por hora en USD con 2 decimales (RN-05) */
  price: number;

  /** Calificación promedio de la oferta */
  rating: number;

  /** Número de reseñas de la oferta */
  reviewsCount: number;

  /** Disponibilidad semanal del tutor, formato HH:MM (RN-06) */
  availability: DisponibilidadItemDto[];

  /** Datos del tutor asociado a la oferta */
  tutor: TutorDetalleDto | null;
}
