import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import type { Request } from 'express';
import { JWT_SECRET } from '../jwt.constants';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
}

/**
 * Guard JWT unificado para todas las HU.
 *
 * Verifica la firma del token con JWT_SECRET y extrae el claim `sub`
 * como identificador de usuario (req.user.id).
 *
 * En desarrollo se usa el token quemado definido en jwt.constants.ts.
 * En tests e2e este guard se sobreescribe con .overrideGuard().
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authHeader = request.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token JWT ausente o inválido.');
    }

    const token = authHeader.slice(7);
    if (!token) {
      throw new UnauthorizedException('Token JWT ausente o inválido.');
    }

    try {
      const decoded = verify(token, JWT_SECRET) as { sub?: string; name?: string; email?: string };

      const userId = decoded.sub;
      if (!userId) {
        throw new UnauthorizedException(
          'Token JWT no contiene identificador de usuario.',
        );
      }

      request.user = { id: userId, name: decoded.name, email: decoded.email };
      return true;
    } catch {
      throw new UnauthorizedException('Token JWT inválido.');
    }
  }
}
