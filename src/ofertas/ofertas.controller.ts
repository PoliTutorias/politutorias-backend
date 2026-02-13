import { Controller, Post, Get, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateOfertaUseCase } from './application/use-cases/create-oferta.use-case';
import { GetAllOfertasUseCase } from './application/use-cases/get-all-ofertas.use-case';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { Oferta } from './domain/entities/oferta.entity';

const SUCCESS_MESSAGE = 'Oferta creada exitosamente';

interface CreateOfertaResponse {
  statusCode: number;
  message: string;
  data: Oferta;
}

@ApiTags('ofertas')
@Controller('api/ofertas')
export class OfertasController {
  private readonly tutorId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

  constructor(
    private readonly createOfertaUseCase: CreateOfertaUseCase,
    private readonly getAllOfertasUseCase: GetAllOfertasUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Listar todas las ofertas de tutoría',
    description: 'Obtiene todas las ofertas de tutoría ordenadas por fecha de creación (más recientes primero)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de ofertas obtenida exitosamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Ofertas obtenidas exitosamente',
        data: [
          {
            id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
            title: 'Cálculo Vectorial',
            price: 10,
            modality: 'Presencial',
            categories: ['Matemáticas', 'Física'],
            description: 'Se enseñará cálculo vectorial',
            tutorId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
            createdAt: '2023-10-27T10:30:00.000Z',
            updatedAt: '2023-10-27T10:30:00.000Z',
          },
        ],
      },
    },
  })
  async findAll() {
    const ofertas = await this.getAllOfertasUseCase.execute();
    return {
      statusCode: HttpStatus.OK,
      message: 'Ofertas obtenidas exitosamente',
      data: ofertas,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear oferta de tutoría',
    description: 'Crea una nueva oferta de tutoría con los datos proporcionados' 
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
          description: 'Se enseñará cálculo vectorial, incluyendo integrales de línea y superficie.',
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
  async create(@Body() createOfertaDto: CreateOfertaDto): Promise<CreateOfertaResponse> {
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
}
