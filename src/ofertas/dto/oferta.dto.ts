/**
 * DTO para la respuesta de ofertas según el contrato de HU02.
 *
 * Representa la estructura de datos que se retorna al frontend.
 * Los campos están mapeados desde la entidad Oferta:
 * - modality → isPresencial (boolean)
 * - price → pricePerHour (number)
 * - categories → tags (string[])
 */
export class OfertaDto {
  id: string;
  title: string;
  description: string;
  isPresencial: boolean;
  pricePerHour: number;
  tags: string[];
  createdAt: string;
}
