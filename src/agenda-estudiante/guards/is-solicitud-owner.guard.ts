import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudEntity } from '../../solicitudes/entities/solicitud.entity';

interface AuthenticatedRequest {
  user?: { id: string; role?: string };
  params?: { id?: string };
}

/**
 * Guard de autorización para el detalle de sesiones del estudiante.
 *
 * Verifica que la solicitud identificada por el path param `:id`
 * pertenezca al estudiante autenticado (req.user.id === solicitud.estudianteId).
 *
 * Debe usarse DESPUÉS de JwtAuthGuard.
 * Solo aplica a rutas con param `:id`.
 */
@Injectable()
export class IsSolicitudOwnerGuard implements CanActivate {
  constructor(
    @InjectRepository(SolicitudEntity)
    private readonly solicitudRepository: Repository<SolicitudEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;
    const sessionId = request.params?.id;

    if (!userId || !sessionId) {
      throw new ForbiddenException('No tienes permiso para ver esta tutoría.');
    }

    const solicitud = await this.solicitudRepository.findOne({
      where: { id: sessionId },
      select: { id: true, estudianteId: true },
    });

    if (!solicitud || solicitud.estudianteId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver esta tutoría.');
    }

    return true;
  }
}
