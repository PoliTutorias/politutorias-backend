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
  user?: { id: string };
  tutor?: Tutor;
}

/**
 * Guard de autorización: verifica que el usuario autenticado tiene perfil de tutor.
 * Debe usarse DESPUÉS de JwtAuthGuard (que inyecta req.user.id).
 *
 * Si el usuario tiene perfil de tutor, inyecta req.tutor para uso en el controller.
 * Si no tiene perfil, lanza ForbiddenException 403.
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

    if (!userId) {
      throw new ForbiddenException(
        'Solo los tutores pueden acceder a este recurso.',
      );
    }

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
