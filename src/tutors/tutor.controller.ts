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
import { TutorService } from './tutor.service';
import { RegistrarDatosBasicosDto } from './dto/registrar-datos-basicos.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  TutorResponseMapper,
  TutorResponseDto,
} from './mappers/tutor-response.mapper';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@ApiTags('tutors')
@ApiBearerAuth('JWT')
@Controller('api/tutor')
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  @UseGuards(JwtAuthGuard)
  @Post('datos-basicos')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar o actualizar datos básicos del tutor (HU34)',
    description:
      'Crea el perfil de tutor si no existe, o actualiza los datos si ya existe (upsert). ' +
      'Requiere token JWT en el header Authorization.',
  })
  @ApiBody({ type: RegistrarDatosBasicosDto })
  @ApiResponse({
    status: 201,
    description: 'Datos básicos registrados/actualizados con éxito.',
    type: TutorResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validación del DTO fallida.' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async registrarDatosBasicos(
    @Body() dto: RegistrarDatosBasicosDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    try {
      const tutor = await this.tutorService.registrarDatosBasicos(userId, dto);
      return {
        success: true,
        message: 'Datos básicos registrados con éxito',
        data: TutorResponseMapper.toResponseDto(tutor),
      };
    } catch {
      throw new InternalServerErrorException({
        statusCode: 500,
        message: 'Error interno del servidor al registrar datos básicos.',
      });
    }
  }
}
