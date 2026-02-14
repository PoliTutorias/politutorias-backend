/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { TutorOfertasController } from '../src/ofertas/tutor-ofertas.controller';
import { OfertasService } from '../src/ofertas/ofertas.service';
import { TutorOfertasNotFoundFilter } from '../src/ofertas/tutor-ofertas-not-found.filter';

/**
 * E2E Tests for HU02: GET /api/tutor/:tutorId/ofertas
 *
 * These tests are in the RED phase of TDD - they will FAIL initially because:
 * 1. The endpoint GET /api/tutor/:tutorId/ofertas does not exist yet
 * 2. The OfertasService.findAllByTutorId method is not implemented
 * 3. The OfertaDto mapping is not implemented
 *
 * These tests validate the HTTP contract agreed with the frontend.
 */

// Mock de la implementación del OfertasService
const mockOfertasService = {
  findAllByTutorId: jest.fn(),
};

describe('OfertasController - GET /api/tutor/:tutorId/ofertas (e2e) - HU02', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TutorOfertasController],
      providers: [
        {
          provide: OfertasService,
          useValue: mockOfertasService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new TutorOfertasNotFoundFilter());
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  /**
   * Escenario 1: El tutor tiene ofertas publicadas
   * Given: Un tutorId válido y ofertas asociadas con diferentes modalidades
   * When: Se realiza una petición GET a /api/tutor/{tutorId}/ofertas
   * Then: Debe responder 200 OK con un arreglo de OfertaDto
   */
  describe('Scenario 1: Tutor has published offers', () => {
    it('should return 200 OK with an array of OfertaDto when tutor has offers', async () => {
      const tutorId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

      // Mock data: Ofertas con diferentes modalidades
      const mockOfertasDto = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          title: 'Cálculo en una Variable',
          description:
            'Me enfoco en ejercicios de MRU y aplicaciones de derivadas e integrales.',
          isPresencial: true, // modality === "Presencial"
          pricePerHour: 10.0,
          tags: [
            'Matemática',
            'Formación Básica',
            'Preparación de Exámenes',
            'Resolución de Ejercicios',
            'Laboratorios',
          ],
          createdAt: '2023-10-27T10:30:00.000Z',
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          title: 'Física General',
          description: 'Clases de física con énfasis en mecánica clásica.',
          isPresencial: false, // modality === "Virtual"
          pricePerHour: 15.0,
          tags: ['Física', 'Formación Básica'],
          createdAt: '2023-10-28T14:20:00.000Z',
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          title: 'Álgebra Lineal',
          description: 'Matrices, vectores y sistemas de ecuaciones lineales.',
          isPresencial: true, // modality === "Presencial"
          pricePerHour: 12.5,
          tags: ['Matemática', 'Álgebra'],
          createdAt: '2023-10-29T09:15:00.000Z',
        },
      ];

      mockOfertasService.findAllByTutorId.mockResolvedValueOnce(mockOfertasDto);

      await request(app.getHttpServer())
        .get(`/api/tutor/${tutorId}/ofertas`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          // Verifica que la respuesta sea un arreglo
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(3);

          // Verifica la estructura de cada OfertaDto
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          res.body.forEach((oferta: Record<string, unknown>, index: number) => {
            const expected = mockOfertasDto[index];

            // Verifica campos obligatorios y tipos
            expect(oferta.id).toBe(expected.id);
            expect(typeof oferta.id).toBe('string');

            expect(oferta.title).toBe(expected.title);
            expect(typeof oferta.title).toBe('string');

            expect(oferta.description).toBe(expected.description);
            expect(typeof oferta.description).toBe('string');

            // CRÍTICO: isPresencial debe ser boolean
            expect(oferta.isPresencial).toBe(expected.isPresencial);
            expect(typeof oferta.isPresencial).toBe('boolean');

            // CRÍTICO: pricePerHour debe ser number
            expect(oferta.pricePerHour).toBe(expected.pricePerHour);
            expect(typeof oferta.pricePerHour).toBe('number');

            // CRÍTICO: tags debe ser array de strings
            expect(Array.isArray(oferta.tags)).toBe(true);
            expect(oferta.tags).toEqual(expected.tags);

            expect(oferta.createdAt).toBe(expected.createdAt);
            expect(typeof oferta.createdAt).toBe('string');

            // Verifica que NO incluya campos internos de la entidad
            expect(oferta.modality).toBeUndefined();
            expect(oferta.price).toBeUndefined();
            expect(oferta.categories).toBeUndefined();
            expect(oferta.tutorId).toBeUndefined();
            expect(oferta.updatedAt).toBeUndefined();
          });

          // Verifica que el servicio fue llamado correctamente
          expect(mockOfertasService.findAllByTutorId).toHaveBeenCalledWith(
            tutorId,
          );
          expect(mockOfertasService.findAllByTutorId).toHaveBeenCalledTimes(1);
        });
    });
  });

  /**
   * Escenario 2: El tutor no tiene ofertas publicadas
   * Given: Un tutorId válido sin ofertas asociadas
   * When: Se realiza una petición GET a /api/tutor/{tutorId}/ofertas
   * Then: Debe responder 200 OK con un arreglo vacío []
   */
  describe('Scenario 2: Tutor has no published offers', () => {
    it('should return 200 OK with an empty array when tutor has no offers', async () => {
      const tutorId = 'f5e4d3c2-b1a0-9876-5432-10fedcba9876';

      mockOfertasService.findAllByTutorId.mockResolvedValueOnce([]);

      await request(app.getHttpServer())
        .get(`/api/tutor/${tutorId}/ofertas`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          // CRÍTICO: Debe retornar un arreglo vacío, NO null, NO undefined, NO {}
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toEqual([]);
          expect(res.body.length).toBe(0);

          // Verifica que el servicio fue llamado correctamente
          expect(mockOfertasService.findAllByTutorId).toHaveBeenCalledWith(
            tutorId,
          );
          expect(mockOfertasService.findAllByTutorId).toHaveBeenCalledTimes(1);
        });
    });
  });

  /**
   * Escenario 3: ID de tutor inválido (no es UUID)
   * Given: Un tutorId que no es un UUID válido
   * When: Se realiza una petición GET a /api/tutor/{invalidId}/ofertas
   * Then: Debe responder 400 Bad Request con mensaje específico
   */
  describe('Scenario 3: Invalid tutorId (not a valid UUID)', () => {
    const invalidTutorIds = [
      'invalid-uuid-string',
      '123',
      '',
      'abc-def-ghi',
      '12345678',
    ];

    invalidTutorIds.forEach((invalidId) => {
      it(`should return 400 Bad Request when tutorId is "${invalidId}"`, async () => {
        await request(app.getHttpServer())
          .get(`/api/tutor/${invalidId}/ofertas`)
          .expect(HttpStatus.BAD_REQUEST)
          .expect((res) => {
            // Verifica la estructura exacta del error según el contrato
            expect(res.body.statusCode).toBe(400);
            expect(res.body.message).toBe(
              'Validation failed (uuid is expected)',
            );
            expect(res.body.error).toBe('Bad Request');

            // El servicio NO debe ser llamado con IDs inválidos
            expect(mockOfertasService.findAllByTutorId).not.toHaveBeenCalled();
          });
      });
    });
  });

  /**
   * Escenario 4: Error interno del servidor
   * Given: Un tutorId válido pero el servicio lanza una excepción
   * When: Se realiza una petición GET a /api/tutor/{tutorId}/ofertas
   * Then: Debe responder 500 Internal Server Error
   */
  describe('Scenario 4: Internal server error', () => {
    it('should return 500 Internal Server Error when service throws an error', async () => {
      const tutorId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

      // Simula un error inesperado en el servicio
      mockOfertasService.findAllByTutorId.mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      await request(app.getHttpServer())
        .get(`/api/tutor/${tutorId}/ofertas`)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        .expect((res) => {
          // Verifica la estructura exacta del error según el contrato
          expect(res.body.statusCode).toBe(500);
          expect(res.body.message).toBe('Internal server error');

          // Verifica que el servicio fue llamado
          expect(mockOfertasService.findAllByTutorId).toHaveBeenCalledWith(
            tutorId,
          );
          expect(mockOfertasService.findAllByTutorId).toHaveBeenCalledTimes(1);
        });
    });
  });
});
