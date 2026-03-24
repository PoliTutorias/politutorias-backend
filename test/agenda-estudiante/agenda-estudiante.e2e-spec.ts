/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  ForbiddenException,
  HttpStatus,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { AgendaEstudianteController } from '../../src/agenda-estudiante/agenda-estudiante.controller';
import { AgendaEstudianteService } from '../../src/agenda-estudiante/agenda-estudiante.service';
import { IsSolicitudOwnerGuard } from '../../src/agenda-estudiante/guards/is-solicitud-owner.guard';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * E2E Tests — AgendaEstudianteController — HU11: Ver tutorías agendadas
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Objetivo: Validar el CONTRATO HTTP (status codes, estructura de respuesta
 * y seguridad) mockeando completamente el servicio de negocio.
 *
 * Token JWT de desarrollo firmado con 'poli-tutorias-dev-secret',
 * sub='test-student-123', role='student'.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Token válido para estudiante (sub='test-student-123')
const STUDENT_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ0ZXN0LXN0dWRlbnQtMTIzIiwibmFtZSI6IkVzdHVkaWFudGUgdGVzdCIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzUxMDAwMDAwfQ.' +
  'placeholder-signature-will-not-verify';

const STUDENT_ID = 'test-student-123';
const SESSION_ID_VIRTUAL = 'session-uuid-0001-0000-0000-000000000001';
const SESSION_ID_PRESENCIAL = 'session-uuid-0002-0000-0000-000000000002';

// ─── Fixtures de respuesta del servicio ──────────────────────────────────────

/** Fixture: respuesta completa del listado de agenda */
const mockAgendaResponse = {
  proximas: [
    {
      id: SESSION_ID_VIRTUAL,
      tutorName: 'Juan Pérez',
      tutorAvatarUrl: 'https://example.com/avatars/juan.jpg',
      subjectName: 'Cálculo I',
      date: '2099-07-25T10:00:00.000Z',
      time: '10:00',
      modality: 'Virtual',
      status: 'ACEPTADA',
    },
  ],
  anteriores: [
    {
      id: SESSION_ID_PRESENCIAL,
      tutorName: 'María López',
      tutorAvatarUrl: 'https://example.com/avatars/maria.jpg',
      subjectName: 'Álgebra Lineal',
      date: '2020-01-10T09:00:00.000Z',
      time: '09:00',
      modality: 'Presencial',
      status: 'COMPLETED',
    },
  ],
  totalProximas: 1,
  totalAnteriores: 1,
  currentPage: 1,
  totalPagesAnteriores: 1,
};

/** Fixture: detalle de sesión virtual */
const mockDetailVirtual = {
  id: SESSION_ID_VIRTUAL,
  tutorName: 'Juan Pérez',
  tutorAvatarUrl: 'https://example.com/avatars/juan.jpg',
  subjectName: 'Cálculo I',
  date: '2099-07-25T10:00:00.000Z',
  time: '10:00',
  modality: 'Virtual',
  status: 'ACEPTADA',
  meetingLink: 'https://zoom.us/j/123456789',
  meetingLocation: null,
  studentMessage: 'Necesito ayuda con límites y derivadas.',
  price: 25000,
};

/** Fixture: detalle de sesión presencial */
const mockDetailPresencial = {
  id: SESSION_ID_PRESENCIAL,
  tutorName: 'María López',
  tutorAvatarUrl: 'https://example.com/avatars/maria.jpg',
  subjectName: 'Álgebra Lineal',
  date: '2020-01-10T09:00:00.000Z',
  time: '09:00',
  modality: 'Presencial',
  status: 'COMPLETED',
  meetingLink: null,
  meetingLocation: 'Biblioteca Central, Piso 2',
  studentMessage: 'Quiero repasar los temas del parcial.',
  price: 20000,
};

// ─── Mock del servicio ────────────────────────────────────────────────────────

const mockAgendaEstudianteService = {
  getStudentAgenda: jest.fn(),
  getSessionDetails: jest.fn(),
};

// ─────────────────────────────────────────────────────────────────────────────
// Suite principal
// ─────────────────────────────────────────────────────────────────────────────

