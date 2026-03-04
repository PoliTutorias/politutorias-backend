import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { PerfilService } from './perfil.service';
import { PerfilProfesionalDto } from '../common/dtos/perfil-profesional.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  PerfilProfesionalMapper,
  PerfilProfesionalResponseDto,
} from './application/mappers/perfil-profesional.mapper';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

/**
 * PerfilController — HU42
 *
 * Expone POST /api/perfil/finalizar para consolidar el perfil profesional.
 * Delega la lógica al service (facade) y usa el mapper para la respuesta.
 */
@ApiTags('perfil')
@ApiBearerAuth('JWT')
@Controller('api/perfil')
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @UseGuards(JwtAuthGuard)
  @Post('finalizar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalizar perfil profesional del tutor (HU42)' })
  @ApiBody({ type: PerfilProfesionalDto })
  @ApiResponse({
    status: 200,
    description: 'Perfil profesional finalizado con éxito.',
    type: PerfilProfesionalResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validación del DTO fallida.' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async finalizar(
    @Body() perfilProfesionalDto: PerfilProfesionalDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const tutorIdFromToken = req.user.id;
    try {
      const entity = await this.perfilService.finalizar(
        tutorIdFromToken,
        perfilProfesionalDto,
      );
      return {
        success: true,
        message: 'Perfil profesional finalizado con éxito',
        data: PerfilProfesionalMapper.toResponseDto(entity),
      };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(
        'Error interno al finalizar el perfil profesional.',
      );
    }
  }
}
