import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsSessionOwnerGuard } from './guards/is-session-owner.guard';
import { AgendaService } from './agenda.service';
import { SessionsService } from './sessions.service';
import {
  InitialAgendaDataDto,
  SelectedDayInfoDto,
  SessionDetailDto,
} from './dto';
import { Tutor } from '../tutors/entities/tutor.entity';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    name?: string;
    email?: string;
    role?: 'tutor' | 'student';
  };
  tutor?: Tutor;
}

@ApiTags('agenda')
@ApiBearerAuth('JWT')
@Controller('api/tutor/agenda')
export class AgendaController {
  constructor(
    private readonly agendaService: AgendaService,
    private readonly sessionsService: SessionsService,
  ) {}

  // ─── STATIC routes FIRST (before :year/:month catches everything) ────────

  /**
   * HU15 — GET /api/tutor/agenda/sessions/day?date=2026-03-25
   *
   * Retorna las sesiones de un día específico para el panel lateral.
   */
  @Get('sessions/day')
  @UseGuards(JwtAuthGuard, IsSessionOwnerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener sesiones de un día específico',
    description:
      'Retorna la lista de sesiones confirmadas para una fecha específica del tutor autenticado.',
  })
  @ApiQuery({
    name: 'date',
    type: String,
    description: 'Fecha en formato ISO (YYYY-MM-DD)',
    example: '2026-03-25',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesiones del día obtenidas exitosamente',
    type: SelectedDayInfoDto,
  })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  @ApiResponse({
    status: 403,
    description: 'Solo los tutores pueden acceder a la agenda',
  })
  async getSessionsByDay(
    @Request() req: AuthenticatedRequest,
    @Query('date') date: string,
  ): Promise<SelectedDayInfoDto> {
    const tutorId = req.tutor?.id ?? '';
    return this.sessionsService.getSessionsByDay(tutorId, date);
  }

  /**
   * HU15 — GET /api/tutor/agenda/sessions/:id
   *
   * Retorna el detalle completo de una sesión para el modal.
   */
  @Get('sessions/:id')
  @UseGuards(JwtAuthGuard, IsSessionOwnerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener detalle de una sesión',
    description:
      'Retorna el detalle completo de una sesión de tutoría confirmada ' +
      'incluyendo información del estudiante, enlace/ubicación y mensaje.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID de la sesión (solicitud UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle de sesión obtenido exitosamente',
    type: SessionDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sesión no encontrada o no pertenece al tutor',
  })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  @ApiResponse({
    status: 403,
    description: 'Solo los tutores pueden acceder a la agenda',
  })
  async getSessionDetail(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<SessionDetailDto> {
    const tutorId = req.tutor?.id ?? '';
    return this.sessionsService.getDetails(tutorId, id);
  }

  // ─── DYNAMIC routes LAST ─────────────────────────────────────────────────

  /**
   * HU15 — GET /api/tutor/agenda/:year/:month
   *
   * Retorna los datos iniciales de la agenda mensual del tutor:
   * - Días del calendario con indicadores de sesiones
   * - Lista de sesiones futuras del mes (panel "ESTE MES")
   * - Total de sesiones confirmadas
   */
  @Get(':year/:month')
  @UseGuards(JwtAuthGuard, IsSessionOwnerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener agenda mensual del tutor',
    description:
      'Retorna la información del calendario mensual incluyendo días con sesiones, ' +
      'etiquetas resumidas y la lista de sesiones futuras para el panel lateral.',
  })
  @ApiParam({
    name: 'year',
    type: Number,
    description: 'Año (ej: 2026)',
    example: 2026,
  })
  @ApiParam({
    name: 'month',
    type: Number,
    description: 'Mes (1-12)',
    example: 3,
  })
  @ApiResponse({
    status: 200,
    description: 'Agenda mensual obtenida exitosamente',
    type: InitialAgendaDataDto,
  })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  @ApiResponse({
    status: 403,
    description: 'Solo los tutores pueden acceder a la agenda',
  })
  async getMonthlyAgenda(
    @Request() req: AuthenticatedRequest,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ): Promise<InitialAgendaDataDto> {
    const tutorId = req.tutor?.id ?? '';
    return this.agendaService.getMonthlyAgendaData(tutorId, year, month);
  }
}