describe('AgendaEstudianteController (E2E) — HU11', () => {
  let app: INestApplication;

  // ─── Configuración del módulo de prueba ──────────────────────────────────

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AgendaEstudianteController],
      providers: [
        {
          provide: AgendaEstudianteService,
          useValue: mockAgendaEstudianteService,
        },
      ],
    })
      // JwtAuthGuard mockeado: inyecta req.user para todos los tests
      // que NO prueban el 401 (que usan una app aparte con el guard real).
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: import('@nestjs/common').ExecutionContext) => {
          const req = context
            .switchToHttp()
            .getRequest<{ user: { id: string; role: string } }>();
          req.user = { id: STUDENT_ID, role: 'student' };
          return true;
        },
      })
      // IsSolicitudOwnerGuard mockeado: por defecto permite el acceso.
      // Se sobreescribe en el test de 403.
      .overrideGuard(IsSolicitudOwnerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/estudiante/agenda — Listado de agenda
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/estudiante/agenda', () => {
    /**
     * Escenario 1 — Happy Path
     *
     * DADO QUE: El estudiante tiene JWT válido y no envía query params adicionales.
     * CUANDO:   GET /api/estudiante/agenda
     * ENTONCES: Responde 200 con estructura EstudianteAgendaResponseDto
     *           que contiene las secciones "proximas" y "anteriores".
     */
    it('debe responder 200 con la estructura EstudianteAgendaResponseDto (proximas/anteriores)', async () => {
      mockAgendaEstudianteService.getStudentAgenda.mockResolvedValueOnce(
        mockAgendaResponse,
      );

      await request(app.getHttpServer())
        .get('/api/estudiante/agenda')
        .set('Authorization', `Bearer ${STUDENT_JWT}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          // Estructura de primer nivel
          expect(res.body).toHaveProperty('proximas');
          expect(res.body).toHaveProperty('anteriores');
          expect(res.body).toHaveProperty('totalProximas');
          expect(res.body).toHaveProperty('totalAnteriores');
          expect(Array.isArray(res.body.proximas)).toBe(true);
          expect(Array.isArray(res.body.anteriores)).toBe(true);

          // Estructura de un item en "proximas"
          const proxima = res.body.proximas[0] as Record<string, unknown>;
          expect(proxima).toHaveProperty('id');
          expect(proxima).toHaveProperty('tutorName');
          expect(proxima).toHaveProperty('subjectName');
          expect(proxima).toHaveProperty('date');
          expect(proxima).toHaveProperty('time');
          expect(proxima).toHaveProperty('modality');
          expect(proxima).toHaveProperty('status');
          expect(proxima.status).toBe('ACEPTADA');

          // Estructura de un item en "anteriores"
          const anterior = res.body.anteriores[0] as Record<string, unknown>;
          expect(anterior).toHaveProperty('id');
          expect(anterior.status).toBe('COMPLETED');
        });
    });

    /**
     * Escenario 1b — Paginación válida
     *
     * DADO QUE: El estudiante envía page=2 y limit=5 como query params.
     * CUANDO:   GET /api/estudiante/agenda?page=2&limit=5
     * ENTONCES: Responde 200 y el servicio es llamado con page=2, limit=5.
     */
    it('debe responder 200 y pasar page/limit correctos al servicio cuando los params son válidos', async () => {
      mockAgendaEstudianteService.getStudentAgenda.mockResolvedValueOnce({
        ...mockAgendaResponse,
        currentPage: 2,
      });

      await request(app.getHttpServer())
        .get('/api/estudiante/agenda?page=2&limit=5')
        .set('Authorization', `Bearer ${STUDENT_JWT}`)
        .expect(HttpStatus.OK)
        .expect(() => {
          expect(
            mockAgendaEstudianteService.getStudentAgenda,
          ).toHaveBeenCalledWith(
            STUDENT_ID,
            expect.objectContaining({ page: 2, limit: 5 }),
          );
        });
    });

    /**
     * Escenario 2 — Paginación inválida (400)
     *
     * DADO QUE: El estudiante envía page='abc' (no numérico).
     * CUANDO:   GET /api/estudiante/agenda?page=abc&limit=5
     * ENTONCES: ValidationPipe retorna 400 Bad Request.
     */
    it('debe responder 400 cuando los query params de paginación son inválidos (page=abc)', async () => {
      await request(app.getHttpServer())
        .get('/api/estudiante/agenda?page=abc&limit=5')
        .set('Authorization', `Bearer ${STUDENT_JWT}`)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.error).toBe('Bad Request');
        });
    });

    /**
     * Escenario 2b — Paginación con limit negativo (400)
     *
     * DADO QUE: El estudiante envía limit=-1.
     * CUANDO:   GET /api/estudiante/agenda?page=1&limit=-1
     * ENTONCES: ValidationPipe retorna 400 Bad Request.
     */
    it('debe responder 400 cuando limit es un número negativo', async () => {
      await request(app.getHttpServer())
        .get('/api/estudiante/agenda?page=1&limit=-1')
        .set('Authorization', `Bearer ${STUDENT_JWT}`)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
        });
    });

    /**
     * Escenario 3 — Sin token JWT (401)
     *
     * DADO QUE: No se envía el header Authorization.
     * CUANDO:   GET /api/estudiante/agenda (sin token)
     * ENTONCES: JwtAuthGuard retorna 401 Unauthorized.
     *
     * NOTA: Este test usa una app separada con el JwtAuthGuard REAL.
     */
    it('debe responder 401 cuando no se envía el Bearer Token', async () => {
      const moduleWithRealGuard = await Test.createTestingModule({
        controllers: [AgendaEstudianteController],
        providers: [
          {
            provide: AgendaEstudianteService,
            useValue: mockAgendaEstudianteService,
          },
        ],
      })
        .overrideGuard(IsSolicitudOwnerGuard)
        .useValue({ canActivate: () => true })
        .compile();

      const appWithRealGuard = moduleWithRealGuard.createNestApplication();
      appWithRealGuard.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true }),
      );
      await appWithRealGuard.init();

      await request(appWithRealGuard.getHttpServer())
        .get('/api/estudiante/agenda')
        // Sin header Authorization
        .expect(HttpStatus.UNAUTHORIZED);

      await appWithRealGuard.close();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/estudiante/agenda/:id — Detalle de sesión
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/estudiante/agenda/:id', () => {
    /**
     * Escenario 4 — Detalle de tutoría Virtual (200)
     *
     * DADO QUE: El estudiante tiene JWT válido y la sesión es de modalidad Virtual.
     * CUANDO:   GET /api/estudiante/agenda/:id
     * ENTONCES: Responde 200 con AgendaStudentDetailDTO que incluye meetingLink
     *           y meetingLocation como null.
     */
    it('debe responder 200 con AgendaStudentDetailDTO que incluye meetingLink para sesión Virtual', async () => {
      mockAgendaEstudianteService.getSessionDetails.mockResolvedValueOnce(
        mockDetailVirtual,
      );

      await request(app.getHttpServer())
        .get(`/api/estudiante/agenda/${SESSION_ID_VIRTUAL}`)
        .set('Authorization', `Bearer ${STUDENT_JWT}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as Record<string, unknown>;

          // Campos base obligatorios
          expect(body).toHaveProperty('id', SESSION_ID_VIRTUAL);
          expect(body).toHaveProperty('tutorName');
          expect(body).toHaveProperty('subjectName');
          expect(body).toHaveProperty('date');
          expect(body).toHaveProperty('time');
          expect(body).toHaveProperty('modality', 'Virtual');
          expect(body).toHaveProperty('status');
          expect(body).toHaveProperty('studentMessage');

          // Campos condicionales — Virtual: meetingLink presente, meetingLocation null
          expect(body).toHaveProperty('meetingLink');
          expect(typeof body.meetingLink).toBe('string');
          expect((body.meetingLink as string).startsWith('http')).toBe(true);
          expect(body.meetingLocation).toBeNull();
        });
    });

    /**
     * Escenario 5 — Detalle de tutoría Presencial (200)
     *
     * DADO QUE: El estudiante tiene JWT válido y la sesión es de modalidad Presencial.
     * CUANDO:   GET /api/estudiante/agenda/:id
     * ENTONCES: Responde 200 con AgendaStudentDetailDTO que incluye meetingLocation
     *           y meetingLink como null.
     */
    it('debe responder 200 con AgendaStudentDetailDTO que incluye meetingLocation para sesión Presencial', async () => {
      mockAgendaEstudianteService.getSessionDetails.mockResolvedValueOnce(
        mockDetailPresencial,
      );

      await request(app.getHttpServer())
        .get(`/api/estudiante/agenda/${SESSION_ID_PRESENCIAL}`)
        .set('Authorization', `Bearer ${STUDENT_JWT}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as Record<string, unknown>;

          expect(body).toHaveProperty('id', SESSION_ID_PRESENCIAL);
          expect(body).toHaveProperty('modality', 'Presencial');

          // Campos condicionales — Presencial: meetingLocation presente, meetingLink null
          expect(body).toHaveProperty('meetingLocation');
          expect(typeof body.meetingLocation).toBe('string');
          expect(body.meetingLink).toBeNull();
        });
    });

    /**
     * Escenario 6 — 403 Forbidden (IsSolicitudOwnerGuard falla)
     *
     * DADO QUE: El estudiante intenta ver el detalle de una tutoría que NO le pertenece.
     * CUANDO:   GET /api/estudiante/agenda/:id (con un id de otro estudiante)
     * ENTONCES: IsSolicitudOwnerGuard retorna 403 Forbidden.
     *
     * NOTA: Se crea una app separada donde el guard retorna false para simular la denegación.
     */
    it('debe responder 403 cuando el IsSolicitudOwnerGuard deniega el acceso', async () => {
      const moduleWith403: TestingModule = await Test.createTestingModule({
        controllers: [AgendaEstudianteController],
        providers: [
          {
            provide: AgendaEstudianteService,
            useValue: mockAgendaEstudianteService,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          canActivate: (context: import('@nestjs/common').ExecutionContext) => {
            const req = context
              .switchToHttp()
              .getRequest<{ user: { id: string; role: string } }>();
            req.user = { id: STUDENT_ID, role: 'student' };
            return true;
          },
        })
        // Guard de propiedad configurado para denegar
        .overrideGuard(IsSolicitudOwnerGuard)
        .useValue({
          canActivate: () => {
            throw new ForbiddenException(
              'No tienes permiso para ver esta tutoría.',
            );
          },
        })
        .compile();

      const appWith403 = moduleWith403.createNestApplication();
      appWith403.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true }),
      );
      await appWith403.init();

      await request(appWith403.getHttpServer())
        .get(`/api/estudiante/agenda/${SESSION_ID_VIRTUAL}`)
        .set('Authorization', `Bearer ${STUDENT_JWT}`)
        .expect(HttpStatus.FORBIDDEN);

      await appWith403.close();
    });

    /**
     * Escenario 7 — 404 Not Found (sesión inexistente)
     *
     * DADO QUE: El ID de sesión no existe en la base de datos.
     * CUANDO:   GET /api/estudiante/agenda/id-inexistente
     * ENTONCES: El servicio lanza NotFoundException y el endpoint retorna 404.
     */
    it('debe responder 404 cuando el servicio no encuentra la sesión', async () => {
      mockAgendaEstudianteService.getSessionDetails.mockRejectedValueOnce(
        new NotFoundException('Tutoría no encontrada.'),
      );

      await request(app.getHttpServer())
        .get('/api/estudiante/agenda/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${STUDENT_JWT}`)
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body.statusCode).toBe(404);
        });
    });

    /**
     * Escenario 8 — Sin token JWT en /:id (401)
     *
     * DADO QUE: No se envía el header Authorization al acceder al detalle.
     * CUANDO:   GET /api/estudiante/agenda/:id (sin token)
     * ENTONCES: JwtAuthGuard retorna 401 Unauthorized.
     *
     * NOTA: Este test usa una app separada con el JwtAuthGuard REAL.
     */
    it('debe responder 401 cuando no se envía token al acceder al detalle', async () => {
      const moduleWithRealGuard = await Test.createTestingModule({
        controllers: [AgendaEstudianteController],
        providers: [
          {
            provide: AgendaEstudianteService,
            useValue: mockAgendaEstudianteService,
          },
        ],
      })
        .overrideGuard(IsSolicitudOwnerGuard)
        .useValue({ canActivate: () => true })
        .compile();

      const appWithRealGuard = moduleWithRealGuard.createNestApplication();
      appWithRealGuard.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true }),
      );
      await appWithRealGuard.init();

      await request(appWithRealGuard.getHttpServer())
        .get(`/api/estudiante/agenda/${SESSION_ID_VIRTUAL}`)
        // Sin header Authorization
        .expect(HttpStatus.UNAUTHORIZED);

      await appWithRealGuard.close();
    });

    /**
     * Escenario 9 — Verificar que el servicio es invocado con el ID correcto
     *
     * DADO QUE: El estudiante hace una petición válida con ID de sesión.
     * CUANDO:   GET /api/estudiante/agenda/:id
     * ENTONCES: El servicio es llamado exactamente con el studentId del JWT y el id del path.
     */
    it('debe invocar al servicio con el studentId del JWT y el id del path param', async () => {
      mockAgendaEstudianteService.getSessionDetails.mockResolvedValueOnce(
        mockDetailVirtual,
      );

      await request(app.getHttpServer())
        .get(`/api/estudiante/agenda/${SESSION_ID_VIRTUAL}`)
        .set('Authorization', `Bearer ${STUDENT_JWT}`)
        .expect(HttpStatus.OK);

      expect(
        mockAgendaEstudianteService.getSessionDetails,
      ).toHaveBeenCalledWith(STUDENT_ID, SESSION_ID_VIRTUAL);
    });
  });
});
