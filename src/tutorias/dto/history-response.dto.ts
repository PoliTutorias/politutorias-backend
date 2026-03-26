import { ApiProperty } from '@nestjs/swagger';
import { HistorySummaryDto } from './history-summary.dto';
import { PaginatedHistoryDto } from './paginated-history.dto';

export class HistoryResponseDto {
  @ApiProperty({
    description: 'Resumen de métricas',
    type: HistorySummaryDto,
  })
  summary: HistorySummaryDto;

  @ApiProperty({
    description: 'Datos paginados del historial',
    type: PaginatedHistoryDto,
  })
  paginatedData: PaginatedHistoryDto;
}
