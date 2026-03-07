import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { Request } from 'express';
import { CreateAvailabilityUseCase } from './application/use-cases/create-availability.use-case';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DisponibilidadService } from './disponibilidad.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@ApiTags('disponibilidad')
@ApiBearerAuth('JWT')
@Controller('api/disponibilidad')
export class DisponibilidadController {
  constructor(
    private readonly createAvailabilityUseCase: CreateAvailabilityUseCase,
    private readonly disponibilidadService: DisponibilidadService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar disponibilidad del tutor (HU07)',
    description:
      'Retorna los bloques de disponibilidad horaria del tutor autenticado. ' +
      'Requiere token JWT en el header Authorization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Disponibilidad obtenida exitosamente.',
    schema: {
      example: {
        blocks: [
          { day: 'Lun', hour: '09:00' },
          { day: 'Mar', hour: '10:00' },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado, se requiere token JWT válido.',
  })
  async findByTutor(@Req() req: AuthenticatedRequest) {
    const tutorId = req.user.id;

    try {
      const blocks = await this.disponibilidadService.findByTutorId(tutorId);
      return {
        blocks: blocks.map((block) => ({
          day: block.day,
          hour: block.hour,
        })),
      };
    } catch {
      throw new InternalServerErrorException(
        'Error al consultar la disponibilidad.',
      );
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar disponibilidad del tutor (HU41)',
    description:
      'Registra o actualiza la disponibilidad horaria del tutor autenticado. ' +
      'Reemplaza la disponibilidad anterior completamente. ' +
      'Requiere token JWT en el header Authorization.',
  })
  @ApiBody({
    type: CreateAvailabilityDto,
    description:
      'Datos para registrar la disponibilidad del tutor y los bloques horarios.',
  })
  @ApiResponse({
    status: 201,
    description: 'Disponibilidad registrada exitosamente.',
    schema: {
      example: {
        message: 'Disponibilidad registrada exitosamente para el tutor.',
        tutorId: 'uuid-del-tutor-desde-jwt',
        blocks: [
          {
            id: 'uuid-block-1',
            day: 'Lun',
            hour: '09:00',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de disponibilidad inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado, se requiere token JWT válido.',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor.',
  })
  async save(
    @Body() createAvailabilityDto: CreateAvailabilityDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const tutorIdFromToken = req.user.id;

    try {
      const result = await this.createAvailabilityUseCase.execute(
        tutorIdFromToken,
        createAvailabilityDto.blocks,
      );
      return result;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error interno al guardar la disponibilidad.',
      );
    }
  }
}
