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
import { SolicitudEstado } from '../../src/solicitudes/entities/solicitud.entity';
import { Tutor } from '../../src/tutors/entities/tutor.entity';

/**
 * E2E Tests — SolicitudesController — HU-08: Aceptar solicitud de tutoría
 *
 * FASE ROJA del TDD: estos tests FALLARÁN inicialmente porque:
 * 1. SolicitudesController no tiene implementado el endpoint PUT /:id/confirm.
 * 2. SolicitudesService no tiene el método acceptSolicitud.
 * 3. Los campos acceptedMeetingLink y acceptedMeetingLocation no existen en SolicitudEntity.
 *
 * El tutorId se extrae del req.tutor (inyectado por TutorAuthGuard).
 */

const DEV_JWT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwibmFtZSI6IlR1dG9yIGRlIHBydWViYSIsImlhdCI6MTc1MTAwMDAwMH0.' +
  'pp89wDdOBhsD5iM28iMt1obYqud3xVAUIQlNMiskl0A';

const mockSolicitudesService = {
  acceptSolicitud: jest.fn(),
};

const mockTutorRepository = {
  findOne: jest
    .fn()
    .mockResolvedValue({ id: 'tutor-123', userId: 'test-user-123' }),
};

describe('SolicitudesController (E2E) - HU-08: Aceptar Solicitud', () => {
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
  // PUT /api/solicitudes/:id/confirm
  // ═══════════════════════════════════════════════════════════════════════════

  describe('PUT /api/solicitudes/:id/confirm', () => {
    /**
     * Caso 1 (Éxito Virtual): Aceptación exitosa con modalidad Virtual.
     *
     * DADO QUE: El tutor tiene JWT válido y la solicitud está PENDIENTE.
     * CUANDO:   Se hace PUT /api/solicitudes/:id/confirm con modalidad='Virtual'
     *           y acceptedMeetingLink válido.
     * ENTONCES: Responde 200 con la solicitud actualizada a ACEPTADA.
     */
    it('debe responder 200 OK al aceptar solicitud con modalidad Virtual y link válido', async () => {
      const mockResponse: Record<string, unknown> = {
        id: 'solicitud-123',
        estado: SolicitudEstado.ACEPTADA,
        modalidad: 'Virtual',
        acceptedMeetingLink: 'https://meet.google.com/abc-defg-hij',
        acceptedMeetingLocation: null,
        respondedAt: new Date('2026-03-18T10:30:00.000Z'),
        tutorId: 'tutor-123',
      };
      mockSolicitudesService.acceptSolicitud.mockResolvedValueOnce(
        mockResponse,
      );

      const body = {
        modalidad: 'Virtual',
        acceptedMeetingLink: 'https://meet.google.com/abc-defg-hij',
      };

      await request(app.getHttpServer())
        .put('/api/solicitudes/solicitud-123/confirm')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'solicitud-123');
          expect(res.body).toHaveProperty('estado', SolicitudEstado.ACEPTADA);
          expect(res.body).toHaveProperty('modalidad', 'Virtual');
          expect(res.body).toHaveProperty('acceptedMeetingLink');
          expect(res.body).toHaveProperty('respondedAt');
        });

      expect(mockSolicitudesService.acceptSolicitud).toHaveBeenCalledWith(
        'solicitud-123',
        {
          modalidad: 'Virtual',
          acceptedMeetingLink: 'https://meet.google.com/abc-defg-hij',
        },
        'tutor-123',
      );
    });

    /**
     * Caso 2 (Éxito Presencial): Aceptación exitosa con modalidad Presencial.
     *
     * DADO QUE: El tutor tiene JWT válido y la solicitud está PENDIENTE.
     * CUANDO:   Se hace PUT /api/solicitudes/:id/confirm con modalidad='Presencial'
     *           y acceptedMeetingLocation de 10-100 caracteres.
     * ENTONCES: Responde 200 con la solicitud actualizada a ACEPTADA.
     */
    it('debe responder 200 OK al aceptar solicitud con modalidad Presencial y location válida', async () => {
      const mockResponse: Record<string, unknown> = {
        id: 'solicitud-456',
        estado: SolicitudEstado.ACEPTADA,
        modalidad: 'Presencial',
        acceptedMeetingLink: null,
        acceptedMeetingLocation: 'Biblioteca Central, Sala 302',
        respondedAt: new Date('2026-03-18T11:00:00.000Z'),
        tutorId: 'tutor-123',
      };
      mockSolicitudesService.acceptSolicitud.mockResolvedValueOnce(
        mockResponse,
      );

      const body = {
        modalidad: 'Presencial',
        acceptedMeetingLocation: 'Biblioteca Central, Sala 302',
      };

      await request(app.getHttpServer())
        .put('/api/solicitudes/solicitud-456/confirm')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'solicitud-456');
          expect(res.body).toHaveProperty('estado', SolicitudEstado.ACEPTADA);
          expect(res.body).toHaveProperty('modalidad', 'Presencial');
          expect(res.body).toHaveProperty(
            'acceptedMeetingLocation',
            'Biblioteca Central, Sala 302',
          );
          expect(res.body).toHaveProperty('respondedAt');
        });
    });

    /**
     * Caso 3 (Error 400 - ID Mismatch): El ID de URL no coincide con solicitudId del body.
     *
     * DADO QUE: Se envía un body con solicitudId distinto al :id de la URL.
     * CUANDO:   Se hace PUT /api/solicitudes/:id/confirm.
     * ENTONCES: Responde 400 Bad Request.
     */
    it('debe responder 400 Bad Request cuando el ID de URL no coincide con solicitudId del body', async () => {
      const body = {
        solicitudId: 'otro-id-456',
        modalidad: 'Virtual',
        acceptedMeetingLink: 'https://meet.google.com/abc-defg-hij',
      };

      await request(app.getHttpServer())
        .put('/api/solicitudes/solicitud-123/confirm')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(
            Array.isArray(res.body.message) ||
              typeof res.body.message === 'string',
          ).toBe(true);
        });
    });

    /**
     * Caso 4a (Error 400 - Validación DTO): URL inválida para acceptedMeetingLink.
     *
     * DADO QUE: Se envía un acceptedMeetingLink con formato inválido.
     * CUANDO:   Se hace PUT /api/solicitudes/:id/confirm.
     * ENTONCES: Responde 400 Bad Request con mensaje "Ingresa una URL válida".
     */
    it('debe responder 400 Bad Request con mensaje "Ingresa una URL válida" cuando link es inválido', async () => {
      const body = {
        modalidad: 'Virtual',
        acceptedMeetingLink: 'no-es-una-url-valida',
      };

      await request(app.getHttpServer())
        .put('/api/solicitudes/solicitud-123/confirm')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          const rawMessage = res.body.message as string | string[];
          const messages = Array.isArray(rawMessage)
            ? rawMessage
            : [rawMessage];
          expect(
            messages.some(
              (m: string) => m.includes('URL') || m.includes('url'),
            ),
          ).toBe(true);
        });
    });

    /**
     * Caso 4b (Error 400 - Validación DTO): Location con menos de 10 caracteres.
     *
     * DADO QUE: Se envía acceptedMeetingLocation con menos de 10 caracteres.
     * CUANDO:   Se hace PUT /api/solicitudes/:id/confirm.
     * ENTONCES: Responde 400 Bad Request con mensaje "Mínimo 10 caracteres".
     */
    it('debe responder 400 Bad Request con mensaje "Mínimo 10 caracteres" cuando location es muy corta', async () => {
      const body = {
        modalidad: 'Presencial',
        acceptedMeetingLocation: 'Sala 1',
      };

      await request(app.getHttpServer())
        .put('/api/solicitudes/solicitud-123/confirm')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          const rawMessage = res.body.message as string | string[];
          const messages = Array.isArray(rawMessage)
            ? rawMessage
            : [rawMessage];
          expect(
            messages.some(
              (m: string) =>
                m.includes('10') ||
                m.includes('caracteres') ||
                m.includes('mínimo'),
            ),
          ).toBe(true);
        });
    });

    /**
     * Caso 4c (Error 400 - Validación DTO): URL vacía.
     *
     * DADO QUE: Se envía acceptedMeetingLink vacío o sin contenido.
     * CUANDO:   Se hace PUT /api/solicitudes/:id/confirm.
     * ENTONCES: Responde 400 Bad Request.
     */
    it('debe responder 400 Bad Request cuando acceptedMeetingLink está vacío', async () => {
      const body = {
        modalidad: 'Virtual',
        acceptedMeetingLink: '',
      };

      await request(app.getHttpServer())
        .put('/api/solicitudes/solicitud-123/confirm')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.BAD_REQUEST);
    });

    /**
     * Caso 5 (Error 403): ForbiddenException desde el service.
     *
     * DADO QUE: El tutorId del JWT no coincide con la solicitud.
     * CUANDO:   Se hace PUT /api/solicitudes/:id/confirm.
     * ENTONCES: Responde 403 Forbidden.
     */
    it('debe responder 403 Forbidden cuando el tutor no es propietario de la solicitud', async () => {
      const error = {
        statusCode: 403,
        message: 'No tienes permiso para aceptar esta solicitud',
      };
      mockSolicitudesService.acceptSolicitud.mockRejectedValueOnce(
        Object.assign(new Error(error.message), error),
      );

      const body = {
        modalidad: 'Virtual',
        acceptedMeetingLink: 'https://meet.google.com/abc-defg-hij',
      };

      await request(app.getHttpServer())
        .put('/api/solicitudes/solicitud-123/confirm')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.FORBIDDEN);
    });

    /**
     * Caso 6 (Error 401): Sin token JWT.
     *
     * DADO QUE: No se envía Authorization header.
     * CUANDO:   Se hace PUT /api/solicitudes/:id/confirm.
     * ENTONCES: Responde 401 Unauthorized.
     */
    it('debe responder 401 Unauthorized cuando no se envía token JWT', async () => {
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
        modalidad: 'Virtual',
        acceptedMeetingLink: 'https://meet.google.com/abc-defg-hij',
      };

      await request(appNoAuth.getHttpServer())
        .put('/api/solicitudes/solicitud-123/confirm')
        .send(body)
        .expect(HttpStatus.UNAUTHORIZED);

      await appNoAuth.close();
    });

    /**
     * Caso 7 (Error 404): Solicitud no encontrada.
     *
     * DADO QUE: El ID no corresponde a ninguna solicitud.
     * CUANDO:   Se hace PUT /api/solicitudes/:id/confirm.
     * ENTONCES: Responde 404 Not Found.
     */
    it('debe responder 404 Not Found cuando la solicitud no existe', async () => {
      const error = {
        statusCode: 404,
        message: 'Solicitud no encontrada',
      };
      mockSolicitudesService.acceptSolicitud.mockRejectedValueOnce(
        Object.assign(new Error(error.message), error),
      );

      const body = {
        modalidad: 'Virtual',
        acceptedMeetingLink: 'https://meet.google.com/abc-defg-hij',
      };

      await request(app.getHttpServer())
        .put('/api/solicitudes/id-inexistente/confirm')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.NOT_FOUND);
    });

    /**
     * Caso 8 (Error 400): Solicitud ya procesada (no está PENDIENTE).
     *
     * DADO QUE: La solicitud ya fue aceptada o rechazada.
     * CUANDO:   Se intenta aceptar nuevamente.
     * ENTONCES: Responde 400 Bad Request.
     */
    it('debe responder 400 Bad Request cuando la solicitud no está en estado PENDIENTE', async () => {
      const error = {
        statusCode: 400,
        message: 'Solo se pueden aceptar solicitudes en estado PENDIENTE',
      };
      mockSolicitudesService.acceptSolicitud.mockRejectedValueOnce(
        Object.assign(new Error(error.message), error),
      );

      const body = {
        modalidad: 'Virtual',
        acceptedMeetingLink: 'https://meet.google.com/abc-defg-hij',
      };

      await request(app.getHttpServer())
        .put('/api/solicitudes/solicitud-123/confirm')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
