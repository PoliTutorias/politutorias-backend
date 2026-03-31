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
import { ReportInasistenciaResponseDto } from './dto/report-inasistencia.dto';
import { TutorialDetailDto } from './dto/tutorial-detail.dto';
import { TutoriasService } from './tutorias.service';
import { CompletarTutoriaResponseDto } from './dto/completar-tutoria-response.dto';

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
    type: ReportInasistenciaResponseDto,
    description: 'Inasistencia registrada exitosamente',
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
  ): Promise<ReportInasistenciaResponseDto> {
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
    summary: 'Registrar tutoría completada',
    description:
      'Marca una tutoría como completada. Solo válido para tutorías en estado ACEPTADA (SIN_CONFIRMAR).',
  })
  @ApiResponse({
    status: 200,
    type: CompletarTutoriaResponseDto,
    description: 'Tutoría marcada como completada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Tutoría no encontrada o no pertenece al tutor',
  })
  @ApiResponse({
    status: 400,
    description:
      'Solo se pueden completar tutorías programadas (SIN_CONFIRMAR)',
  })
  async completarTutoria(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<CompletarTutoriaResponseDto> {
    const tutorId = req.tutor?.id ?? '';
    const result = await this.tutoriasService.completarTutoria(id, tutorId);

    return {
      success: true,
      message: 'Tutoría marcada como completada exitosamente.',
      data: {
        id: result.id,
        status: 'COMPLETADA',
        updatedAt: result.updatedAt.toISOString(),
      },
    };
  }
}
