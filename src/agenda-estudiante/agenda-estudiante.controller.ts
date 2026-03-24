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
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsSolicitudOwnerGuard } from './guards/is-solicitud-owner.guard';
import { AgendaEstudianteService } from './agenda-estudiante.service';
import { AgendaPaginationDto } from './dto/agenda-pagination.dto';
import {
  AgendaStudentDetailDTO,
  EstudianteAgendaResponseDto,
} from './dto/agenda-student.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role?: string;
  };
}

/**
 * HU11 — Controlador de agenda del estudiante.
 *
 * Expone los endpoints:
 *  GET /api/estudiante/agenda         → lista paginada de sesiones
 *  GET /api/estudiante/agenda/:id     → detalle de una sesión
 */
@ApiTags('agenda-estudiante')
@ApiBearerAuth('JWT')
@Controller('api/estudiante/agenda')
export class AgendaEstudianteController {
  constructor(
    private readonly agendaEstudianteService: AgendaEstudianteService,
  ) {}

  /**
   * HU11 — GET /api/estudiante/agenda
   *
   * Retorna las sesiones del estudiante autenticado agrupadas en
   * "proximas" (futuras) y "anteriores" (pasadas/historial).
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener agenda del estudiante',
    description:
      'Retorna las tutorías confirmadas del estudiante autenticado, ' +
      'clasificadas en sesiones próximas y sesiones anteriores.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página para la sección "anteriores" (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Elementos por página (default: 10, max: 100)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Agenda del estudiante obtenida exitosamente',
    type: EstudianteAgendaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de paginación inválidos',
  })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  async getStudentAgenda(
    @Request() req: AuthenticatedRequest,
    @Query() params: AgendaPaginationDto,
  ): Promise<EstudianteAgendaResponseDto> {
    const studentId = req.user.id;
    return this.agendaEstudianteService.getStudentAgenda(studentId, params);
  }

  /**
   * HU11 — GET /api/estudiante/agenda/:id
   *
   * Retorna el detalle completo de una sesión específica del estudiante.
   * Verifica que la sesión pertenezca al estudiante autenticado.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, IsSolicitudOwnerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener detalle de una sesión del estudiante',
    description:
      'Retorna el detalle completo de una tutoría confirmada ' +
      'incluyendo enlace/ubicación y mensaje del estudiante.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la sesión (solicitud)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle de sesión obtenido exitosamente',
    type: AgendaStudentDetailDTO,
  })
  @ApiResponse({
    status: 403,
    description: 'La sesión no pertenece al estudiante autenticado',
  })
  @ApiResponse({
    status: 404,
    description: 'Sesión no encontrada',
  })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  async getSessionDetail(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<AgendaStudentDetailDTO> {
    const studentId = req.user.id;
    return this.agendaEstudianteService.getSessionDetails(studentId, id);
  }
}
