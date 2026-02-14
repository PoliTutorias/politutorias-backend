import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OfertasService } from './ofertas.service';
import { OfertaDto } from './dto/oferta.dto';

/**
 * Controller dedicado a HU02: Obtener ofertas por tutor
 * Ruta base: /api/tutor
 */
@ApiTags('ofertas')
@Controller('api/tutor')
export class TutorOfertasController {
  constructor(private readonly ofertasService: OfertasService) {}

  /**
   * HU02: Obtiene todas las ofertas de un tutor específico.
   *
   * @route GET /api/tutor/:tutorId/ofertas
   * @param tutorId - UUID del tutor (validado por ParseUUIDPipe)
   * @returns Array de OfertaDto
   */
  @Get(':tutorId/ofertas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener ofertas de un tutor específico',
    description:
      'Retorna todas las ofertas publicadas por un tutor identificado por su UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ofertas del tutor obtenida exitosamente',
    type: [OfertaDto],
  })
  @ApiResponse({
    status: 400,
    description: 'UUID de tutor inválido',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (uuid is expected)',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
      },
    },
  })
  async findAllByTutorId(
    @Param('tutorId', ParseUUIDPipe) tutorId: string,
  ): Promise<OfertaDto[]> {
    return this.ofertasService.findAllByTutorId(tutorId);
  }

  /**
   * Maneja el caso cuando tutorId está vacío o no se proporciona.
   * Retorna 400 Bad Request para mantener consistencia con el contrato.
   *
   * @route GET /api/tutor//ofertas (cuando tutorId está vacío)
   */
  @Get('/ofertas')
  @HttpCode(HttpStatus.BAD_REQUEST)
  handleEmptyTutorId() {
    return {
      statusCode: 400,
      message: 'Validation failed (uuid is expected)',
      error: 'Bad Request',
    };
  }
}
