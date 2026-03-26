import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TutorAuthGuard } from '../auth/guards/tutor-auth.guard';
import { TutoriasService } from './tutorias.service';
import { HistoryQueryParamsDto } from './dto/history-query-params.dto';
import { HistoryResponseDto } from './dto/history-response.dto';
import { TutorialDetailDto } from './dto/tutorial-detail.dto';

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
}
