import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { OfferQueryDto } from './dto/offer-query.dto';
import { PaginatedOffersResponse } from './interfaces/paginated-offers-response.interface';
import {
  PaginatedOffersResponseDto,
  OfferResponseItemDto,
  TutorInOfferResponseDto,
} from './dto/offer-response.swagger.dto';

/**
 * Controlador deliberadamente delgado: únicamente traduce HTTP → OffersService.
 * Contiene solo el límite de error mínimo necesario para garantizar el contrato HTTP.
 */
@ApiTags('offers')
@ApiExtraModels(
  PaginatedOffersResponseDto,
  OfferResponseItemDto,
  TutorInOfferResponseDto,
)
@Controller('api/offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  /**
   * HU03: GET /api/offers
   * Retorna ofertas paginadas con soporte de filtros y ordenamiento.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar ofertas de tutorías',
    description:
      'Retorna una lista paginada de ofertas. ' +
      'Soporta filtros por modalidad, áreas de conocimiento y rango de precios, ' +
      'así como ordenamiento por precio, rating o fecha de creación.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página (1-based, default 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Resultados por página (default 10, max 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'modality',
    required: false,
    type: String,
    description:
      'Modalidad: Virtual | Presencial | Virtual/Presencial | Híbrida',
    example: 'Virtual',
  })
  @ApiQuery({
    name: 'areaConocimiento',
    required: false,
    type: [String],
    description:
      'Una o más áreas de conocimiento (AND lógico). Repita el parámetro para múltiples valores.',
    example: ['Matemáticas', 'Cálculo'],
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Precio mínimo en USD',
    example: 10,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Precio máximo en USD',
    example: 20,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Campo de ordenamiento: price | rating | createdAt',
    example: 'price',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Dirección: asc | desc (default asc)',
    example: 'asc',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de ofertas obtenida exitosamente',
    type: PaginatedOffersResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Parámetros de consulta inválidos (e.g. page < 1, limit > 100, sortOrder distinto de "asc"/"desc")',
    schema: {
      example: {
        statusCode: 400,
        message: ['page must not be less than 1'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno al consultar la base de datos',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Error al consultar la base de datos.',
      },
    },
  })
  async findAll(
    @Query() query: OfferQueryDto,
  ): Promise<PaginatedOffersResponse> {
    try {
      return await this.offersService.findAll(query);
    } catch (error) {
      // Re-lanza HttpExceptions tal cual (400s del ValidationPipe, 500 propio del servicio…)
      if (error instanceof HttpException) {
        throw error;
      }
      // Error inesperado no gestionado → respuesta 500 con formato acordado con frontend
      throw new InternalServerErrorException(
        'Internal server error',
        'Error al consultar la base de datos.',
      );
    }
  }
}
