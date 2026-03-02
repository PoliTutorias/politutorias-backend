import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { decode } from 'jsonwebtoken';
import { Observable } from 'rxjs';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // Verificar si existe el header Authorization
    const authHeader = request.headers?.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException();
    }

    // Extraer el token del header (formato: "Bearer <token>")
    const parts = authHeader.split(' ');
    const token = parts.length > 1 ? parts[1] : null;
    if (!token) {
      throw new UnauthorizedException();
    }

    // En un entorno real, aquí se validaría el JWT con una librería como 'jsonwebtoken'
    // Para este ejercicio, simulamos que el token es válido y extraemos un ID mock del token
    // En tests, este guard será mockeado completamente
    try {
      // Simulación: extraer un ID del token (en JWT real se usaría jwt.verify())
      // Por ahora, usar un ID mock o parsear el token si contiene información
      const userId = this.extractUserIdFromToken(token);
      request.user = { id: userId };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private extractUserIdFromToken(token: string): string {
    // Decodificar el JWT sin verificar la firma (para desarrollo)
    // En producción, usar jwt.verify() con la clave secreta
    try {
      const decoded = decode(token) as Record<string, unknown> | null;
      if (!decoded) {
        return 'mock-uuid-from-jwt';
      }

      // Extraer el claim 'sub' (subject = user ID)
      const userId = decoded.sub as string | undefined;
      if (userId) {
        return userId;
      }

      return 'mock-uuid-from-jwt';
    } catch {
      return 'mock-uuid-from-jwt';
    }
  }
}
