import { ApiProperty } from '@nestjs/swagger';
import { StudentSolicitudListItemDto } from './student-solicitud-list-item.dto';

/**
 * DTO para respuesta paginada de solicitudes (perspectiva estudiante - HU-33)
 */
export class PaginatedStudentSolicitudesDto {
  @ApiProperty({
    type: [StudentSolicitudListItemDto],
    description: 'Lista de solicitudes enviadas por el estudiante',
  })
  data: StudentSolicitudListItemDto[];

  @ApiProperty({
    description: 'Total de registros que coinciden con el filtro',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Página actual',
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    description: 'Registros por página',
    example: 5,
  })
  itemsPerPage: number;

  @ApiProperty({
    description: 'Total de páginas',
    example: 5,
  })
  totalPages: number;
}
