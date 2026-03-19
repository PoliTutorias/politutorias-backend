/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { TutorAuthGuard } from '../../src/auth/guards/tutor-auth.guard';
import { SolicitudesController } from '../../src/solicitudes/solicitudes.controller';
import { SolicitudesService } from '../../src/solicitudes/solicitudes.service';
import {
  SolicitudEstado,
  RejectionReason,
} from '../../src/solicitudes/entities/solicitud.entity';
import { Tutor } from '../../src/tutors/entities/tutor.entity';

/**
 * E2E Tests — SolicitudesController — HU-23: Rechazar solicitud de tutoría
 *
 * FASE ROJA del TDD: estos tests FALLARÁN inicialmente porque:
 * 1. SolicitudesController no tiene implementado el endpoint PATCH /:id/reject.
 * 2. SolicitudesService no tiene el método rejectSolicitud.
 *
 * Nota: tutorId se extrae del req.tutor (inyectado por TutorAuthGuard).
 */

// Token JWT de desarrollo (firmado con 'poli-tutorias-dev-secret', sub='test-user-123')
const DEV_JWT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwibmFtZSI6IlR1dG9yIGRlIHBydWViYSIsImlhdCI6MTc1MTAwMDAwMH0.' +
  'pp89wDdOBhsD5iM28iMt1obYqud3xVAUIQlNMiwkl0A';

const mockSolicitudesService = {
  rejectSolicitud: jest.fn(),
};

// Mock Tutor repository - returns a tutor with id 'tutor-123'
const mockTutorRepository = {
  findOne: jest
    .fn()
    .mockResolvedValue({ id: 'tutor-123', userId: 'test-user-123' }),
};

