import { ApiProperty } from '@nestjs/swagger';
import { SolicitudDetailsResponseDto } from './solicitud-details-response.dto';

export class PaginatedSolicitudesDto {
  @ApiProperty({ type: [SolicitudDetailsResponseDto] })
  data: SolicitudDetailsResponseDto[];

  @ApiProperty({
    description: 'Total de registros que coinciden con el filtro',
    example: 25,
  })
  total: number;

  @ApiProperty({ description: 'Página actual', example: 1 })
  currentPage: number;

  @ApiProperty({ description: 'Registros por página', example: 10 })
  itemsPerPage: number;

  @ApiProperty({ description: 'Total de páginas', example: 3 })
  totalPages: number;
}
