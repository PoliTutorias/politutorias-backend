import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { hash, compare } from 'bcryptjs';
import { UserEntity } from '../users/entities/user.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';

/**
 * Servicio de autenticación.
 *
 * Implementa registro y login con JWT.
 * Al autenticarse, detecta si el usuario tiene perfil de tutor (USER-01).
 */
@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(Tutor)
    private readonly tutorRepository: Repository<Tutor>,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret =
      this.configService.get<string>('JWT_SECRET') || 'poli-tutorias-dev-secret';
  }

  /**
   * Registra un nuevo usuario.
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('Ya existe una cuenta con este correo electrónico.');
    }

    const passwordHash = await hash(dto.password, 10);

    const user = this.userRepository.create({
      name: dto.name.trim(),
      email: dto.email.toLowerCase().trim(),
      passwordHash,
    });

    const saved = await this.userRepository.save(user);

    const token = this.generateToken(saved);

    return {
      token,
      user: {
        id: saved.id,
        name: saved.name,
        email: saved.email,
        isTutor: false,
      },
    };
  }

  /**
   * Inicia sesión con email y contraseña.
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const isMatch = await compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // Detectar si el usuario tiene perfil de tutor (USER-01)
    const tutor = await this.tutorRepository.findOne({
      where: { userId: user.id },
    });

    const role = tutor ? 'tutor' : 'student';
    const token = this.generateToken(user, role);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isTutor: !!tutor,
        tutorId: tutor?.id,
      },
    };
  }

  /**
   * Obtiene el perfil del usuario autenticado.
   */
  async getMe(userId: string): Promise<AuthResponseDto['user']> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    const tutor = await this.tutorRepository.findOne({
      where: { userId: user.id },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isTutor: !!tutor,
      tutorId: tutor?.id,
    };
  }

  private generateToken(user: UserEntity, role: 'tutor' | 'student' = 'student'): string {
    return sign(
      {
        sub: user.id,
        name: user.name,
        email: user.email,
        role,
      },
      this.jwtSecret,
      { expiresIn: '7d' },
    );
  }

  /**
   * Genera un nuevo JWT para un usuario existente, con el rol actualizado.
   * Se usa después de que un estudiante completa su registro como tutor.
   */
  async refreshTokenForUser(userId: string): Promise<{ token: string; user: AuthResponseDto['user'] }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    const tutor = await this.tutorRepository.findOne({ where: { userId: user.id } });
    const role = tutor ? 'tutor' : 'student';
    const token = this.generateToken(user, role);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isTutor: !!tutor,
        tutorId: tutor?.id,
      },
    };
  }
}
