import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateOfertaUseCase } from './application/use-cases/create-oferta.use-case';
import { GetAllOfertasUseCase } from './application/use-cases/get-all-ofertas.use-case';
import { Oferta } from './domain/entities/oferta.entity';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { GetOfertasFilterDto } from './dto/get-ofertas-filter.dto';
import { OfertaDetalleResponseDto } from './dto/oferta-detalle-response.dto';
import { OfertaItemDto, TutorBasicDto } from './dto/oferta-item.dto';
import { OfertaDto } from './dto/oferta.dto';
import { OffersQueryParams } from './dto/offers-query.dto';
import { PaginatedOffersResponse } from './dto/paginated-offers-response.dto';
import { OfertasService } from './ofertas.service';

const SUCCESS_MESSAGE = 'Oferta creada exitosamente';

interface CreateOfertaResponse {
  statusCode: number;
  message: string;
  data: Oferta;
}

/**
 * UUID del tutor "en cero" para crear ofertas.
 * Este tutor existe en la base de datos (creado por el seed).
 * IMPORTANTE: Mantener sincronizado con tutors.seed.ts -> ZERO_TUTOR_ID
 */
const ZERO_TUTOR_ID = '550e8400-e29b-41d4-a716-446655440000';

@ApiTags('ofertas')
@Controller('api/ofertas')
export class OfertasController {
  private readonly tutorId = ZERO_TUTOR_ID;

