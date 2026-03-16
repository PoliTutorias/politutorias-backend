import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TutorAuthGuard } from '../auth/guards/tutor-auth.guard';
import { SolicitudesService } from './solicitudes.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { VerificarPreviaDto } from './dto/verificar-previa.dto';
import { SolicitudResponseDto } from './dto/solicitud-response.dto';
import { VerificarPreviaResponseDto } from './dto/verificar-previa-response.dto';
import { GlobalCountsDto } from './dto/global-counts.dto';
import { FilterParamsDto } from './dto/filter-params.dto';
import { PaginatedSolicitudesDto } from './dto/paginated-solicitudes.dto';
import { Tutor } from '../tutors/entities/tutor.entity';
import { StudentFilterParamsDto } from './dto/student-filter-params.dto';
import { PaginatedStudentSolicitudesDto } from './dto/paginated-student-solicitudes.dto';
import { StudentSolicitudDetailDto } from './dto/student-solicitud-detail.dto';

interface AuthenticatedRequest extends Request {
  user: { id: string };
  tutor?: Tutor;
}

@ApiTags('solicitudes')
@ApiBearerAuth('JWT')
@Controller('api/solicitudes')
export class SolicitudesController {
  constructor(
    private readonly solicitudesService: SolicitudesService,
    @InjectRepository(Tutor)
    private readonly tutorRepository: Repository<Tutor>,
  ) {}

