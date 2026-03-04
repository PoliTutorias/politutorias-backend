import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { StorageService } from '../storage/storage.service';
import { RegistrarDatosBasicosDto } from './dto/registrar-datos-basicos.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  TutorResponseDto,
  TutorResponseMapper,
} from './mappers/tutor-response.mapper';
import { TutorService } from './tutor.service';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@ApiTags('tutors')
@ApiBearerAuth('JWT')
@Controller('api/tutor')
export class TutorController {
  constructor(
    private readonly tutorService: TutorService,
    private readonly storageService: StorageService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('datos-basicos')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('fotoPerfil'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Registrar o actualizar datos básicos del tutor (HU34)',
    description:
      'Crea el perfil de tutor si no existe, o actualiza los datos si ya existe (upsert). ' +
      'Requiere token JWT en el header Authorization. ' +
      'Enviar como multipart/form-data; el campo fotoPerfil es el archivo de imagen (opcional).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'nombreCompleto',
        'numeroWhatsapp',
        'facultad',
        'semestreActual',
        'biografiaCorta',
      ],
      properties: {
        nombreCompleto: { type: 'string', example: 'Juan Carlos Pérez' },
        numeroWhatsapp: { type: 'string', example: '3001234567' },
        facultad: { type: 'string', example: 'FIS - Sistemas' },
        semestreActual: { type: 'string', example: '5° Semestre' },
        biografiaCorta: {
          type: 'string',
          example: 'Tutor con más de tres años de experiencia.',
        },
        fotoPerfil: {
          type: 'string',
          format: 'binary',
          description: 'Fotografía de perfil del tutor (opcional)',
        },
      },
    },
  })
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
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = req.user.id;
    try {
      if (file) {
        dto.fotoPerfil = await this.storageService.uploadProfileFile(file);
      }
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
