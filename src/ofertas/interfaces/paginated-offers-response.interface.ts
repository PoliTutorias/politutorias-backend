/**
 * Interfaz para la información básica del tutor dentro de una respuesta de oferta.
 *
 * Nota: `photo` mapea desde `Tutor.photoUrl` en la capa de servicio.
 */
export interface TutorResponse {
  id: string;
  name: string;
  photo: string;
}

/**
 * Interfaz que define el contrato de una oferta individual en la respuesta HTTP.
 *
 * Contratos importantes:
 *  - `price`     : número de punto flotante (parseFloat del decimal de la BD)
 *  - `tags`      : mapeado desde `Oferta.categories`
 *  - `tutor`     : puede ser `null` si la oferta no tiene tutor asociado
 *  - `createdAt` : ISO 8601 string (e.g. "2023-10-27T10:30:00.000Z")
 */
export interface OfferResponse {
  id: string;
  title: string;
  price: number;
  modality: string;
  description: string;
  tags: string[];
  rating: number;
  reviewsCount: number;
  tutor: TutorResponse | null;
  /** Fecha de creación en formato ISO 8601 string */
  createdAt: string;
}

/**
 * Interfaz de la respuesta paginada para el endpoint `GET /api/ofertas/search`.
 *
 * Contrato HTTP acordado con el frontend — NO modificar sin actualizar el frontend.
 */
export interface PaginatedOffersResponseInterface {
  offers: OfferResponse[];
  totalResults: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}
