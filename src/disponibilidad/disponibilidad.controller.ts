import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Tutor } from '../tutors/entities/tutor.entity';
import { CreateAvailabilityUseCase } from './application/use-cases/create-availability.use-case';
import { DisponibilidadService } from './disponibilidad.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

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
    @InjectRepository(Tutor)
    private readonly tutorRepository: Repository<Tutor>,
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
    const userId = req.user.id;

    try {
      // Resolver userId (JWT sub) → tutor UUID
      const tutor = await this.tutorRepository.findOne({ where: { userId } });
      const tutorId = tutor?.id ?? userId;

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
    const userId = req.user.id;

    try {
      // Resolver userId (JWT sub) → tutor UUID
      const tutor = await this.tutorRepository.findOne({ where: { userId } });
      const tutorId = tutor?.id ?? userId;

      const result = await this.createAvailabilityUseCase.execute(
        tutorId,
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
