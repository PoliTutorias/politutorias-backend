import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tutor } from '../tutors/entities/tutor.entity';

interface AuthenticatedRequest {
  user?: { id: string; role?: 'tutor' | 'student' };
  tutor?: Tutor;
}

/**
 * Guard de autorización para la agenda del tutor.
 *
 * Verifica que el usuario autenticado sea un tutor registrado
 * e inyecta `req.tutor` para uso posterior en los controllers.
 *
 * Debe usarse DESPUÉS de JwtAuthGuard.
 *
 * Nota: La validación de que una sesión específica pertenece al tutor
 * se realiza en el servicio (SessionsService.getDetails) para mantener
 * la lógica de dominio centralizada.
 */
@Injectable()
export class IsSessionOwnerGuard implements CanActivate {
  constructor(
    @InjectRepository(Tutor)
    private readonly tutorRepository: Repository<Tutor>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException(
        'Solo los tutores pueden acceder a la agenda.',
      );
    }

    // Si ya existe req.tutor (inyectado por un guard previo), reusar
    if (request.tutor) {
      return true;
    }

    // Fast path: si el JWT dice que NO es tutor, rechazar sin query
    const role = request.user?.role;
    if (role && role !== 'tutor') {
      throw new ForbiddenException(
        'Solo los tutores pueden acceder a la agenda.',
      );
    }

    // Buscar tutor en BD
    const tutor = await this.tutorRepository.findOne({ where: { userId } });

    if (!tutor) {
      throw new ForbiddenException(
        'Solo los tutores pueden acceder a la agenda.',
      );
    }

    // Inyectar tutor en el request para uso en el controller
    request.tutor = tutor;
    return true;
  }
}
