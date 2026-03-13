/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { SolicitudesController } from '../../src/solicitudes/solicitudes.controller';
import { SolicitudesService } from '../../src/solicitudes/solicitudes.service';
import { SolicitudEstado } from '../../src/solicitudes/entities/solicitud.entity';

/**
 * E2E Tests — SolicitudesController — HU-06: Enviar solicitud de tutoría
 *
 * FASE ROJA del TDD: estos tests FALLARÁN inicialmente porque:
 * 1. SolicitudesController no está completamente implementado.
 * 2. SolicitudesService.verificarSolicitudPrevia y .create lanzan 'Not implemented'.
 * 3. Las validaciones DTO (400) y el guard JWT (401) no están conectados al módulo real.
 *
 * Nota: estudianteId se extrae del JWT (req.user.id), NO del body del request.
 */

// Token JWT de desarrollo (firmado con 'poli-tutorias-dev-secret', sub='test-user-123')
const DEV_JWT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwibmFtZSI6IlR1dG9yIGRlIHBydWViYSIsImlhdCI6MTc1MTAwMDAwMH0.' +
  'pp89wDdOBhsD5iM28iMt1obYqud3xVAUIQlNMiwkl0A';

const mockSolicitudesService = {
  verificarSolicitudPrevia: jest.fn(),
  create: jest.fn(),
};