describe('SolicitudesController (E2E) - HU-23: Rechazar Solicitud', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SolicitudesController],
      providers: [
        {
          provide: SolicitudesService,
          useValue: mockSolicitudesService,
        },
        {
          provide: getRepositoryToken(Tutor),
          useValue: mockTutorRepository,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: import('@nestjs/common').ExecutionContext) => {
          const req = context.switchToHttp().getRequest<{
            user: { id: string; role: string };
          }>();
          req.user = { id: 'test-user-123', role: 'tutor' };
          return true;
        },
      })
      .overrideGuard(TutorAuthGuard)
      .useValue({
        canActivate: (context: import('@nestjs/common').ExecutionContext) => {
          const req = context.switchToHttp().getRequest<{
            tutor: { id: string };
          }>();
          req.tutor = { id: 'tutor-123' };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PATCH /api/solicitudes/:id/reject
  // ═══════════════════════════════════════════════════════════════════════════

  describe('PATCH /api/solicitudes/:id/reject', () => {
    /**
     * Escenario 1: Rechazo exitoso con motivo predefinido.
     *
     * DADO QUE: El tutor tiene JWT válido y la solicitud está PENDIENTE.
     * CUANDO:   Se hace PATCH /api/solicitudes/:id/reject con un motivo válido.
     * ENTONCES: Responde 200 con la solicitud actualizada a RECHAZADA.
     */
    it('debe responder 200 OK cuando el rechazo es exitoso con motivo predefinido', async () => {
      const mockResponse = {
        id: 'solicitud-123',
        estado: SolicitudEstado.RECHAZADA,
        rejectionReason: RejectionReason.ENFERMEDAD,
        rejectionComment: null,
        respondedAt: new Date('2024-03-18T10:30:00.000Z'),
        tutorId: 'tutor-123',
      };
      mockSolicitudesService.rejectSolicitud.mockResolvedValueOnce(
        mockResponse,
      );

      const body = {
        reason: RejectionReason.ENFERMEDAD,
      };

      await request(app.getHttpServer())
        .patch('/api/solicitudes/solicitud-123/reject')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'solicitud-123');
          expect(res.body).toHaveProperty('estado', SolicitudEstado.RECHAZADA);
          expect(res.body).toHaveProperty(
            'rejectionReason',
            RejectionReason.ENFERMEDAD,
          );
          expect(res.body).toHaveProperty('rejectionComment', null);
          expect(res.body).toHaveProperty('respondedAt');
        });

      expect(mockSolicitudesService.rejectSolicitud).toHaveBeenCalledWith(
        'solicitud-123',
        { reason: RejectionReason.ENFERMEDAD },
        'tutor-123',
      );
    });

    /**
     * Escenario 2: Rechazo exitoso con motivo "Otro" + comentario.
     *
     * DADO QUE: El tutor selecciona motivo "Otro" y proporciona comentario.
     * CUANDO:   Se hace PATCH /api/solicitudes/:id/reject.
     * ENTONCES: Responde 200 con rejectionComment guardado.
     */
    it('debe responder 200 OK cuando el rechazo es con motivo OTRO y comentario', async () => {
      const mockResponse = {
        id: 'solicitud-123',
        estado: SolicitudEstado.RECHAZADA,
        rejectionReason: RejectionReason.OTRO,
        rejectionComment: 'Tengo una clase presencial a esa misma hora.',
        respondedAt: new Date('2024-03-18T10:30:00.000Z'),
        tutorId: 'tutor-123',
      };
      mockSolicitudesService.rejectSolicitud.mockResolvedValueOnce(
        mockResponse,
      );

      const body = {
        reason: RejectionReason.OTRO,
        comment: 'Tengo una clase presencial a esa misma hora.',
      };

      await request(app.getHttpServer())
        .patch('/api/solicitudes/solicitud-123/reject')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty(
            'rejectionReason',
            RejectionReason.OTRO,
          );
          expect(res.body).toHaveProperty(
            'rejectionComment',
            'Tengo una clase presencial a esa misma hora.',
          );
        });
    });

    /**
     * Escenario 3: Error 400 cuando reason no es un valor del enum.
     *
     * DADO QUE: Se envía un motivo inválido.
     * CUANDO:   Se hace PATCH /api/solicitudes/:id/reject.
     * ENTONCES: Responde 400 Bad Request por validación DTO.
     */
    it('debe responder 400 Bad Request cuando reason no es un valor válido del enum', async () => {
      const body = {
        reason: 'MOTIVO_INVALIDO',
      };

      await request(app.getHttpServer())
        .patch('/api/solicitudes/solicitud-123/reject')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message).toContain(
            'reason debe ser un motivo válido',
          );
        });
    });

    /**
     * Escenario 4: Error 400 cuando comentario supera 300 caracteres.
     *
     * DADO QUE: Se envía un comentario > 300 caracteres.
     * CUANDO:   Se hace PATCH /api/solicitudes/:id/reject.
     * ENTONCES: Responde 400 Bad Request por validación DTO.
     */
    it('debe responder 400 Bad Request cuando comentario supera 300 caracteres', async () => {
      const body = {
        reason: RejectionReason.OTRO,
        comment: 'A'.repeat(301), // 301 caracteres
      };

      await request(app.getHttpServer())
        .patch('/api/solicitudes/solicitud-123/reject')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message).toContain(
            'El comentario no puede superar los 300 caracteres',
          );
        });
    });

    /**
     * Escenario 5: Error 400 cuando solicitud no está en estado PENDIENTE.
     *
     * DADO QUE: La solicitud ya fue rechazada o aceptada.
     * CUANDO:   Se intenta rechazar nuevamente.
     * ENTONCES: Responde 400 Bad Request.
     */
    it('debe responder 400 Bad Request cuando la solicitud no está en estado PENDIENTE', async () => {
      const error = {
        statusCode: 400,
        message: 'Solo se pueden rechazar solicitudes en estado PENDIENTE',
      };
      mockSolicitudesService.rejectSolicitud.mockRejectedValueOnce(
        Object.assign(new Error(error.message), error),
      );

      const body = {
        reason: RejectionReason.ENFERMEDAD,
      };

      await request(app.getHttpServer())
        .patch('/api/solicitudes/solicitud-123/reject')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.BAD_REQUEST);
    });

    /**
     * Escenario 6: Error 401 cuando no se envía token JWT.
     *
     * DADO QUE: No se envía Authorization header.
     * CUANDO:   Se hace PATCH /api/solicitudes/:id/reject.
     * ENTONCES: Responde 401 Unauthorized.
     */
    it('debe responder 401 Unauthorized cuando no se envía token JWT', async () => {
      // Recreate app without mocked guard for this specific test
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [SolicitudesController],
        providers: [
          {
            provide: SolicitudesService,
            useValue: mockSolicitudesService,
          },
          {
            provide: getRepositoryToken(Tutor),
            useValue: mockTutorRepository,
          },
        ],
      }).compile();

      const appNoAuth = moduleFixture.createNestApplication();
      appNoAuth.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );
      await appNoAuth.init();

      const body = {
        reason: RejectionReason.ENFERMEDAD,
      };

      await request(appNoAuth.getHttpServer())
        .patch('/api/solicitudes/solicitud-123/reject')
        .send(body)
        .expect(HttpStatus.UNAUTHORIZED);

      await appNoAuth.close();
    });

    /**
     * Escenario 7: Error 403 cuando el tutor no es propietario de la solicitud.
     *
     * DADO QUE: El tutorId del JWT no coincide con la solicitud.
     * CUANDO:   Se hace PATCH /api/solicitudes/:id/reject.
     * ENTONCES: Responde 403 Forbidden.
     */
    it('debe responder 403 Forbidden cuando el tutor no es propietario de la solicitud', async () => {
      const error = {
        statusCode: 403,
        message: 'No tienes permiso para rechazar esta solicitud',
      };
      mockSolicitudesService.rejectSolicitud.mockRejectedValueOnce(
        Object.assign(new Error(error.message), error),
      );

      const body = {
        reason: RejectionReason.ENFERMEDAD,
      };

      await request(app.getHttpServer())
        .patch('/api/solicitudes/solicitud-123/reject')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.FORBIDDEN);
    });

    /**
     * Escenario 8: Error 404 cuando la solicitud no existe.
     *
     * DADO QUE: El ID no corresponde a ninguna solicitud.
     * CUANDO:   Se hace PATCH /api/solicitudes/:id/reject.
     * ENTONCES: Responde 404 Not Found.
     */
    it('debe responder 404 Not Found cuando la solicitud no existe', async () => {
      const error = {
        statusCode: 404,
        message: 'Solicitud no encontrada',
      };
      mockSolicitudesService.rejectSolicitud.mockRejectedValueOnce(
        Object.assign(new Error(error.message), error),
      );

      const body = {
        reason: RejectionReason.ENFERMEDAD,
      };

      await request(app.getHttpServer())
        .patch('/api/solicitudes/solicitud-id-inexistente/reject')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
