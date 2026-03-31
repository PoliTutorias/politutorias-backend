import { ApiProperty } from '@nestjs/swagger';
import { HistorialEstudianteItemDto } from './historial-estudiante-item.dto';

class PaginatedEstudianteHistorialDto {
  @ApiProperty({ type: [HistorialEstudianteItemDto] })
  items: HistorialEstudianteItemDto[];

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 2 })
  lastPage: number;
}

export class HistorialEstudianteResponseDto {
  @ApiProperty({ type: PaginatedEstudianteHistorialDto })
  paginatedData: PaginatedEstudianteHistorialDto;
}
