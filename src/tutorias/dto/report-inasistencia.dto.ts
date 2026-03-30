import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta del endpoint POST /api/tutorias/:id/inasistencia
 *
 * PRD HU-48 §7 — Contrato de Datos:
 * {
 *   "success": true,
 *   "message": "Inasistencia del estudiante registrada con éxito.",
 *   "data": {
 *     "id": "uuid-v4",
 *     "status": "no-show",
 *     "updatedAt": "2024-05-24T..."
 *   }
 * }
 */
export class ReportInasistenciaResponseDto {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Inasistencia del estudiante registrada con éxito.',
  })
  message: string;

  @ApiProperty({
    description: 'Datos de la tutoría actualizada',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440000',
      },
      status: {
        type: 'string',
        example: 'no-show',
        description: 'Estado actualizado en base de datos (formato frontend)',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-05-24T10:00:00.000Z',
      },
    },
  })
  data: {
    id: string;
    status: string;
    updatedAt: string;
  };
}
