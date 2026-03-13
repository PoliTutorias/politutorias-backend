import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SolicitudesService } from './solicitudes.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { VerificarPreviaDto } from './dto/verificar-previa.dto';
import { SolicitudResponseDto } from './dto/solicitud-response.dto';
import { VerificarPreviaResponseDto } from './dto/verificar-previa-response.dto';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@ApiTags('solicitudes')
@ApiBearerAuth('JWT')
@Controller('api/solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

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
