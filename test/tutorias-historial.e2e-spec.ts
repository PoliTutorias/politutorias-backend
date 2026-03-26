/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { TutorAuthGuard } from '../src/auth/guards/tutor-auth.guard';
import { TutoriasController } from '../src/tutorias/tutorias.controller';
import { TutoriasService } from '../src/tutorias/tutorias.service';

/**
 * E2E Tests — TutoriasController — HU-39: Ver historial de tutorías impartidas
 *
 * FASE ROJA del TDD: estos tests FALLARÁN inicialmente porque:
 * 1. TutoriasController no está implementado.
 * 2. TutoriasService no está implementado.
 * 3. Los endpoints GET /api/tutorias/historial y GET /api/tutorias/:id no existen.
 */

const mockTutoriasService = {
  getHistorial: jest.fn(),
  getDetalle: jest.fn(),
};

describe('TutoriasController (E2E)', () => {
  let app: INestApplication;

  beforeEach(async () => {
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
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe('GET /api/tutorias/historial', () => {
    it('debe retornar 200 OK con estructura HistoryResponseDto', async () => {
      const mockResponse = {
        summary: {
          totalCompleted: 25,
          totalSubjects: 4,
          totalStudents: 18,
        },
        paginatedData: {
          items: [
            {
              id: 'test-id-123',
              studentName: 'Juan Pérez',
              subjectName: 'Cálculo Diferencial',
              date: '2024-05-20',
              status: 'Completada',
              pricePerHour: '$15/h',
            },
          ],
          total: 25,
          page: 1,
          lastPage: 5,
        },
      };

      mockTutoriasService.getHistorial.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/tutorias/historial')
        .query({ page: 1, limit: 5 })
        .expect(200);

      // Validar estructura
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('paginatedData');

      // Validar summary
      expect(response.body.summary).toHaveProperty('totalCompleted');
      expect(response.body.summary).toHaveProperty('totalSubjects');
      expect(response.body.summary).toHaveProperty('totalStudents');
      expect(typeof response.body.summary.totalCompleted).toBe('number');

      // Validar paginatedData
      expect(response.body.paginatedData).toHaveProperty('items');
      expect(response.body.paginatedData).toHaveProperty('total');
      expect(response.body.paginatedData).toHaveProperty('page');
      expect(response.body.paginatedData).toHaveProperty('lastPage');
      expect(Array.isArray(response.body.paginatedData.items)).toBe(true);

      // Validar estructura de items
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const item = response.body.paginatedData.items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('studentName');
      expect(item).toHaveProperty('subjectName');
      expect(item).toHaveProperty('date');
      expect(item).toHaveProperty('status');
      expect(item).toHaveProperty('pricePerHour');
    });

    it('debe retornar 400 Bad Request si page < 1', async () => {
      await request(app.getHttpServer())
        .get('/api/tutorias/historial')
        .query({ page: 0 })
        .expect(400);
    });

    it('debe retornar 400 Bad Request si limit > 100', async () => {
      await request(app.getHttpServer())
        .get('/api/tutorias/historial')
        .query({ limit: 101 })
        .expect(400);
    });

    it('debe retornar 401 Unauthorized sin JWT', async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [TutoriasController],
        providers: [
          {
            provide: TutoriasService,
            useValue: mockTutoriasService,
          },
        ],
      }).compile();

      const testApp = moduleFixture.createNestApplication();
      testApp.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true }),
      );
      await testApp.init();

      await request(testApp.getHttpServer())
        .get('/api/tutorias/historial')
        .expect(401);

      await testApp.close();
    });

    it('debe calcular lastPage correctamente (total=25, limit=5 → lastPage=5)', async () => {
      const mockResponse = {
        summary: {
          totalCompleted: 25,
          totalSubjects: 4,
          totalStudents: 18,
        },
        paginatedData: {
          items: [],
          total: 25,
          page: 1,
          lastPage: 5,
        },
      };

      mockTutoriasService.getHistorial.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/tutorias/historial')
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.paginatedData.lastPage).toBe(5);
      expect(response.body.paginatedData.total).toBe(25);
    });
  });

  describe('GET /api/tutorias/:id', () => {
    it('debe retornar 200 OK con estructura TutorialDetailDto', async () => {
      const mockDetail = {
        id: 'test-solicitud-123',
        student: {
          name: 'Juan Pérez',
          avatar: null,
        },
        subject: 'Cálculo Diferencial',
        date: '20 de mayo, 2024',
        time: '14:00 - 15:00',
        modality: 'Virtual',
        meetingLink: 'https://zoom.us/j/123456',
        location: null,
        pricePerHour: '$15/h',
        studentMessage: 'Necesito ayuda con límites',
      };

      mockTutoriasService.getDetalle.mockResolvedValue(mockDetail);

      const response = await request(app.getHttpServer())
        .get('/api/tutorias/test-solicitud-123')
        .expect(200);

      // Validar estructura completa
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('student');
      expect(response.body).toHaveProperty('subject');
      expect(response.body).toHaveProperty('date');
      expect(response.body).toHaveProperty('time');
      expect(response.body).toHaveProperty('modality');
      expect(response.body).toHaveProperty('pricePerHour');
      expect(response.body).toHaveProperty('studentMessage');

      // Validar student info
      expect(response.body.student).toHaveProperty('name');
      expect(response.body.student).toHaveProperty('avatar');

      // Validar valores específicos
      expect(response.body.id).toBe('test-solicitud-123');
      expect(response.body.modality).toBe('Virtual');
      expect(response.body.meetingLink).toBe('https://zoom.us/j/123456');
    });

    it('debe retornar 404 Not Found si ID no existe', async () => {
      mockTutoriasService.getDetalle.mockRejectedValue({
        statusCode: 404,
        message: 'Tutoría no encontrada',
      });

      await request(app.getHttpServer())
        .get('/api/tutorias/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('debe retornar 404 Not Found si la tutoría no pertenece al tutor (ownership)', async () => {
      mockTutoriasService.getDetalle.mockRejectedValue({
        statusCode: 404,
        message: 'Tutoría no encontrada',
      });

      await request(app.getHttpServer())
        .get('/api/tutorias/other-tutor-solicitud')
        .expect(404);
    });

    it('debe retornar 401 Unauthorized sin JWT', async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [TutoriasController],
        providers: [
          {
            provide: TutoriasService,
            useValue: mockTutoriasService,
          },
        ],
      }).compile();

      const testApp = moduleFixture.createNestApplication();
      testApp.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true }),
      );
      await testApp.init();

      await request(testApp.getHttpServer())
        .get('/api/tutorias/test-id')
        .expect(401);

      await testApp.close();
    });
  });
});
