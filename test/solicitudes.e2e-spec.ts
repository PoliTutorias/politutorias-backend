/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ForbiddenException,
  HttpStatus,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { TutorAuthGuard } from '../src/auth/guards/tutor-auth.guard';
import { SolicitudesController } from '../src/solicitudes/solicitudes.controller';
import { SolicitudesService } from '../src/solicitudes/solicitudes.service';
import { SolicitudEstado } from '../src/solicitudes/entities/solicitud.entity';
import { DEV_JWT_TOKEN } from '../src/auth/jwt.constants';
import { Tutor } from '../src/tutors/entities/tutor.entity';

/**
 * E2E Tests — SolicitudesController — HU09: Ver solicitudes recibidas
 *
 * Patrón: SolicitudesService se mockea completamente.
 * JwtAuthGuard y TutorAuthGuard se sobreescriben con .overrideGuard().
 */

// ─── Mock del service ─────────────────────────────────────────────────────────

const mockSolicitudesService = {
  verificarSolicitudPrevia: jest.fn(),
  create: jest.fn(),
  getCountsByStatus: jest.fn(),
  getFiltered: jest.fn(),
};

// Mock tutor que se resuelve del userId
const MOCK_TUTOR = { id: 'tutor-uuid-001', userId: 'test-user-123' };

// Mock Tutor repository for HU-09 (returns tutor for test user)
const mockTutorRepositoryHU09 = {
  findOne: jest.fn().mockResolvedValue(MOCK_TUTOR), // Returns tutor for tutors
};

// ─── Mock de datos ────────────────────────────────────────────────────────────

const mockCounts = { pending: 5, expired: 2, responded: 3 };

const mockSolicitudItem = {
  id: 'solicitud-uuid-001',
  nombreEstudiante: 'Ana García',
  materia: 'Cálculo Diferencial',
  fechaHora: '25 may 2024 10:30',
  mensajeResumen: 'Necesito ayuda con los temas de límites...',
  estado: SolicitudEstado.PENDIENTE,
  modalidad: 'Virtual',
  precioHora: 20,
  mensajeCompleto:
    'Necesito ayuda con los temas de límites y derivadas para el examen.',
};

const mockPaginatedResponse = {
  data: [mockSolicitudItem],
  total: 1,
  currentPage: 1,
  itemsPerPage: 10,
  totalPages: 1,
};

const mockEmptyPaginatedResponse = {
  data: [],
  total: 0,
  currentPage: 1,
  itemsPerPage: 10,
  totalPages: 0,
};

// ─── Helper: crear app con configuración ────────────────────────────────────

type GuardOverride = object | null;