  constructor(
    private readonly createOfertaUseCase: CreateOfertaUseCase,
    private readonly getAllOfertasUseCase: GetAllOfertasUseCase,
    private readonly ofertasService: OfertasService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiExtraModels(OfertaItemDto, TutorBasicDto)
  @ApiOperation({
    summary:
      'Listar ofertas de tutoría con filtro por modalidad y/o rango de precio',
    description:
      'Obtiene ofertas de tutoría con filtros opcionales por `modalidad` (PRESENCIAL, VIRTUAL, VIRTUAL/PRESENCIAL) ' +
      'y por rango de precio (`minPrice`, `maxPrice`). Devuelve los datos del tutor embebidos en cada oferta.',
  })
  @ApiQuery({
    name: 'modalidad',
    required: false,
    type: String,
    description:
      'Modalidades a filtrar separadas por coma (ej. PRESENCIAL,VIRTUAL/PRESENCIAL)',
    example: 'PRESENCIAL,VIRTUAL/PRESENCIAL',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Precio mínimo inclusivo en USD (>= 0)',
    example: 10,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Precio máximo inclusivo en USD (> 0)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ofertas filtradas',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(OfertaItemDto) },
        },
        total: {
          type: 'integer',
          description: 'Número total de ofertas que coinciden con el filtro',
          example: 3,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Each modality must be one of the following values: PRESENCIAL, VIRTUAL, VIRTUAL/PRESENCIAL',
        ],
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
        message: 'Error interno al filtrar ofertas.',
        error: 'Internal Server Error',
      },
    },
  })
  async findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    filterDto: GetOfertasFilterDto,
  ): Promise<{ data: OfertaItemDto[]; total: number }> {
    return this.ofertasService.getFilteredOfertas(filterDto);
  }

  /**
   * HU17: Endpoint de búsqueda y paginación de ofertas.
   *
   * Permite buscar ofertas por término (título de oferta o nombre de tutor)
   * con soporte de paginación.
   */
  @Get('search')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Buscar ofertas de tutoría',
    description:
      'Busca ofertas de tutoría por término de búsqueda (título de oferta o nombre del tutor) con paginación. ' +
      'Si no se proporciona searchTerm, retorna todas las ofertas paginadas.',
  })
  @ApiQuery({
    name: 'searchTerm',
    required: false,
    type: String,
    description:
      'Término de búsqueda para filtrar por título de oferta o nombre de tutor',
    example: 'matemáticas',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (comienza en 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de resultados por página',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Búsqueda exitosa con resultados paginados',
    schema: {
      example: {
        offers: [
          {
            id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
            title: 'Cálculo Diferencial e Integral',
            price: 12.5,
            modality: 'Virtual',
            description:
              'Tutorías especializadas en límites, derivadas e integrales.',
            tags: ['Matemáticas', 'Cálculo'],
            rating: 4.8,
            reviewsCount: 24,
            tutor: {
              id: '550e8400-e29b-41d4-a716-446655440001',
              name: 'Juan Carlos Pérez',
              photo: 'https://randomuser.me/api/portraits/men/1.jpg',
            },
            createdAt: '2023-10-27T10:30:00.000Z',
          },
        ],
        totalResults: 3,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 1,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos (page < 1 o limit <= 0)',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'La página debe ser al menos 1.',
          'El límite debe ser un número positivo.',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor al consultar las ofertas',
    schema: {
      example: {
        statusCode: 500,
        message: 'Error al consultar las ofertas de tutoría.',
        error: 'Internal Server Error',
      },
    },
  })
  async searchOffers(
    @Query() query: OffersQueryParams,
  ): Promise<PaginatedOffersResponse> {
    return this.ofertasService.searchOffers(query);
  }

  /**
   * HU-32: Ver detalles de una oferta de tutoría.
   *
   * Endpoint público (no requiere JWT).
   * Debe declararse DESPUÉS de @Get('search') para evitar colisiones de rutas.
   *
   * @route GET /api/ofertas/:id
   * @param id - UUID de la oferta
   * @returns OfertaDetalleResponseDto con todos los detalles
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ver detalles de una oferta de tutoría',
    description:
      'Retorna el detalle completo de una oferta: título, precio, modalidad, descripción, ' +
      'categorías, rating, disponibilidad del tutor, experiencias y materias.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la oferta',
    type: String,
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la oferta obtenido exitosamente',
    type: OfertaDetalleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'UUID inválido',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (uuid is expected)',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Oferta no encontrada',
    schema: {
      example: {
        statusCode: 404,
        message:
          'Oferta con id a1b2c3d4-e5f6-7890-1234-567890abcdef no encontrada.',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    schema: {
      example: {
        statusCode: 500,
        message: 'Error interno al obtener el detalle de la oferta.',
        error: 'Internal Server Error',
      },
    },
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OfertaDetalleResponseDto> {
    return this.ofertasService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear oferta de tutoría',
    description:
      'Crea una nueva oferta de tutoría con los datos proporcionados',
  })
  @ApiBody({
    type: CreateOfertaDto,
    description: 'Datos de la oferta a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Oferta creada exitosamente',
    schema: {
      example: {
        statusCode: 201,
        message: 'Oferta creada exitosamente',
        data: {
          id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          title: 'Cálculo Vectorial',
          price: 10,
          modality: 'Presencial',
          categories: ['Matemáticas'],
          description:
            'Se enseñará cálculo vectorial, incluyendo integrales de línea y superficie.',
          tutorId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          createdAt: '2023-10-27T10:30:00.000Z',
          updatedAt: '2023-10-27T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'El título de la oferta debe tener al menos 3 caracteres.',
          'El precio mínimo por hora es de $5.',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una oferta con el mismo título para este tutor',
    schema: {
      example: {
        statusCode: 409,
        message: 'Ya existe una oferta con este título para este tutor.',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    schema: {
      example: {
        statusCode: 500,
        message: 'Error interno del servidor al crear la oferta',
        error: 'Internal Server Error',
      },
    },
  })
  async create(
    @Body() createOfertaDto: CreateOfertaDto,
  ): Promise<CreateOfertaResponse> {
    const oferta = await this.createOfertaUseCase.execute(
      createOfertaDto,
      this.tutorId,
    );
    return this.buildSuccessResponse(oferta);
  }

  /**
   * Builds a standardized success response for offer creation.
   * Centralizes response structure for consistency.
   */
  private buildSuccessResponse(oferta: Oferta): CreateOfertaResponse {
    return {
      statusCode: HttpStatus.CREATED,
      message: SUCCESS_MESSAGE,
      data: oferta,
    };
  }

  /**
   * HU02: Obtiene todas las ofertas de un tutor específico.
   *
   * @route GET /api/tutor/:tutorId/ofertas
   * @param tutorId - UUID del tutor (validado por ParseUUIDPipe)
   * @returns Array de OfertaDto
   */
  @Get('../tutor/:tutorId/ofertas')
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
}
