import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Guard placeholder para HU34.
 * Decodifica el payload del Bearer token (sin verificar firma) y puebla req.user.
 * En producción será reemplazado por validación real con @nestjs/jwt + @nestjs/passport.
 * Los tests de controller lo sobreescriben via .overrideGuard().
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { id: string } }>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token JWT ausente o inválido.');
    }

    const token = authHeader.slice(7);
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Token JWT malformado.');
    }

    try {
      // Decodifica el payload (base64url) sin verificar la firma — placeholder
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf-8'),
      ) as { sub?: string; id?: string };

      const userId = payload.sub ?? payload.id;
      if (!userId) {
        throw new UnauthorizedException(
          'Token JWT no contiene identificador de usuario.',
        );
      }

      request.user = { id: userId };
      return true;
    } catch {
      throw new UnauthorizedException('Token JWT inválido.');
    }
  }
}