  /**
   * HU-06: Verifica si el estudiante autenticado ya tiene una solicitud
   * PENDIENTE con horario solapado para la oferta indicada.
   */
  @Post('verificar-previa')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({
    summary: 'Verificar solicitud previa de tutoría',
    description:
      'Consulta si el estudiante autenticado ya tiene una solicitud **PENDIENTE** ' +
      'con algún horario solapado para la oferta indicada. ' +
      'Útil para mostrar una advertencia antes de enviar el formulario.\n\n' +
      '**Autenticación requerida**: envía el JWT en el header `Authorization: Bearer <token>`.',
  })
  @ApiBody({
    type: VerificarPreviaDto,
    description: 'Oferta y horarios a verificar',
    examples: {
      sin_colision: {
        summary: 'Sin solicitud previa',
        value: {
          ofertaId: '550e8400-e29b-41d4-a716-446655440099',
          horarios: [{ fecha: '2026-05-10', hora: '09:00' }],
        },
      },
      con_colision: {
        summary: 'Con horario ya solicitado',
        value: {
          ofertaId: '550e8400-e29b-41d4-a716-446655440099',
          horarios: [{ fecha: '2026-04-15', hora: '10:00' }],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Verificación exitosa',
    type: VerificarPreviaResponseDto,
    content: {
      'application/json': {
        examples: {
          sin_colision: {
            summary: 'No hay solicitud previa',
            value: { existe: false, mensaje: null },
          },
          con_colision: {
            summary: 'Ya existe solicitud con ese horario',
            value: {
              existe: true,
              mensaje:
                'Horario ya solicitado. Ya tienes una solicitud activa para este bloque.',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Body inválido (UUID mal formado, horarios vacíos, etc.)',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'ofertaId must be a UUID',
          'horarios must contain at least 1 elements',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente o inválido',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  async verificarPrevia(
    @Request() req: AuthenticatedRequest,
    @Body() dto: VerificarPreviaDto,
  ): Promise<VerificarPreviaResponseDto> {
    return this.solicitudesService.verificarSolicitudPrevia(req.user.id, dto);
  }

  /**
   * HU09 — GET /api/solicitudes/counts
   * Retorna conteos de solicitudes por estado para el tutor autenticado.
   * IMPORTANTE: debe estar ANTES de @Get() para evitar conflictos de ruta.
   */
  @Get('counts')
  @UseGuards(JwtAuthGuard, TutorAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener conteos de solicitudes por estado',
    description:
      'Retorna el conteo de solicitudes PENDIENTE, EXPIRADA y RESPONDIDA (ACEPTADA+RECHAZADA) del tutor autenticado.',
  })
  @ApiResponse({
    status: 200,
    type: GlobalCountsDto,
    description: 'Conteos por estado',
  })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  @ApiResponse({
    status: 403,
    description: 'Solo los tutores pueden acceder a este recurso',
  })
  async getCounts(
    @Request() req: AuthenticatedRequest,
  ): Promise<GlobalCountsDto> {
    // req.tutor es inyectado por TutorAuthGuard (evita doble query)
    const tutorId = req.tutor?.id ?? '';
    return this.solicitudesService.getCountsByStatus(tutorId);
  }

  /**
   * HU09 + HU33 — GET /api/solicitudes
   * UNIFIED HANDLER: Detects if user is tutor or student and returns appropriate perspective
   * - Tutor: Returns solicitudes RECEIVED (HU-09)
   * - Student: Returns solicitudes SENT (HU-33)
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({
    summary: 'Listar solicitudes (tutor o estudiante)',
    description:
      'Lista paginada de solicitudes. El sistema detecta automáticamente si el usuario es tutor o estudiante:\n\n' +
      '- **Tutor**: Retorna solicitudes recibidas (HU-09)\n' +
      '- **Estudiante**: Retorna solicitudes enviadas (HU-33)\n\n' +
      'Los filtros y formatos de respuesta varían según la perspectiva.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Filtrar por estado. Tutor: PENDIENTE, EXPIRADA, RESPONDIDA. Estudiante: PENDIENTE, EXPIRADA, RESPONDIDA, TODAS',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Número de página (mínimo 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description:
      'Registros por página (máximo 100). Default: 10 para tutores, 5 para estudiantes',
  })
  @ApiResponse({
    status: 200,
    description:
      'Lista paginada de solicitudes. La estructura varía según si es tutor o estudiante',
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros inválidos (status, page o limit fuera de rango)',
  })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  async getFiltered(
    @Request() req: AuthenticatedRequest,
    @Query() params: StudentFilterParamsDto,
  ): Promise<PaginatedSolicitudesDto | PaginatedStudentSolicitudesDto> {
    const userId = req.user.id;

    // Check if user is a tutor
    const tutor = await this.tutorRepository.findOne({
      where: { userId },
    });

    if (tutor) {
      // Tutor perspective (HU-09)
      return this.solicitudesService.getFiltered(
        tutor.id,
        params as FilterParamsDto,
      );
    } else {
      // Student perspective (HU-33)
      return this.solicitudesService.findAllForStudent(
        userId,
        params as StudentFilterParamsDto,
      );
    }
  }

  /**
   * HU33 — GET /api/solicitudes/:id
   * Get detail of a single solicitud from student perspective
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener detalle de solicitud enviada (estudiante)',
    description:
      'Retorna el detalle completo de una solicitud enviada por el estudiante autenticado.\n\n' +
      '**Autenticación**: Solo el estudiante que envió la solicitud puede verla.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID de la solicitud (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    type: StudentSolicitudDetailDto,
    description: 'Detalle de la solicitud',
  })
  @ApiResponse({
    status: 404,
    description:
      'Solicitud no encontrada o no pertenece al estudiante autenticado',
  })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  async getDetailForStudent(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<StudentSolicitudDetailDto> {
    const userId = req.user.id;

    // For now, this endpoint is student-only
    // In the future, we could add tutor detail view here too with role detection
    return this.solicitudesService.findByIdForStudent(userId, id);
  }

  /**
   * HU-06: Envía una nueva solicitud de tutoría.
   * El estudianteId se extrae del JWT. El tutorId se resuelve desde la oferta.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({
    summary: 'Enviar solicitud de tutoría',
    description:
      'Crea una nueva solicitud de tutoría del estudiante autenticado hacia la oferta indicada.\n\n' +
      '**Reglas de negocio:**\n' +
      '- El `estudianteId` se extrae automáticamente del JWT (no va en el body).\n' +
      '- El `tutorId` se resuelve automáticamente desde la oferta (no va en el body).\n' +
      '- Si la oferta es de modalidad **dual** (`VIRTUAL/PRESENCIAL`), el campo `modalidad` es **obligatorio**.\n' +
      '- Si la oferta es de modalidad **única**, `modalidad` se asigna automáticamente.\n' +
      '- No se permite duplicar solicitudes PENDIENTE con el mismo horario para la misma oferta.\n\n' +
      '**Autenticación requerida**: envía el JWT en el header `Authorization: Bearer <token>`.',
  })
  @ApiBody({
    type: CreateSolicitudDto,
    description: 'Datos de la solicitud de tutoría',
    examples: {
      oferta_virtual: {
        summary: 'Oferta de modalidad única (Virtual)',
        description:
          'El campo `modalidad` es opcional — se asigna automáticamente desde la oferta.',
        value: {
          ofertaId: '550e8400-e29b-41d4-a716-446655440099',
          mensaje:
            'Necesito apoyo con los temas de límites y derivadas. Tengo examen la próxima semana.',
          horarios: [
            { fecha: '2026-05-10', hora: '09:00' },
            { fecha: '2026-05-11', hora: '11:00' },
          ],
        },
      },
      oferta_dual: {
        summary: 'Oferta de modalidad dual (VIRTUAL/PRESENCIAL)',
        description:
          'El campo `modalidad` es **obligatorio** cuando la oferta tiene modalidad dual.',
        value: {
          ofertaId: '550e8400-e29b-41d4-a716-446655440099',
          mensaje:
            'Me gustaría tomar las clases de forma presencial si es posible.',
          modalidad: 'Presencial',
          horarios: [{ fecha: '2026-05-15', hora: '14:00' }],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud creada exitosamente con estado PENDIENTE',
    type: SolicitudResponseDto,
    content: {
      'application/json': {
        example: {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          estudianteId: 'test-user-123',
          ofertaId: '550e8400-e29b-41d4-a716-446655440099',
          tutorId: '550e8400-e29b-41d4-a716-446655440000',
          mensaje:
            'Necesito apoyo con los temas de límites y derivadas. Tengo examen la próxima semana.',
          modalidad: 'Virtual',
          horarios: [
            { fecha: '2026-05-10', hora: '09:00' },
            { fecha: '2026-05-11', hora: '11:00' },
          ],
          estado: 'PENDIENTE',
          createdAt: '2026-04-14T18:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos: mensaje vacío, mensaje >500 chars, horarios vacíos, modalidad requerida, o solicitud PENDIENTE duplicada',
    schema: {
      examples: {
        validacion_dto: {
          summary: 'Error de validación del DTO',
          value: {
            statusCode: 400,
            message: [
              'El mensaje no puede estar vacío',
              'Debe seleccionar al menos un horario',
            ],
            error: 'Bad Request',
          },
        },
        modalidad_requerida: {
          summary: 'Oferta dual sin modalidad',
          value: {
            statusCode: 400,
            message:
              'La oferta tiene modalidad dual. Debes seleccionar una modalidad (Virtual o Presencial).',
            error: 'Bad Request',
          },
        },
        duplicado: {
          summary: 'Solicitud PENDIENTE duplicada',
          value: {
            statusCode: 400,
            message:
              'Ya tienes una solicitud pendiente con ese horario para esta oferta.',
            error: 'Bad Request',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente o inválido',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'La oferta indicada no existe',
    schema: {
      example: {
        statusCode: 404,
        message:
          "Oferta con id '550e8400-e29b-41d4-a716-446655440099' no encontrada",
        error: 'Not Found',
      },
    },
  })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateSolicitudDto,
  ): Promise<SolicitudResponseDto> {
    return this.solicitudesService.create(req.user.id, dto);
  }
}
