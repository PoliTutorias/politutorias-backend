import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tutor } from '../../tutors/entities/tutor.entity';

interface AuthenticatedRequest {
  user?: { id: string; role?: 'tutor' | 'student' };
  tutor?: Tutor;
}

/**
 * Guard de autorización: verifica que el usuario autenticado tiene perfil de tutor.
 * Debe usarse DESPUÉS de JwtAuthGuard (que inyecta req.user).
 *
 * 1. Verifica el claim `role` del JWT (fast path, sin DB).
 * 2. Si es tutor, busca el registro Tutor en BD para inyectar req.tutor.
 * 3. Si no es tutor, lanza ForbiddenException 403.
 */
@Injectable()
export class TutorAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(Tutor)
    private readonly tutorRepository: Repository<Tutor>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;
    const role = request.user?.role;

    if (!userId) {
      throw new ForbiddenException(
        'Solo los tutores pueden acceder a este recurso.',
      );
    }

    // Fast path: si el JWT dice que NO es tutor, rechazar sin query
    if (role && role !== 'tutor') {
      throw new ForbiddenException(
        'Solo los tutores pueden acceder a este recurso.',
      );
    }

    // Buscar tutor en BD para obtener el tutorId y validar
    const tutor = await this.tutorRepository.findOne({ where: { userId } });

    if (!tutor) {
      throw new ForbiddenException(
        'Solo los tutores pueden acceder a este recurso.',
      );
    }

    // Inyectar el tutor en el request para uso en el controller (evita doble query)
    request.tutor = tutor;
    return true;
  }
}
