import {
  Body,
  Controller,
  Get,
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
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description:
      'Crea una nueva cuenta de usuario. Todos los usuarios empiezan como estudiantes. ' +
      'Para ser tutor, deben completar el registro de tutor (HU34).',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una cuenta con este correo electrónico',
  })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Inicia sesión con email y contraseña. Retorna un JWT y los datos del usuario, ' +
      'incluyendo si tiene perfil de tutor (USER-01).',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Sesión iniciada exitosamente',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
  })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado',
    description:
      'Retorna los datos del usuario autenticado, incluyendo si tiene perfil de tutor.',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos del usuario autenticado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente o inválido',
  })
  async getMe(
    @Request() req: AuthenticatedRequest,
  ): Promise<AuthResponseDto['user']> {
    return this.authService.getMe(req.user.id);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Refrescar token JWT',
    description:
      'Genera un nuevo JWT con el rol actualizado. Útil después de completar el registro de tutor.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token actualizado exitosamente',
    type: AuthResponseDto,
  })
  async refresh(@Request() req: AuthenticatedRequest): Promise<AuthResponseDto> {
    return this.authService.refreshTokenForUser(req.user.id);
  }
}