async function buildApp(
  jwtGuardOverride: GuardOverride,
  tutorGuardOverride: GuardOverride,
): Promise<INestApplication> {
  let builder = Test.createTestingModule({
    controllers: [SolicitudesController],
    providers: [
      {
        provide: SolicitudesService,
        useValue: mockSolicitudesService,
      },
      {
        provide: getRepositoryToken(Tutor),
        useValue: mockTutorRepositoryHU09,
      },
    ],
  });

  if (jwtGuardOverride !== null) {
    builder = builder.overrideGuard(JwtAuthGuard).useValue(jwtGuardOverride);
  }

  // TutorAuthGuard siempre se sobreescribe con un mock (evita resolver @InjectRepository en tests)
  const tutorMock = tutorGuardOverride ?? { canActivate: () => true };
  builder = builder.overrideGuard(TutorAuthGuard).useValue(tutorMock);

  const moduleFixture: TestingModule = await builder.compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

// ─── Suite principal ──────────────────────────────────────────────────────────

describe('SolicitudesController (E2E) - HU09: Ver solicitudes recibidas', () => {
  /** App con guards mockeados: inyecta req.user y req.tutor */
  let app: INestApplication;
  /** App con JwtAuthGuard REAL: prueba el 401 (sin token) */
  let appSinToken: INestApplication;
  /** App con TutorAuthGuard que lanza ForbiddenException: prueba el 403 (sin rol tutor) */
  let appSinRolTutor: INestApplication;

  beforeEach(async () => {
    // App principal: tutor autenticado válido — ambos guards mockeados
    app = await buildApp(
      {
        canActivate: (context: import('@nestjs/common').ExecutionContext) => {
          const req = context
            .switchToHttp()
            .getRequest<{ user: { id: string; role: string } }>();
          req.user = { id: 'test-user-123', role: 'tutor' };
          return true;
        },
      },
      {
        canActivate: (context: import('@nestjs/common').ExecutionContext) => {
          const req = context
            .switchToHttp()
            .getRequest<{ tutor: typeof MOCK_TUTOR }>();
          req.tutor = MOCK_TUTOR;
          return true;
        },
      },
    );

    // App sin token: JwtAuthGuard REAL → 401. TutorAuthGuard mockeado (no llega a ejecutarse).
    appSinToken = await buildApp(null, {
      canActivate: () => true,
    });

    // App sin rol tutor: JwtAuthGuard pasa, TutorAuthGuard lanza ForbiddenException → 403
    appSinRolTutor = await buildApp(
      {
        canActivate: () => true,
      },
      {
        canActivate: () => {
          throw new ForbiddenException(
            'Solo los tutores pueden acceder a este recurso.',
          );
        },
      },
    );
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
    await appSinToken.close();
    await appSinRolTutor.close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/solicitudes/counts
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/solicitudes/counts', () => {
    /**
     * Escenario: Sin token JWT → 401.
     *
     * DADO QUE: No se envía el header Authorization.
     * CUANDO:   GET /api/solicitudes/counts.
     * ENTONCES: JwtAuthGuard (real) retorna 401 Unauthorized.
     */
    it('debe retornar 401 cuando no se envía token JWT', async () => {
      await request(appSinToken.getHttpServer())
        .get('/api/solicitudes/counts')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    /**
     * Escenario: Usuario sin perfil tutor → 403.
     *
     * DADO QUE: El usuario está autenticado pero no tiene rol de tutor.
     * CUANDO:   GET /api/solicitudes/counts.
     * ENTONCES: TutorAuthGuard retorna 403 Forbidden.
     */
    it('debe retornar 403 cuando el usuario no tiene perfil de tutor', async () => {
      await request(appSinRolTutor.getHttpServer())
        .get('/api/solicitudes/counts')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    /**
     * Escenario: Tutor autenticado → 200 con estructura GlobalCountsDto.
     *
     * DADO QUE: El tutor envía JWT válido.
     * CUANDO:   GET /api/solicitudes/counts.
     * ENTONCES: Responde 200 con { pending, expired, responded } numéricos.
     */
    it('debe retornar 200 con estructura GlobalCountsDto cuando el tutor tiene token válido', async () => {
      mockSolicitudesService.getCountsByStatus.mockResolvedValueOnce(
        mockCounts,
      );

      await request(app.getHttpServer())
        .get('/api/solicitudes/counts')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('pending');
          expect(res.body).toHaveProperty('expired');
          expect(res.body).toHaveProperty('responded');
          expect(typeof res.body.pending).toBe('number');
          expect(typeof res.body.expired).toBe('number');
          expect(typeof res.body.responded).toBe('number');
        });
    });

    /**
     * Escenario: Los valores de counts coinciden con los del service.
     *
     * DADO QUE: El service retorna { pending: 5, expired: 2, responded: 3 }.
     * CUANDO:   GET /api/solicitudes/counts.
     * ENTONCES: El body refleja exactamente esos valores.
     */
    it('los valores de counts deben coincidir con los retornados por el service', async () => {
      mockSolicitudesService.getCountsByStatus.mockResolvedValueOnce(
        mockCounts,
      );

      await request(app.getHttpServer())
        .get('/api/solicitudes/counts')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.pending).toBe(mockCounts.pending);
          expect(res.body.expired).toBe(mockCounts.expired);
          expect(res.body.responded).toBe(mockCounts.responded);
        });
    });

    /**
     * Escenario: Los counts son números no negativos (incluyendo ceros).
     *
     * DADO QUE: El service retorna todos los contadores en 0.
     * CUANDO:   GET /api/solicitudes/counts.
     * ENTONCES: Todos los valores son >= 0.
     */
    it('counts deben ser números no negativos', async () => {
      mockSolicitudesService.getCountsByStatus.mockResolvedValueOnce({
        pending: 0,
        expired: 0,
        responded: 0,
      });

      await request(app.getHttpServer())
        .get('/api/solicitudes/counts')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.pending).toBeGreaterThanOrEqual(0);
          expect(res.body.expired).toBeGreaterThanOrEqual(0);
          expect(res.body.responded).toBeGreaterThanOrEqual(0);
        });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/solicitudes
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/solicitudes', () => {
    /**
     * Escenario: Sin token JWT → 401.
     *
     * DADO QUE: No se envía el header Authorization.
     * CUANDO:   GET /api/solicitudes.
     * ENTONCES: JwtAuthGuard (real) retorna 401 Unauthorized.
     */
    it('debe retornar 401 cuando no se envía token JWT', async () => {
      await request(appSinToken.getHttpServer())
        .get('/api/solicitudes')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    /**
     * Escenario: Usuario sin perfil tutor → 403.
     *
     * DADO QUE: El usuario está autenticado pero no tiene rol de tutor.
     * CUANDO:   GET /api/solicitudes.
     * ENTONCES: TutorAuthGuard retorna 403 Forbidden.
     */
    it('debe retornar 403 cuando el usuario no tiene perfil de tutor', async () => {
      await request(appSinRolTutor.getHttpServer())
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    /**
     * Escenario: Sin parámetros → 200 con estructura PaginatedSolicitudesDto.
     *
     * DADO QUE: El tutor hace GET /api/solicitudes sin filtros.
     * CUANDO:   El service retorna mockPaginatedResponse.
     * ENTONCES: El body tiene { data, total, currentPage, itemsPerPage, totalPages }.
     */
    it('debe retornar 200 con estructura PaginatedSolicitudesDto sin parámetros', async () => {
      mockSolicitudesService.getFiltered.mockResolvedValueOnce(
        mockPaginatedResponse,
      );

      await request(app.getHttpServer())
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('currentPage');
          expect(res.body).toHaveProperty('itemsPerPage');
          expect(res.body).toHaveProperty('totalPages');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    /**
     * Escenario: Filtrar por status=PENDIENTE → 200.
     */
    it('debe retornar 200 con status=PENDIENTE', async () => {
      mockSolicitudesService.getFiltered.mockResolvedValueOnce(
        mockPaginatedResponse,
      );

      await request(app.getHttpServer())
        .get('/api/solicitudes?status=PENDIENTE')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK);
    });

    /**
     * Escenario: Filtrar por status=EXPIRADA → 200.
     */
    it('debe retornar 200 con status=EXPIRADA', async () => {
      mockSolicitudesService.getFiltered.mockResolvedValueOnce({
        ...mockPaginatedResponse,
        data: [],
      });

      await request(app.getHttpServer())
        .get('/api/solicitudes?status=EXPIRADA')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK);
    });

    /**
     * Escenario: Filtrar por status=RESPONDIDA → 200.
     */
    it('debe retornar 200 con status=RESPONDIDA', async () => {
      mockSolicitudesService.getFiltered.mockResolvedValueOnce(
        mockEmptyPaginatedResponse,
      );

      await request(app.getHttpServer())
        .get('/api/solicitudes?status=RESPONDIDA')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK);
    });

    /**
     * Escenario: status=INVALIDO → 400 Bad Request.
     *
     * DADO QUE: Se envía un valor de status que no existe en el enum.
     * CUANDO:   GET /api/solicitudes?status=INVALIDO.
     * ENTONCES: ValidationPipe retorna 400.
     */
    it('debe retornar 400 con status=INVALIDO', async () => {
      await request(app.getHttpServer())
        .get('/api/solicitudes?status=INVALIDO')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
        });
    });

    /**
     * Escenario: page=0 → 400 Bad Request (menor al mínimo de 1).
     */
    it('debe retornar 400 cuando page=0 (menor al mínimo)', async () => {
      await request(app.getHttpServer())
        .get('/api/solicitudes?page=0')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    /**
     * Escenario: limit=101 → 400 Bad Request (supera el máximo de 100).
     */
    it('debe retornar 400 cuando limit=101 (supera el máximo)', async () => {
      await request(app.getHttpServer())
        .get('/api/solicitudes?limit=101')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    /**
     * Escenario: page=1&limit=5 → currentPage y itemsPerPage correctos.
     *
     * DADO QUE: El tutor envía ?page=1&limit=5.
     * CUANDO:   El service retorna paginatedResponse5.
     * ENTONCES: El body muestra currentPage: 1 e itemsPerPage: 5.
     */
    it('debe retornar currentPage y itemsPerPage correctos con ?page=1&limit=5', async () => {
      const paginatedResponse5 = {
        data: [],
        total: 0,
        currentPage: 1,
        itemsPerPage: 5,
        totalPages: 0,
      };
      mockSolicitudesService.getFiltered.mockResolvedValueOnce(
        paginatedResponse5,
      );

      await request(app.getHttpServer())
        .get('/api/solicitudes?page=1&limit=5')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.currentPage).toBe(1);
          expect(res.body.itemsPerPage).toBe(5);
        });
    });

    /**
     * Escenario: Cada item de data debe tener los campos del contrato API.
     *
     * DADO QUE: El service retorna mockPaginatedResponse con 1 item.
     * CUANDO:   GET /api/solicitudes.
     * ENTONCES: Cada item tiene id, nombreEstudiante, materia, fechaHora,
     *           mensajeResumen, estado, modalidad, precioHora, mensajeCompleto.
     */
    it('cada item de data debe tener los campos del contrato API', async () => {
      mockSolicitudesService.getFiltered.mockResolvedValueOnce(
        mockPaginatedResponse,
      );

      await request(app.getHttpServer())
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const item = res.body.data[0] as Record<string, unknown>;
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('nombreEstudiante');
          expect(item).toHaveProperty('materia');
          expect(item).toHaveProperty('fechaHora');
          expect(item).toHaveProperty('mensajeResumen');
          expect(item).toHaveProperty('estado');
          expect(item).toHaveProperty('modalidad');
          expect(item).toHaveProperty('precioHora');
          expect(item).toHaveProperty('mensajeCompleto');
        });
    });

    /**
     * Escenario: Bandeja vacía → data: [], total: 0, totalPages: 0.
     *
     * DADO QUE: No hay solicitudes que coincidan con el filtro.
     * CUANDO:   GET /api/solicitudes.
     * ENTONCES: El body tiene data: [], total: 0, totalPages: 0.
     */
    it('bandeja vacía debe retornar data: [], total: 0, totalPages: 0', async () => {
      mockSolicitudesService.getFiltered.mockResolvedValueOnce(
        mockEmptyPaginatedResponse,
      );

      await request(app.getHttpServer())
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data).toEqual([]);
          expect(res.body.total).toBe(0);
          expect(res.body.totalPages).toBe(0);
        });
    });
  });
});

