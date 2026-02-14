import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Exception filter específico para HU02.
 *
 * Captura 404 Not Found cuando la URL contiene '/api/tutor//' (tutorId vacío)
 * y lo transforma en 400 Bad Request para mantener el contrato.
 */
@Catch(NotFoundException)
export class TutorOfertasNotFoundFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Si la URL contiene /api/tutor// (tutorId vacío), retorna 400
    if (request.url.includes('/api/tutor//ofertas')) {
      response.status(400).json({
        statusCode: 400,
        message: 'Validation failed (uuid is expected)',
        error: 'Bad Request',
      });
      return;
    }

    // De lo contrario, deja que NestJS maneje el 404 normalmente
    response.status(404).json(exception.getResponse());
  }
}
