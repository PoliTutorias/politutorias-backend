import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

interface AuthenticatedRequest extends Request {
  user: {
    id?: string;
    sub?: string;
  };
}

@Controller('api/reviews')
@ApiTags('reviews')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear reseña de una tutoria completada',
    description:
      'Permite al estudiante autenticado calificar una tutoría completada. Solo se admite una reseña por tutoría.',
  })
  @ApiBody({
    type: CreateReviewDto,
    examples: {
      exito: {
        summary: 'Solicitud válida',
        value: {
          tutoriaId: 'a1b2c3d4-0003-4000-8003-aa0000000003',
          rating: 5,
          comment: 'Excelente explicación y paciencia.',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Reseña creada correctamente',
    schema: {
      example: {
        statusCode: 201,
        message: 'Reseña creada correctamente',
        data: {
          id: 'c1f9b53e-e4b6-4fd6-a1d2-25dfd4123456',
          tutoriaId: 'a1b2c3d4-0003-4000-8003-aa0000000003',
          calificacion: 5,
          comentario: 'Excelente explicación y paciencia.',
          fechaCreacion: '2024-05-24T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Error de validación o de negocio (rating inválido, estado no COMPLETADA o reseña duplicada).',
    schema: {
      examples: {
        ratingInvalido: {
          value: {
            statusCode: 400,
            message: ['rating must not be less than 1'],
            data: null,
          },
        },
        estadoInvalido: {
          value: {
            statusCode: 400,
            message: 'Solo se pueden calificar tutorias completadas',
            data: null,
          },
        },
        duplicada: {
          value: {
            statusCode: 400,
            message: 'Esta tutoria ya ha sido calificada',
            data: null,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description:
      'Tutoría no encontrada o no pertenece al estudiante autenticado.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Tutoria no encontrada',
        data: null,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'JWT ausente o inválido',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        data: null,
      },
    },
  })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateReviewDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: {
      id: string;
      tutoriaId: string;
      calificacion: number;
      comentario: string | null;
      fechaCreacion: string;
    };
  }> {
    const studentId = req.user.id ?? req.user.sub ?? '';
    const result = await this.reviewsService.create(studentId, dto);

    return {
      statusCode: 201,
      message: 'Reseña creada correctamente',
      data: result,
    };
  }
}
