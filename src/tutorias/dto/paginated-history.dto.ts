import { ApiProperty } from '@nestjs/swagger';
import { HistoryItemDto } from './history-item.dto';

export class PaginatedHistoryDto {
  @ApiProperty({
    description: 'Items de la página actual',
    type: [HistoryItemDto],
  })
  items: HistoryItemDto[];

  @ApiProperty({
    description: 'Total de registros',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Página actual',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Última página disponible',
    example: 5,
  })
  lastPage: number;
}