describe('SolicitudesController (E2E) - HU-06', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SolicitudesController],
      providers: [
        {
          provide: SolicitudesService,
          useValue: mockSolicitudesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: import('@nestjs/common').ExecutionContext) => {
          const req = context
            .switchToHttp()
            .getRequest<{ user: { id: string } }>();
          req.user = { id: 'test-user-123' };
          return true;
        },
      }) // Guard mockeado que inyecta req.user para tests que no prueban 401
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
  // POST /api/solicitudes/verificar-previa
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /api/solicitudes/verificar-previa', () => {
    /**
     * Escenario 1: Verificar solicitud previa exitosamente.
     *
     * DADO QUE: El estudiante tiene JWT válido y envía datos correctos.
     * CUANDO:   Se hace POST /api/solicitudes/verificar-previa.
     * ENTONCES: Responde 200 con estructura VerificarPreviaResponseDto.
     */
    it('debe responder 200 y retornar VerificarPreviaResponseDto cuando no hay solicitud previa', async () => {
      const mockResponse = { existe: false, mensaje: null };
      mockSolicitudesService.verificarSolicitudPrevia.mockResolvedValueOnce(
        mockResponse,
      );

      const body = {
        ofertaId: 'b2c3d4e5-f6a7-4890-b234-567890abcdef',
        horarios: [{ fecha: '2024-03-15', hora: '10:00' }],
      };

      await request(app.getHttpServer())
        .post('/api/solicitudes/verificar-previa')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('existe');
          expect(typeof res.body.existe).toBe('boolean');
          expect(res.body.existe).toBe(false);
          expect(res.body).toHaveProperty('mensaje');
        });
    });

    /**
     * Escenario 1b: Verificar solicitud previa cuando sí existe duplicado.
     *
     * DADO QUE: El estudiante ya envió una solicitud con ese horario.
     * CUANDO:   Se hace POST /api/solicitudes/verificar-previa.
     * ENTONCES: Responde 200 con existe: true y mensaje descriptivo.
     */
    it('debe responder 200 con existe: true cuando hay solicitud PENDIENTE con horario solapado', async () => {
      const mockResponse = {
        existe: true,
        mensaje:
          'Horario ya solicitado. Ya tienes una solicitud activa para este bloque.',
      };
      mockSolicitudesService.verificarSolicitudPrevia.mockResolvedValueOnce(
        mockResponse,
      );

      const body = {
        ofertaId: 'b2c3d4e5-f6a7-4890-b234-567890abcdef',
        horarios: [{ fecha: '2024-03-15', hora: '10:00' }],
      };

      await request(app.getHttpServer())
        .post('/api/solicitudes/verificar-previa')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.existe).toBe(true);
          expect(typeof res.body.mensaje).toBe('string');
          expect(res.body.mensaje).toContain('Horario ya solicitado');
        });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/solicitudes
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /api/solicitudes', () => {
    /**
     * Escenario 2: Crear solicitud exitosamente.
     *
     * DADO QUE: El estudiante tiene JWT válido y todos los datos son correctos.
     * CUANDO:   Se hace POST /api/solicitudes.
     * ENTONCES: Responde 201 con SolicitudResponseDto con estado 'PENDIENTE'.
     */
    it('debe responder 201 y retornar SolicitudResponseDto con estado PENDIENTE', async () => {
      const mockSolicitudResponse = {
        id: 'solicitud-uuid-00001-0000-0000-000000000001',
        estudianteId: 'test-user-123',
        ofertaId: 'b2c3d4e5-f6a7-4890-b234-567890abcdef',
        tutorId: '550e8400-e29b-41d4-a716-446655440001',
        mensaje: 'Necesito apoyo con los temas de límites y derivadas.',
        modalidad: 'Virtual',
        horarios: [{ fecha: '2024-03-15', hora: '10:00' }],
        estado: SolicitudEstado.PENDIENTE,
        createdAt: new Date().toISOString(),
      };

      mockSolicitudesService.create.mockResolvedValueOnce(
        mockSolicitudResponse,
      );

      const body = {
        ofertaId: 'b2c3d4e5-f6a7-4890-b234-567890abcdef',
        mensaje: 'Necesito apoyo con los temas de límites y derivadas.',
        horarios: [{ fecha: '2024-03-15', hora: '10:00' }],
      };

      await request(app.getHttpServer())
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('estudianteId');
          expect(res.body).toHaveProperty('ofertaId');
          expect(res.body).toHaveProperty('tutorId');
          expect(res.body).toHaveProperty('mensaje');
          expect(res.body).toHaveProperty('estado');
          expect(res.body.estado).toBe(SolicitudEstado.PENDIENTE);
          expect(res.body).toHaveProperty('horarios');
          expect(Array.isArray(res.body.horarios)).toBe(true);
          expect(res.body).toHaveProperty('createdAt');
        });
    });

    // ─── Validaciones DTO (400 Bad Request) ──────────────────────────────────

    /**
     * Escenario 3: Mensaje vacío → 400 Bad Request.
     *
     * DADO QUE: El cuerpo del request tiene mensaje: "".
     * CUANDO:   Se hace POST /api/solicitudes.
     * ENTONCES: ValidationPipe retorna 400 con mensaje de error.
     */
    it('debe responder 400 cuando el mensaje está vacío', async () => {
      const body = {
        ofertaId: 'b2c3d4e5-f6a7-4890-b234-567890abcdef',
        mensaje: '',
        horarios: [{ fecha: '2024-03-15', hora: '10:00' }],
      };

      await request(app.getHttpServer())
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.error).toBe('Bad Request');
        });
    });

    /**
     * Escenario 4: Mensaje con más de 500 caracteres → 400 Bad Request.
     *
     * DADO QUE: El mensaje tiene 501 caracteres.
     * CUANDO:   Se hace POST /api/solicitudes.
     * ENTONCES: ValidationPipe retorna 400 con mensaje sobre límite de caracteres.
     */
    it('debe responder 400 cuando el mensaje supera los 500 caracteres', async () => {
      const mensajeLargo = 'A'.repeat(501);

      const body = {
        ofertaId: 'b2c3d4e5-f6a7-4890-b234-567890abcdef',
        mensaje: mensajeLargo,
        horarios: [{ fecha: '2024-03-15', hora: '10:00' }],
      };

      await request(app.getHttpServer())
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          const rawMessage: unknown = res.body.message;
          const messages: string[] = Array.isArray(rawMessage)
            ? (rawMessage as string[])
            : [String(rawMessage)];
          const hasMaxLengthError = messages.some((msg) =>
            msg.toLowerCase().includes('500'),
          );
          expect(hasMaxLengthError).toBe(true);
        });
    });

    /**
     * Escenario 5: Horarios como array vacío → 400 Bad Request.
     *
     * DADO QUE: El body tiene horarios: [].
     * CUANDO:   Se hace POST /api/solicitudes.
     * ENTONCES: ValidationPipe retorna 400 con mensaje sobre horarios requeridos.
     */
    it('debe responder 400 cuando horarios es un array vacío', async () => {
      const body = {
        ofertaId: 'b2c3d4e5-f6a7-4890-b234-567890abcdef',
        mensaje: 'Mensaje válido de prueba para el test.',
        horarios: [],
      };

      await request(app.getHttpServer())
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(body)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.error).toBe('Bad Request');
        });
    });

    /**
     * Escenario 6: Sin token JWT → 401 Unauthorized.
     *
     * DADO QUE: No se envía el header Authorization.
     * CUANDO:   Se hace POST /api/solicitudes.
     * ENTONCES: JwtAuthGuard retorna 401 Unauthorized.
     *
     * NOTA: Este test usa una app separada con el guard REAL (no mockeado).
     */
    it('debe responder 401 cuando no se envía token JWT', async () => {
      // Crear una app separada con el guard REAL para este test
      const moduleWithRealGuard: TestingModule = await Test.createTestingModule(
        {
          controllers: [SolicitudesController],
          providers: [
            {
              provide: SolicitudesService,
              useValue: mockSolicitudesService,
            },
          ],
        },
      ).compile();

      const appWithRealGuard = moduleWithRealGuard.createNestApplication();
      appWithRealGuard.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );
      await appWithRealGuard.init();

      const body = {
        ofertaId: 'b2c3d4e5-f6a7-4890-b234-567890abcdef',
        mensaje: 'Mensaje válido de prueba.',
        horarios: [{ fecha: '2024-03-15', hora: '10:00' }],
      };

      await request(appWithRealGuard.getHttpServer())
        .post('/api/solicitudes')
        .send(body)
        // Sin header Authorization
        .expect(HttpStatus.UNAUTHORIZED);

      await appWithRealGuard.close();
    });
  });
});
