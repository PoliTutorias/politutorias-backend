import {
  Body,
  Controller,
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
import { ExperienciaDto } from '../common/dtos/experiencia.dto';
import { Tutor } from '../tutors/entities/tutor.entity';
import {
  ExperienciaMapper,
  ExperienciaResponseDto,
} from './application/mappers/experiencia.mapper';
import { ExperienciasService } from './experiencias.service';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

/**
 * ExperienciasController — HU42
 *
 * Expone POST /api/experiencias para registrar una experiencia del tutor.
 * Delega la lógica al service (facade) y usa el mapper para la respuesta.
 */
@ApiTags('experiencias')
@ApiBearerAuth('JWT')
@Controller('api/experiencias')
export class ExperienciasController {
  constructor(
    private readonly experienciasService: ExperienciasService,
    @InjectRepository(Tutor)
    private readonly tutorRepository: Repository<Tutor>,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una experiencia del tutor (HU42)' })
  @ApiBody({ type: ExperienciaDto })
  @ApiResponse({
    status: 201,
    description: 'Experiencia registrada con éxito.',
    type: ExperienciaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validación del DTO fallida.' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async add(
    @Body() experienciaDto: ExperienciaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    try {
      // Resolver userId (JWT sub) → tutor UUID
      const tutor = await this.tutorRepository.findOne({ where: { userId } });
      const tutorId = tutor?.id ?? userId;

      const entity = await this.experienciasService.add(
        tutorId,
        experienciaDto,
      );
      return {
        success: true,
        message: 'Experiencia registrada con éxito',
        data: ExperienciaMapper.toResponseDto(entity),
      };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(
        'Error interno al registrar la experiencia.',
      );
    }
  }
}
