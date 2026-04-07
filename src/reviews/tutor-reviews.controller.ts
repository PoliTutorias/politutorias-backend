import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { GetTutorReviewsQueryDto } from './dto/get-tutor-reviews-query.dto';
import { TutorReviewsResponseDto } from './dto/tutor-reviews-response.dto';

/**
 * HU-22: Controlador público para ver las reseñas de un tutor.
 * No requiere autenticación JWT para permitir la consulta antes del registro.
 */
@Controller('api/tutors')
@ApiTags('tutor-reviews')
export class TutorReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':tutorId/reviews')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ver reseñas de un tutor (público)',
    description:
      'Retorna las reseñas de un tutor con resumen estadístico (promedio, distribución de estrellas) ' +
      'y listado paginado con filtro por estrellas. No requiere autenticación.',
  })
  @ApiParam({
    name: 'tutorId',
    type: 'string',
    format: 'uuid',
    description: 'ID del tutor',
  })
  @ApiOkResponse({
    description: 'Reseñas del tutor con resumen estadístico',
    type: TutorReviewsResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Tutor no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Tutor no encontrado',
      },
    },
  })
  async getTutorReviews(
    @Param('tutorId', ParseUUIDPipe) tutorId: string,
    @Query() query: GetTutorReviewsQueryDto,
  ): Promise<TutorReviewsResponseDto> {
    return this.reviewsService.getTutorReviews(tutorId, query);
  }
}