/**
 * E2E Tests — SolicitudesController — HU-33: Ver solicitudes enviadas (Student Perspective)
 *
 * Patrón: SolicitudesService se mockea completamente.
 * JwtAuthGuard se sobreescribe con .overrideGuard().
 * NO se usa TutorAuthGuard para endpoints de estudiantes.
 */
describe('/api/solicitudes (Student Perspective - HU-33)', () => {
  let app: INestApplication;

  // Mock service con métodos de estudiante
  const mockSolicitudesServiceStudent = {
    verificarSolicitudPrevia: jest.fn(),
    create: jest.fn(),
    getCountsByStatus: jest.fn(),
    getFiltered: jest.fn(),
    findAllForStudent: jest.fn(),
    findByIdForStudent: jest.fn(),
  };

  // Mock data para estudiante
  const mockStudentSolicitudItem = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    tutorAvatarUrl: 'https://example.com/avatars/tutor.jpg',
    tutorName: 'Juan Pérez',
    subject: 'Cálculo Diferencial',
    date: '2024-05-25T10:30:00.000Z',
    modality: 'Virtual',
    pricePerHour: 20,
    status: 'PENDIENTE',
  };

  const mockStudentPaginatedResponse = {
    data: [mockStudentSolicitudItem],
    total: 1,
    currentPage: 1,
    itemsPerPage: 5,
    totalPages: 1,
  };

  const mockStudentDetailResponse = {
    ...mockStudentSolicitudItem,
    mensaje: 'Necesito ayuda con los temas de límites y derivadas.',
    horarios: [
      { fecha: '2024-05-15', hora: '10:00' },
      { fecha: '2024-05-16', hora: '14:00' },
    ],
    // NOTE: Conditional fields (acceptedMeetingLink, rejectionReason) removed - out of scope for HU-33
  };

  // Mock Tutor repository - returns null for students
  const mockTutorRepository = {
    findOne: jest.fn().mockResolvedValue(null), // Student user - not a tutor
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SolicitudesController],
      providers: [
        {
          provide: SolicitudesService,
          useValue: mockSolicitudesServiceStudent,
        },
        {
          provide: getRepositoryToken(Tutor),
          useValue: mockTutorRepository,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const request = context.switchToHttp().getRequest();
          request.user = { id: 'test-student-123' }; // Mock student user
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

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/solicitudes (Student List)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/solicitudes (student list)', () => {
    /**
     * Test: 200 OK with paginated list when authenticated as student
     */
    it('should return 200 OK with paginated list for student', async () => {
      mockSolicitudesServiceStudent.findAllForStudent.mockResolvedValueOnce(
        mockStudentPaginatedResponse,
      );

      await request(app.getHttpServer())
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total', 1);
          expect(res.body).toHaveProperty('currentPage', 1);
          expect(res.body).toHaveProperty('itemsPerPage', 5);
          expect(res.body).toHaveProperty('totalPages', 1);
        });
    });

    /**
     * Test: Default pagination (5 items per page for students)
     */
    it('should use default pagination of 5 items per page', async () => {
      mockSolicitudesServiceStudent.findAllForStudent.mockResolvedValueOnce({
        data: [],
        total: 0,
        currentPage: 1,
        itemsPerPage: 5,
        totalPages: 0,
      });

      await request(app.getHttpServer())
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.itemsPerPage).toBe(5);
        });
    });

    /**
     * Test: Custom pagination with query params
     */
    it('should accept custom pagination via query params', async () => {
      mockSolicitudesServiceStudent.findAllForStudent.mockResolvedValueOnce({
        data: [],
        total: 0,
        currentPage: 2,
        itemsPerPage: 10,
        totalPages: 0,
      });

      await request(app.getHttpServer())
        .get('/api/solicitudes?page=2&limit=10')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.currentPage).toBe(2);
          expect(res.body.itemsPerPage).toBe(10);
        });
    });

    /**
     * Test: Filter by status=PENDIENTE
     */
    it('should filter by status=PENDIENTE', async () => {
      mockSolicitudesServiceStudent.findAllForStudent.mockResolvedValueOnce(
        mockStudentPaginatedResponse,
      );

      await request(app.getHttpServer())
        .get('/api/solicitudes?status=PENDIENTE')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK);

      expect(
        mockSolicitudesServiceStudent.findAllForStudent,
      ).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ status: 'PENDIENTE' }),
      );
    });

    /**
     * Test: Filter by status=RESPONDIDA (should work but return empty - no ACEPTADA/RECHAZADA yet)
     * NOTE: ACEPTADA/RECHAZADA states are out of scope for HU-33
     */
    it('should filter by status=RESPONDIDA and return empty', async () => {
      mockSolicitudesServiceStudent.findAllForStudent.mockResolvedValueOnce({
        data: [], // Empty - states don't exist yet in HU-33
        total: 0,
        currentPage: 1,
        itemsPerPage: 5,
        totalPages: 0,
      });

      await request(app.getHttpServer())
        .get('/api/solicitudes?status=RESPONDIDA')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.total).toBe(0);
          expect(res.body.data).toEqual([]);
        });

      expect(
        mockSolicitudesServiceStudent.findAllForStudent,
      ).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ status: 'RESPONDIDA' }),
      );
    });

    /**
     * Test: Filter by status=EXPIRADA
     */
    it('should filter by status=EXPIRADA', async () => {
      mockSolicitudesServiceStudent.findAllForStudent.mockResolvedValueOnce({
        data: [{ ...mockStudentSolicitudItem, status: 'EXPIRADA' }],
        total: 1,
        currentPage: 1,
        itemsPerPage: 5,
        totalPages: 1,
      });

      await request(app.getHttpServer())
        .get('/api/solicitudes?status=EXPIRADA')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK);

      expect(
        mockSolicitudesServiceStudent.findAllForStudent,
      ).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ status: 'EXPIRADA' }),
      );
    });

    /**
     * Test: Filter by status=TODAS (no filter)
     */
    it('should filter by status=TODAS (returns all)', async () => {
      mockSolicitudesServiceStudent.findAllForStudent.mockResolvedValueOnce({
        data: [
          { ...mockStudentSolicitudItem, status: 'PENDIENTE' },
          { ...mockStudentSolicitudItem, status: 'ACEPTADA' },
          { ...mockStudentSolicitudItem, status: 'RECHAZADA' },
          { ...mockStudentSolicitudItem, status: 'EXPIRADA' },
        ],
        total: 4,
        currentPage: 1,
        itemsPerPage: 5,
        totalPages: 1,
      });

      await request(app.getHttpServer())
        .get('/api/solicitudes?status=TODAS')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK);

      expect(
        mockSolicitudesServiceStudent.findAllForStudent,
      ).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ status: 'TODAS' }),
      );
    });

    /**
     * Test: 400 Bad Request when status is invalid
     */
    it('should return 400 Bad Request when status is invalid', async () => {
      await request(app.getHttpServer())
        .get('/api/solicitudes?status=INVALID')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    /**
     * Test: 400 Bad Request when page < 1
     */
    it('should return 400 Bad Request when page < 1', async () => {
      await request(app.getHttpServer())
        .get('/api/solicitudes?page=0')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    /**
     * Test: 400 Bad Request when limit < 1
     */
    it('should return 400 Bad Request when limit < 1', async () => {
      await request(app.getHttpServer())
        .get('/api/solicitudes?limit=0')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    /**
     * Test: 400 Bad Request when limit > 100
     */
    it('should return 400 Bad Request when limit > 100', async () => {
      await request(app.getHttpServer())
        .get('/api/solicitudes?limit=101')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    /**
     * Test: Response body matches StudentSolicitudListItemDto schema
     */
    it('should return items with correct StudentSolicitudListItemDto fields', async () => {
      mockSolicitudesServiceStudent.findAllForStudent.mockResolvedValueOnce(
        mockStudentPaginatedResponse,
      );

      await request(app.getHttpServer())
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const item = res.body.data[0];
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('tutorAvatarUrl');
          expect(item).toHaveProperty('tutorName');
          expect(item).toHaveProperty('subject');
          expect(item).toHaveProperty('date');
          expect(item).toHaveProperty('modality');
          expect(item).toHaveProperty('pricePerHour');
          expect(item).toHaveProperty('status');
        });
    });

    /**
     * Test: Empty result set
     */
    it('should return empty data array when no solicitudes found', async () => {
      mockSolicitudesServiceStudent.findAllForStudent.mockResolvedValueOnce({
        data: [],
        total: 0,
        currentPage: 1,
        itemsPerPage: 5,
        totalPages: 0,
      });

      await request(app.getHttpServer())
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data).toEqual([]);
          expect(res.body.total).toBe(0);
          expect(res.body.totalPages).toBe(0);
        });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/solicitudes/:id (Student Detail)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/solicitudes/:id (student detail)', () => {
    const validSolicitudId = '550e8400-e29b-41d4-a716-446655440000';
    const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

    /**
     * Test: 200 OK with StudentSolicitudDetailDto
     */
    it('should return 200 OK with detail DTO when solicitud exists', async () => {
      mockSolicitudesServiceStudent.findByIdForStudent.mockResolvedValueOnce(
        mockStudentDetailResponse,
      );

      await request(app.getHttpServer())
        .get(`/api/solicitudes/${validSolicitudId}`)
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('tutorName');
          expect(res.body).toHaveProperty('tutorAvatarUrl');
          expect(res.body).toHaveProperty('subject');
          expect(res.body).toHaveProperty('date');
          expect(res.body).toHaveProperty('modality');
          expect(res.body).toHaveProperty('pricePerHour');
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('mensaje');
          expect(res.body).toHaveProperty('horarios');
        });
    });

    /**
     * Test: 404 Not Found when solicitud does not exist
     */
    it('should return 404 Not Found when solicitud does not exist', async () => {
      mockSolicitudesServiceStudent.findByIdForStudent.mockRejectedValueOnce(
        new NotFoundException('Solicitud no encontrada'),
      );

      await request(app.getHttpServer())
        .get(`/api/solicitudes/${nonExistentId}`)
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    /**
     * Test: 404 Not Found when solicitud belongs to another student (authorization)
     */
    it('should return 404 Not Found when solicitud belongs to another student', async () => {
      mockSolicitudesServiceStudent.findByIdForStudent.mockRejectedValueOnce(
        new NotFoundException('Solicitud no encontrada'),
      );

      await request(app.getHttpServer())
        .get(`/api/solicitudes/${validSolicitudId}`)
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    /**
     * NOTE: Conditional field tests removed - out of scope for HU-33
     * - acceptedMeetingLink (will be added in HU-08: Aceptar solicitud)
     * - rejectionReason (will be added in HU-23: Rechazar solicitud)
     */

    /**
     * Test: All fields are correctly populated
     */
    it('should populate all fields correctly in StudentSolicitudDetailDto', async () => {
      mockSolicitudesServiceStudent.findByIdForStudent.mockResolvedValueOnce(
        mockStudentDetailResponse,
      );

      await request(app.getHttpServer())
        .get(`/api/solicitudes/${validSolicitudId}`)
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.id).toBe(validSolicitudId);
          expect(res.body.tutorName).toBe('Juan Pérez');
          expect(res.body.tutorAvatarUrl).toBe(
            'https://example.com/avatars/tutor.jpg',
          );
          expect(res.body.subject).toBe('Cálculo Diferencial');
          expect(res.body.modality).toBe('Virtual');
          expect(res.body.pricePerHour).toBe(20);
          expect(res.body.status).toBe('PENDIENTE');
          expect(res.body.mensaje).toBe(
            'Necesito ayuda con los temas de límites y derivadas.',
          );
          expect(res.body.horarios).toEqual([
            { fecha: '2024-05-15', hora: '10:00' },
            { fecha: '2024-05-16', hora: '14:00' },
          ]);
        });
    });
  });
});
