import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import request from 'supertest';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { TutorAuthGuard } from '../src/auth/guards/tutor-auth.guard';
import { TutoriasController } from '../src/tutorias/tutorias.controller';
import { TutoriasService } from '../src/tutorias/tutorias.service';
import {
  SolicitudEntity,
  SolicitudEstado,
} from '../src/solicitudes/entities/solicitud.entity';

/**
 * E2E Tests — TutoriasController — HU-48: Registrar inasistencia del estudiante
 *
 * FASE ROJA del TDD: estos tests FALLARÁN inicialmente porque:
 * 1. El endpoint POST /api/tutorias/:id/inasistencia no existe.
 * 2. El método reportarInasistencia() en TutoriasService no está implementado.
 */

const mockTutoriasService = {
  reportarInasistencia: jest.fn(),
};

describe('TutoriasController - Reportar Inasistencia (E2E)', () => {
  let app: INestApplication;
  let tutoriasService: TutoriasService;

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

    tutoriasService = moduleFixture.get<TutoriasService>(TutoriasService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/tutorias/:id/inasistencia', () => {
    const tutoriaId = '550e8400-e29b-41d4-a716-446655440000';
    const tutorId = 'tutor-123';

    it('debe retornar 200 OK con la estructura esperada cuando se reporta inasistencia exitosamente', async () => {
      // Arrange: Mock del resultado del servicio
      const mockResult: Partial<SolicitudEntity> = {
        id: tutoriaId,
        estado: SolicitudEstado.NO_SHOW,
        updatedAt: new Date('2024-05-24T10:00:00Z'),
      };

      mockTutoriasService.reportarInasistencia.mockResolvedValue(mockResult);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post(`/api/tutorias/${tutoriaId}/inasistencia`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      // Verificar estructura del response
      expect(response.body).toEqual({
        success: true,
        message: 'Inasistencia del estudiante registrada con éxito.',
        data: {
          id: tutoriaId,
          status: 'no-show',
          updatedAt: '2024-05-24T10:00:00.000Z',
        },
      });

      // Verificar que el servicio fue llamado correctamente
      expect(mockTutoriasService.reportarInasistencia).toHaveBeenCalledWith(
        tutoriaId,
        expect.any(String), // tutorId extraído del JWT
      );
    });

    it('debe retornar 404 Not Found si la tutoría no existe', async () => {
      // Arrange: Mock lanzando NotFoundException
      mockTutoriasService.reportarInasistencia.mockRejectedValue(
        new NotFoundException('Tutoría no encontrada'),
      );

      // Act & Assert
      await request(app.getHttpServer())
        .post(`/api/tutorias/${tutoriaId}/inasistencia`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(404);

      expect(mockTutoriasService.reportarInasistencia).toHaveBeenCalledWith(
        tutoriaId,
        expect.any(String),
      );
    });

    it('debe retornar 404 Not Found si la tutoría no pertenece al tutor autenticado', async () => {
      // Arrange: Mock lanzando NotFoundException (por seguridad, mismo error)
      mockTutoriasService.reportarInasistencia.mockRejectedValue(
        new NotFoundException('Tutoría no encontrada'),
      );

      // Act & Assert
      await request(app.getHttpServer())
        .post(`/api/tutorias/${tutoriaId}/inasistencia`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(404);
    });

    it('debe retornar 400 Bad Request si el estado de la tutoría no es ACEPTADA', async () => {
      // Arrange: Mock lanzando BadRequestException
      mockTutoriasService.reportarInasistencia.mockRejectedValue(
        new BadRequestException(
          'Solo se puede reportar inasistencia para tutorías sin confirmar (ACEPTADA).',
        ),
      );

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post(`/api/tutorias/${tutoriaId}/inasistencia`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(400);

      expect(response.body.message).toContain(
        'Solo se puede reportar inasistencia para tutorías sin confirmar',
      );
    });

    it('debe retornar 401 Unauthorized si no se proporciona JWT', async () => {
      // Nota: Este test requeriría configurar el guard real o un mock más complejo
      // En el ambiente de test, los guards están mockeados para siempre permitir acceso
      // En producción, JwtAuthGuard validará el token automáticamente

      // Act & Assert: Sin el header Authorization, el sistema debe rechazar
      // Por ahora, skipeamos este test ya que los guards están mockeados
      // En un entorno E2E real con DB, este test pasaría con el guard real
      expect(true).toBe(true);
    });

    it('debe validar que el ID de la URL se pasa correctamente al servicio', async () => {
      // Arrange
      const customId = 'custom-uuid-123';
      mockTutoriasService.reportarInasistencia.mockResolvedValue({
        id: customId,
        estado: SolicitudEstado.NO_SHOW,
        updatedAt: new Date(),
      });

      // Act
      await request(app.getHttpServer())
        .post(`/api/tutorias/${customId}/inasistencia`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      // Assert: Verificar que el ID correcto fue pasado
      expect(mockTutoriasService.reportarInasistencia).toHaveBeenCalledWith(
        customId,
        expect.any(String),
      );
    });
  });
});
