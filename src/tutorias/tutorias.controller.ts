import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TutorAuthGuard } from '../auth/guards/tutor-auth.guard';
import { HistoryQueryParamsDto } from './dto/history-query-params.dto';
import { HistoryResponseDto } from './dto/history-response.dto';
import { TutorialDetailDto } from './dto/tutorial-detail.dto';
import { HistorialEstudianteQueryDto } from './dto/historial-estudiante-query.dto';
import { HistorialEstudianteResponseDto } from './dto/historial-estudiante-response.dto';
import { TutoriaDetalleEstudianteDto } from './dto/tutoria-detalle-estudiante.dto';
import { TutoriasService } from './tutorias.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    name?: string;
    email?: string;
    role?: 'tutor' | 'student';
  };
  tutor?: { id: string };
}

@Controller('api/tutorias')
@ApiTags('Tutorías')
@ApiBearerAuth('JWT')
export class TutoriasController {
  constructor(private readonly tutoriasService: TutoriasService) {}

  @Get('historial')
  @UseGuards(JwtAuthGuard, TutorAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener historial de tutorías impartidas',
    description:
      'Retorna el historial paginado de tutorías completadas del tutor autenticado con métricas resumidas.',
  })
  @ApiResponse({
    status: 200,
    type: HistoryResponseDto,
    description: 'Historial de tutorías con métricas',
  })
  async getHistorial(
    @Request() req: AuthenticatedRequest,
    @Query() params: HistoryQueryParamsDto,
  ): Promise<HistoryResponseDto> {
    const tutorId = req.tutor?.id ?? '';
    return this.tutoriasService.getHistorial(tutorId, params);
  }

  /**
   * HU-40: GET /api/tutorias/estudiante/historial
   */
  @Get('estudiante/historial')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Historial de tutorías del estudiante',
    description:
      'Retorna el historial paginado de tutorías completadas y con inasistencia del estudiante autenticado.',
  })
  @ApiResponse({
    status: 200,
    type: HistorialEstudianteResponseDto,
  })
  async getHistorialEstudiante(
    @Request() req: AuthenticatedRequest,
    @Query() params: HistorialEstudianteQueryDto,
  ): Promise<HistorialEstudianteResponseDto> {
    const studentId = req.user.id;
    return this.tutoriasService.findHistorialByStudent(studentId, params);
  }

  /**
   * HU-40: GET /api/tutorias/estudiante/:id
   */
  @Get('estudiante/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Detalle de tutoría del estudiante',
    description:
      'Retorna el detalle de una tutoría específica del estudiante, incluyendo reseña si existe.',
  })
  @ApiResponse({
    status: 200,
    type: TutoriaDetalleEstudianteDto,
  })
  @ApiResponse({ status: 404, description: 'Tutoría no encontrada' })
  async getDetalleEstudiante(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<TutoriaDetalleEstudianteDto> {
    const studentId = req.user.id;
    return this.tutoriasService.findOneTutoriaDetalle(studentId, id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TutorAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener detalle de una tutoría',
    description:
      'Retorna el detalle completo de una tutoría específica del tutor autenticado.',
  })
  @ApiResponse({
    status: 200,
    type: TutorialDetailDto,
    description: 'Detalle de la tutoría',
  })
  async getDetalle(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<TutorialDetailDto> {
    const tutorId = req.tutor?.id ?? '';
    return this.tutoriasService.getDetalle(tutorId, id);
  }

  @Post(':id/inasistencia')
  @UseGuards(JwtAuthGuard, TutorAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reportar inasistencia del estudiante',
    description:
      'Marca una tutoría como inasistencia (NO_SHOW) cuando el estudiante no se presenta. Solo válido para tutorías en estado ACEPTADA.',
  })
  @ApiResponse({
    status: 200,
    description: 'Inasistencia registrada exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Inasistencia del estudiante registrada con éxito.',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'no-show',
          updatedAt: '2024-05-24T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tutoría no encontrada o no pertenece al tutor',
  })
  @ApiResponse({
    status: 400,
    description: 'La tutoría no está en estado ACEPTADA',
  })
  async reportarInasistencia(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: { id: string; status: string; updatedAt: string };
  }> {
    const tutorId = req.tutor?.id ?? '';
    const result = await this.tutoriasService.reportarInasistencia(id, tutorId);

    return {
      success: true,
      message: 'Inasistencia del estudiante registrada con éxito.',
      data: {
        id: result.id,
        status: 'no-show',
        updatedAt: result.updatedAt.toISOString(),
      },
    };
  }

  @Patch(':id/completar')
  @UseGuards(JwtAuthGuard, TutorAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar tutoría como completada',
    description:
      'Marca una tutoría como completada (COMPLETADA). Solo válido para tutorías en estado ACEPTADA.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tutoría marcada como completada',
    schema: {
      example: {
        success: true,
        message: 'Tutoría marcada como completada',
        data: {
          id: 'uuid-string',
          status: 'completed',
          updatedAt: '2026-03-31T10:30:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tutoría no encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Estado inválido',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
  })
  async completar(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    success: boolean;
    message: string;
    data: { id: string; status: string; updatedAt: string };
  }> {
    const tutorId = req.tutor?.id ?? '';
    return this.tutoriasService.marcarCompletada(id, tutorId);
  }
}
