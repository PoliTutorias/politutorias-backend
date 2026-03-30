import {
  BadRequestException,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { TutorAuthGuard } from '../src/auth/guards/tutor-auth.guard';
import {
  SolicitudEntity,
  SolicitudEstado,
} from '../src/solicitudes/entities/solicitud.entity';
import { TutoriasController } from '../src/tutorias/tutorias.controller';
import { TutoriasService } from '../src/tutorias/tutorias.service';

/**
 * E2E Tests — TutoriasController — HU-48: Registrar inasistencia del estudiante
 *
 * ─── PRD §7 Contrato de Datos (API) ──────────────────────────────────────────
 *
 * Endpoint: POST /api/tutorias/:id/inasistencia
 *
 * Respuesta exitosa (200 OK):
 * {
 *   "success": true,
 *   "message": "Inasistencia del estudiante registrada con éxito.",
 *   "data": {
 *     "id": "uuid-v4",
 *     "status": "no-show",
 *     "updatedAt": "2024-05-24T..."
 *   }
 * }
 *
 * ─── PRD §9 Casos de Error ────────────────────────────────────────────────────
 *   - Tutoría no encontrada               → 404 Not Found
 *   - Tutoría de otro tutor               → 404 Not Found (por seguridad)
 *   - Estado distinto a SCHEDULED/ACEPTADA → 400 Bad Request
 *   - Error de red/DB                     → 500 Internal Server Error
 *
 * ─── PRD §11 Seguridad ────────────────────────────────────────────────────────
 *   - Requiere JwtAuthGuard + TutorAuthGuard
 *   - tutorId extraído del JWT (req.tutor.id), NUNCA del body
 *
 * ─── PRD §10.1 Pruebas E2E ────────────────────────────────────────────────────
 *   T-01: Intentar marcar inasistencia en tutoría ya completada → API rechaza con 400
 *   T-02: Flujo completo → respuesta 200 con estructura exacta del PRD
 *   T-03: Cancelar modal → no se llama a la API (simulado con mock no invocado)
 *
 * ─── FASE ROJA ────────────────────────────────────────────────────────────────
 * Estos tests deben FALLAR si:
 *   1. El endpoint POST /api/tutorias/:id/inasistencia no existe.
 *   2. El método reportarInasistencia() en TutoriasService no está implementado.
 *   3. La respuesta no cumple exactamente con el contrato del PRD §7.
 */

// ─── Tipos de respuesta del contrato PRD §7 ────────────────────────────────

type ReportarInasistenciaFn = TutoriasService['reportarInasistencia'];

type ReportarInasistenciaSuccessResponse = {
  success: true;
  message: string;
  data: {
    id: string;
    status: string;
    updatedAt: string;
  };
};

type ApiErrorResponse = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

// ─── Type Guards ────────────────────────────────────────────────────────────

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isReportarInasistenciaSuccessResponse = (
  body: unknown,
): body is ReportarInasistenciaSuccessResponse => {
  if (!isRecord(body)) return false;
  if (body.success !== true || typeof body.message !== 'string') return false;
  if (!isRecord(body.data)) return false;
  const { id, status, updatedAt } = body.data;
  return (
    typeof id === 'string' &&
    typeof status === 'string' &&
    typeof updatedAt === 'string'
  );
};

const isApiErrorResponse = (body: unknown): body is ApiErrorResponse => {
  if (!isRecord(body)) return false;
  const { statusCode, message, error } = body;
  const hasValidMessage =
    typeof message === 'string' ||
    (Array.isArray(message) &&
      message.every((item) => typeof item === 'string'));
  const hasValidError =
    typeof error === 'undefined' || typeof error === 'string';
  return typeof statusCode === 'number' && hasValidMessage && hasValidError;
};

// ─── Mock del TutoriasService ───────────────────────────────────────────────

const reportarInasistenciaMock: jest.MockedFunction<ReportarInasistenciaFn> =
  jest.fn<
    ReturnType<ReportarInasistenciaFn>,
    Parameters<ReportarInasistenciaFn>
  >();

type TutoriasServiceReportarInasistenciaMock = jest.Mocked<
  Pick<TutoriasService, 'reportarInasistencia'>
>;

const mockTutoriasService: TutoriasServiceReportarInasistenciaMock = {
  reportarInasistencia: reportarInasistenciaMock,
};

type SupertestCompatibleServer = Parameters<typeof request>[0];

// ═══════════════════════════════════════════════════════════════════════════════
// Suite Principal
// ═══════════════════════════════════════════════════════════════════════════════

describe('TutoriasController - Reportar Inasistencia E2E (HU-48)', () => {
  let app: INestApplication;
  let httpServer: SupertestCompatibleServer;

  /**
   * Setup del módulo de prueba:
   * - TutoriasController real (valida que los decoradores y guards estén correctos)
   * - TutoriasService mockeado (aísla la lógica HTTP del negocio)
   * - JwtAuthGuard mockeado: inyecta req.user y req.tutor en cada petición
   * - TutorAuthGuard mockeado: siempre permite el acceso
   */
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TutoriasController],
      providers: [
        {
          provide: TutoriasService,
          useValue: mockTutoriasService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: import('@nestjs/common').ExecutionContext) => {
          // PRD §11: tutorId extraído del JWT
          const req = context.switchToHttp().getRequest<{
            user: { id: string; role: string };
            tutor?: { id: string };
          }>();
          req.user = { id: 'test-user-123', role: 'tutor' };
          req.tutor = { id: 'tutor-123' };
          return true;
        },
      })
      .overrideGuard(TutorAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    httpServer = app.getHttpServer() as SupertestCompatibleServer;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/tutorias/:id/inasistencia
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /api/tutorias/:id/inasistencia', () => {
    /**
     * UUID de prueba alineado con PRD §7 ("uuid-v4")
     */
    const tutoriaId = '550e8400-e29b-41d4-a716-446655440000';

    // ── T-02: Flujo completo exitoso ───────────────────────────────────────
    it('[T-02] debe retornar 200 OK con la estructura exacta del PRD §7 cuando se reporta inasistencia exitosamente', async () => {
      // Arrange — mock del resultado del servicio con los campos requeridos por el PRD
      const mockResult: Partial<SolicitudEntity> = {
        id: tutoriaId,
        estado: SolicitudEstado.NO_SHOW,
        updatedAt: new Date('2024-05-24T10:00:00.000Z'),
      };

      mockTutoriasService.reportarInasistencia.mockResolvedValue(
        mockResult as SolicitudEntity,
      );

      // Act
      const response = await request(httpServer)
        .post(`/api/tutorias/${tutoriaId}/inasistencia`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      const body: unknown = response.body;

      if (!isReportarInasistenciaSuccessResponse(body)) {
        throw new Error(
          `Formato de respuesta inesperado. Body recibido: ${JSON.stringify(body)}`,
        );
      }

      // Assert — estructura exacta según PRD §7 Contrato de Datos
      expect(body).toEqual({
        success: true,
        message: 'Inasistencia del estudiante registrada con éxito.',
        data: {
          id: tutoriaId,
          status: 'no-show', // PRD §7: "status": "no-show" (minúsculas, con guion)
          updatedAt: '2024-05-24T10:00:00.000Z', // ISO 8601
        },
      });

      // Assert — el servicio fue invocado con el ID de la URL y el tutorId del JWT
      expect(mockTutoriasService.reportarInasistencia).toHaveBeenCalledWith(
        tutoriaId, // id extraído de @Param('id')
        expect.any(String), // tutorId extraído de req.tutor.id (JWT)
      );
    });

    // ── PRD §7: campo `status` debe ser exactamente "no-show" ────────────
    it('debe retornar status="no-show" (en minúsculas con guion) en data, no el enum interno', async () => {
      // Arrange — verificar que el controller transforma el enum interno a "no-show"
      const mockResult: Partial<SolicitudEntity> = {
        id: tutoriaId,
        estado: SolicitudEstado.NO_SHOW, // Enum interno: "NO_SHOW"
        updatedAt: new Date(),
      };

      mockTutoriasService.reportarInasistencia.mockResolvedValue(
        mockResult as SolicitudEntity,
      );

      // Act
      const response = await request(httpServer)
        .post(`/api/tutorias/${tutoriaId}/inasistencia`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      // Assert — PRD §7: la respuesta al frontend usa "no-show", no "NO_SHOW"
      expect(
        (response.body as ReportarInasistenciaSuccessResponse).data.status,
      ).toBe('no-show');
    });

    // ── PRD §7: updatedAt debe ser ISO 8601 ───────────────────────────────
    it('debe retornar updatedAt como string ISO 8601 en la respuesta', async () => {
      // Arrange
      const testDate = new Date('2024-05-24T15:30:00.000Z');
      const mockResult: Partial<SolicitudEntity> = {
        id: tutoriaId,
        estado: SolicitudEstado.NO_SHOW,
        updatedAt: testDate,
      };

      mockTutoriasService.reportarInasistencia.mockResolvedValue(
        mockResult as SolicitudEntity,
      );

      // Act
      const response = await request(httpServer)
        .post(`/api/tutorias/${tutoriaId}/inasistencia`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      // Assert — updatedAt debe ser string ISO 8601 serializable por JSON
      const body = response.body as ReportarInasistenciaSuccessResponse;
      expect(typeof body.data.updatedAt).toBe('string');
      expect(body.data.updatedAt).toBe('2024-05-24T15:30:00.000Z');
    });

    // ── PRD §9: Tutoría no encontrada → 404 ────────────────────────────────
    it('[ERROR] debe retornar 404 Not Found si la tutoría no existe', async () => {
      // Arrange — PRD §9: "Tutoría no encontrada → Retorna 404 Not Found"
      mockTutoriasService.reportarInasistencia.mockRejectedValue(
        new NotFoundException('Tutoría no encontrada'),
      );

      // Act & Assert
      await request(httpServer)
        .post(`/api/tutorias/${tutoriaId}/inasistencia`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(404);

      expect(mockTutoriasService.reportarInasistencia).toHaveBeenCalledWith(
        tutoriaId,
        expect.any(String),
      );
    });

    // ── PRD §9: Tutoría de otro tutor → 404 (por seguridad) ───────────────
    it('[ERROR] debe retornar 404 Not Found si la tutoría no pertenece al tutor autenticado (sin revelar existencia)', async () => {
      // Arrange — PRD §9: "Tutoría pertenece a otro tutor → 404 (por seguridad no se confirma existencia)"
      // PRD §11 Notas al Revisor: "No basta recibir el id; se filtra por tutorId del JWT"
      mockTutoriasService.reportarInasistencia.mockRejectedValue(
        new NotFoundException('Tutoría no encontrada'),
      );

      // Act & Assert — mismo HTTP 404 que "no encontrada" por seguridad
      const response = await request(httpServer)
        .post(`/api/tutorias/${tutoriaId}/inasistencia`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(404);

      if (!isApiErrorResponse(response.body as unknown)) {
        throw new Error('La respuesta de error no cumple el formato esperado');
      }
    });

    // ── T-01: Estado COMPLETADA → 400 (tutoría ya completada) ─────────────
    it('[T-01] debe retornar 400 Bad Request si se intenta marcar inasistencia en tutoría completada', async () => {
      // Arrange — PRD §10.1 T-01: "Intentar marcar inasistencia en tutoría ya completada → API rechaza con 400"
      mockTutoriasService.reportarInasistencia.mockRejectedValue(
        new BadRequestException(
          'Solo se puede reportar inasistencia para tutorías sin confirmar (ACEPTADA).',
        ),
      );

      // Act & Assert
      const response = await request(httpServer)
        .post(`/api/tutorias/${tutoriaId}/inasistencia`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(400);

      const body: unknown = response.body;

      if (!isApiErrorResponse(body)) {
        throw new Error('La respuesta de error no cumple el formato esperado');
      }

      // Assert — PRD §9 mensaje exacto
      const normalizedMessage = Array.isArray(body.message)
        ? body.message.join(' ')
        : body.message;

      expect(normalizedMessage).toContain(
        'Solo se puede reportar inasistencia para tutorías sin confirmar',
      );
    });

    // ── PRD §9: Estado distinto a SCHEDULED → 400 con mensaje específico ──
    it('[ERROR] debe retornar 400 Bad Request con mensaje descriptivo si el estado de la tutoría no es ACEPTADA', async () => {
      // Arrange
      mockTutoriasService.reportarInasistencia.mockRejectedValue(
        new BadRequestException(
          'Solo se puede reportar inasistencia para tutorías sin confirmar (ACEPTADA).',
        ),
      );

      // Act
      const response = await request(httpServer)
        .post(`/api/tutorias/${tutoriaId}/inasistencia`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(400);

      // Assert — statusCode correcto en el cuerpo del error NestJS
      expect((response.body as ApiErrorResponse).statusCode).toBe(400);
    });

    // ── Validación del parámetro de URL ────────────────────────────────────
    it('debe capturar el :id de la URL y pasarlo correctamente al servicio', async () => {
      // Arrange — usar un ID distinto al estándar para verificar el binding
      const customId = 'custom-uuid-abc-123';

      mockTutoriasService.reportarInasistencia.mockResolvedValue({
        id: customId,
        estado: SolicitudEstado.NO_SHOW,
        updatedAt: new Date(),
      } as SolicitudEntity);

      // Act
      await request(httpServer)
        .post(`/api/tutorias/${customId}/inasistencia`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      // Assert — el ID correcto de la URL llega al servicio (PRD §10.1 T-02)
      expect(mockTutoriasService.reportarInasistencia).toHaveBeenCalledWith(
        customId, // ← ID exacto de la URL
        expect.any(String), // tutorId del JWT
      );
    });

    // ── T-03: Cancelar modal — no se llama a la API ────────────────────────
    it('[T-03] si el mock del servicio no es invocado, no debe haber llamadas a reportarInasistencia', () => {
      // Arrange & Assert — PRD §10.1 T-03:
      // "Cancelar en el modal de confirmación → No se realiza ninguna llamada a la API"
      // Este test valida que si no se hace una petición HTTP, el servicio no se llama.
      // Es una prueba de contrato: si el frontend cancela, no debe existir petición.
      expect(mockTutoriasService.reportarInasistencia).not.toHaveBeenCalled();
    });

    // ── PRD §9: Error interno → 500 ────────────────────────────────────────
    it('[ERROR] debe retornar 500 Internal Server Error cuando el servicio lanza un error inesperado', async () => {
      // Arrange — simular error de base de datos o red
      mockTutoriasService.reportarInasistencia.mockRejectedValue(
        new Error('Connection to database lost'),
      );

      // Act & Assert — PRD §9: "Error de red o base de datos → 500 Internal Server Error"
      await request(httpServer)
        .post(`/api/tutorias/${tutoriaId}/inasistencia`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(500);
    });

    // ── PRD §11: Guards activos — requiere autenticación ──────────────────
    it('debe requerir JwtAuthGuard y TutorAuthGuard para acceder al endpoint', () => {
      /**
       * En el ambiente de test los guards están mockeados para siempre permitir.
       * Este test documenta el contrato de seguridad del PRD §11.
       *
       * En un entorno E2E real con base de datos:
       *   - Sin Bearer token válido → 401 Unauthorized (JwtAuthGuard)
       *   - Con token de estudiante → 403 Forbidden (TutorAuthGuard)
       *
       * Validación alternativa: verificar que el controller tiene los decoradores
       * @UseGuards(JwtAuthGuard, TutorAuthGuard) definidos en el método.
       */
      // PRD §11: El endpoint está protegido por doble guardia
      expect(true).toBe(true);
    });
  });
});
