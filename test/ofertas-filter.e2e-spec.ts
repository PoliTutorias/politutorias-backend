/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
    HttpStatus,
    INestApplication,
    InternalServerErrorException,
    ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CreateOfertaUseCase } from '../src/ofertas/application/use-cases/create-oferta.use-case';
import { GetAllOfertasUseCase } from '../src/ofertas/application/use-cases/get-all-ofertas.use-case';
import { OfertasController } from '../src/ofertas/ofertas.controller';
import { OfertasService } from '../src/ofertas/ofertas.service';

/**
 * E2E Tests for HU27: GET /api/ofertas (filtrado por rango de precio)
 *
 * FASE ROJA del TDD: Estos tests FALLARÁN inicialmente porque:
 * 1. OfertasService.findFilteredOfertas no existe todavía.
 * 2. El controlador OfertasController.findAll no acepta parámetros minPrice/maxPrice
 *    ni delega en findFilteredOfertas.
 * 3. El formato de respuesta actual { statusCode, message, data } no coincide
 *    con el contrato acordado { ofertas, total }.
 * 4. El DTO FilterQueryParams con validaciones de minPrice/maxPrice no existe.
 * 5. Los mensajes de error 400 para minPrice/maxPrice no están configurados.
 *
 * Estos tests validan el contrato HTTP exacto acordado con el frontend (HU27).
 */

// ---------------------------------------------------------------------------
// Mock data — sigue la estructura exacta del contrato HU27
// ---------------------------------------------------------------------------

const MOCK_TUTOR_1 = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  nombre: 'Ana García',
  fotoUrl: 'https://example.com/fotos/ana-garcia.jpg',
  contacto: 'ana.garcia@example.com',
};

const MOCK_TUTOR_2 = {
  id: 'c9bf9e57-1685-4c89-bafb-ff5af830be8a',
  nombre: 'Carlos Mendoza',
  fotoUrl: null,
  contacto: null,
};

const MOCK_OFERTA_1 = {
  id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  titulo: 'Cálculo Diferencial e Integral',
  carrera: 'Ingeniería de Sistemas',
  modalidad: 'Presencial',
  descripcion: 'Clases especializadas en límites, derivadas e integrales.',
  lugarReunion: 'Campus Central - Edificio A, Salón 204',
  precio: 15.0,
  tutor: MOCK_TUTOR_1,
  imagenRepresentativaUrl: 'https://example.com/imagenes/calculo.jpg',
  createdAt: '2024-03-15T10:00:00.000Z',
  updatedAt: '2024-03-15T10:00:00.000Z',
};

const MOCK_OFERTA_2 = {
  id: 'b2c3d4e5-f6a7-8901-2345-678901bcdef0',
  titulo: 'Álgebra Lineal',
  carrera: 'Matemáticas',
  modalidad: 'Virtual',
  descripcion: 'Matrices, vectores y transformaciones lineales.',
  lugarReunion: null,
  precio: 12.5,
  tutor: MOCK_TUTOR_2,
  imagenRepresentativaUrl: null,
  createdAt: '2024-03-16T09:00:00.000Z',
  updatedAt: '2024-03-16T09:00:00.000Z',
};

const MOCK_OFERTA_3 = {
  id: 'c3d4e5f6-a7b8-9012-3456-789012cdef01',
  titulo: 'Programación Orientada a Objetos',
  carrera: 'Ingeniería de Software',
  modalidad: 'Híbrida',
  descripcion: 'Fundamentos de POO con Java y patrones de diseño.',
  lugarReunion: 'Biblioteca Central',
  precio: 20.0,
  tutor: MOCK_TUTOR_1,
  imagenRepresentativaUrl: null,
  createdAt: '2024-03-17T08:30:00.000Z',
  updatedAt: '2024-03-17T08:30:00.000Z',
};

// ---------------------------------------------------------------------------
// Mock del OfertasService — solo findFilteredOfertas está bajo prueba
// ---------------------------------------------------------------------------
const mockOfertasService = {
  findAllByTutorId: jest.fn(),
  searchOffers: jest.fn(),
  getFilteredOfertas: jest.fn(),
  findFilteredOfertas: jest.fn(),
};

const mockCreateOfertaUseCase = { execute: jest.fn() };
const mockGetAllOfertasUseCase = { execute: jest.fn() };

// ---------------------------------------------------------------------------
// Suite principal
// ---------------------------------------------------------------------------
describe('OfertasController - GET /api/ofertas (e2e) - HU27', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OfertasController],
      providers: [
        {
          provide: OfertasService,
          useValue: mockOfertasService,
        },
        {
          provide: CreateOfertaUseCase,
          useValue: mockCreateOfertaUseCase,
        },
        {
          provide: GetAllOfertasUseCase,
          useValue: mockGetAllOfertasUseCase,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        stopAtFirstError: false,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  // -------------------------------------------------------------------------
  // Escenario 1: Sin parámetros — retorna todas las ofertas
  // -------------------------------------------------------------------------
  describe('Escenario 1: Sin parámetros de filtro', () => {
    it('debería responder 200 OK con { data: [...], total: N } y llamar getFilteredOfertas sin filtros', async () => {
      const mockResponse = {
        data: [MOCK_OFERTA_1, MOCK_OFERTA_2, MOCK_OFERTA_3],
        total: 3,
      };
      mockOfertasService.getFilteredOfertas.mockResolvedValueOnce(
        mockResponse,
      );

      await request(app.getHttpServer())
        .get('/api/ofertas')
        .expect(HttpStatus.OK)
        .expect((res) => {
          // Estructura raíz
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.total).toBe(3);
          expect(res.body.data.length).toBe(3);

          // Estructura de la primera oferta (campos en español)
          const oferta = res.body.data[0] as Record<string, unknown>;
          expect(oferta.id).toBe(MOCK_OFERTA_1.id);
          expect(oferta.titulo).toBe(MOCK_OFERTA_1.titulo);
          expect(oferta.carrera).toBe(MOCK_OFERTA_1.carrera);
          expect(oferta.modalidad).toBe(MOCK_OFERTA_1.modalidad);
          expect(oferta.descripcion).toBe(MOCK_OFERTA_1.descripcion);
          expect(oferta.lugarReunion).toBe(MOCK_OFERTA_1.lugarReunion);
          expect(typeof oferta.precio).toBe('number');
          expect(oferta.precio).toBe(15.0);

          // Estructura del tutor dentro de la oferta
          const tutor = oferta.tutor as Record<string, unknown>;
          expect(tutor).toBeDefined();
          expect(tutor.id).toBe(MOCK_TUTOR_1.id);
          expect(tutor.nombre).toBe(MOCK_TUTOR_1.nombre);
          expect(tutor.fotoUrl).toBe(MOCK_TUTOR_1.fotoUrl);
          expect(tutor.contacto).toBe(MOCK_TUTOR_1.contacto);

          // El servicio fue llamado sin filtros (objeto vacío o undefined)
          expect(mockOfertasService.getFilteredOfertas).toHaveBeenCalledTimes(
            1,
          );
          const callArg = mockOfertasService.getFilteredOfertas.mock
            .calls[0][0] as Record<string, unknown>;
          expect(callArg?.minPrice).toBeUndefined();
          expect(callArg?.maxPrice).toBeUndefined();
        });
    });
  });

  // -------------------------------------------------------------------------
  // Escenario 2: Filtrado por minPrice y maxPrice válidos
  // -------------------------------------------------------------------------
  describe('Escenario 2: Filtrado por minPrice=10 y maxPrice=20', () => {
    it('debería responder 200 OK con las ofertas en el rango y llamar getFilteredOfertas({ minPrice: 10, maxPrice: 20 })', async () => {
      const mockResponse = {
        data: [MOCK_OFERTA_1, MOCK_OFERTA_2],
        total: 2,
      };
      mockOfertasService.getFilteredOfertas.mockResolvedValueOnce(
        mockResponse,
      );

      await request(app.getHttpServer())
        .get('/api/ofertas?minPrice=10&maxPrice=20')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data.length).toBe(2);
          expect(res.body.total).toBe(2);

          // Verifica que se llamó con los filtros correctos (transformados a number)
          expect(mockOfertasService.getFilteredOfertas).toHaveBeenCalledWith({
            minPrice: 10,
            maxPrice: 20,
          });
        });
    });
  });

  // -------------------------------------------------------------------------
  // Escenario 3: Solo minPrice válido
  // -------------------------------------------------------------------------
  describe('Escenario 3: Solo minPrice=15', () => {
    it('debería responder 200 OK y llamar getFilteredOfertas({ minPrice: 15 })', async () => {
      const mockResponse = {
        data: [MOCK_OFERTA_1, MOCK_OFERTA_3],
        total: 2,
      };
      mockOfertasService.getFilteredOfertas.mockResolvedValueOnce(
        mockResponse,
      );

      await request(app.getHttpServer())
        .get('/api/ofertas?minPrice=15')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.total).toBe(2);
          expect(mockOfertasService.getFilteredOfertas).toHaveBeenCalledWith({
            minPrice: 15,
          });
        });
    });
  });

  // -------------------------------------------------------------------------
  // Escenario 4: Solo maxPrice válido
  // -------------------------------------------------------------------------
  describe('Escenario 4: Solo maxPrice=15', () => {
    it('debería responder 200 OK y llamar getFilteredOfertas({ maxPrice: 15 })', async () => {
      const mockResponse = {
        data: [MOCK_OFERTA_1, MOCK_OFERTA_2],
        total: 2,
      };
      mockOfertasService.getFilteredOfertas.mockResolvedValueOnce(
        mockResponse,
      );

      await request(app.getHttpServer())
        .get('/api/ofertas?maxPrice=15')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.total).toBe(2);
          expect(mockOfertasService.getFilteredOfertas).toHaveBeenCalledWith({
            maxPrice: 15,
          });
        });
    });
  });

  // -------------------------------------------------------------------------
  // Escenario 5: Rango sin resultados
  // -------------------------------------------------------------------------
  describe('Escenario 5: Rango sin ofertas (minPrice=100, maxPrice=200)', () => {
    it('debería responder 200 OK con { ofertas: [], total: 0 }', async () => {
      mockOfertasService.getFilteredOfertas.mockResolvedValueOnce({
        data: [],
        total: 0,
      });

      await request(app.getHttpServer())
        .get('/api/ofertas?minPrice=100&maxPrice=200')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.data).toEqual([]);
          expect(res.body.total).toBe(0);
          expect(mockOfertasService.getFilteredOfertas).toHaveBeenCalledWith({
            minPrice: 100,
            maxPrice: 200,
          });
        });
    });
  });

  // -------------------------------------------------------------------------
  // Escenario 6: minPrice no numérico → 400
  // -------------------------------------------------------------------------
  describe('Escenario 6: minPrice="abc" (no numérico)', () => {
    it('debería responder 400 Bad Request con mensaje "minPrice debe ser un número válido."', async () => {
      await request(app.getHttpServer())
        .get('/api/ofertas?minPrice=abc')
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.error).toBe('Bad Request');
          const messages: string[] = res.body.message as string[];
          expect(messages).toContain('minPrice debe ser un número válido.');
          // El servicio NO debe ser llamado con inputs inválidos
          expect(mockOfertasService.getFilteredOfertas).not.toHaveBeenCalled();
        });
    });
  });

  // -------------------------------------------------------------------------
  // Escenario 7: minPrice negativo → 400
  // -------------------------------------------------------------------------
  describe('Escenario 7: minPrice="-5" (negativo)', () => {
    it('debería responder 400 Bad Request con mensaje "minPrice no puede ser negativo."', async () => {
      await request(app.getHttpServer())
        .get('/api/ofertas?minPrice=-5')
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.error).toBe('Bad Request');
          const messages: string[] = res.body.message as string[];
          expect(messages).toContain('minPrice no puede ser negativo.');
          expect(mockOfertasService.getFilteredOfertas).not.toHaveBeenCalled();
        });
    });
  });

  // -------------------------------------------------------------------------
  // Escenario 8: maxPrice no numérico → 400
  // -------------------------------------------------------------------------
  describe('Escenario 8: maxPrice="xyz" (no numérico)', () => {
    it('debería responder 400 Bad Request con mensaje "maxPrice debe ser un número válido."', async () => {
      await request(app.getHttpServer())
        .get('/api/ofertas?maxPrice=xyz')
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.error).toBe('Bad Request');
          const messages: string[] = res.body.message as string[];
          expect(messages).toContain('maxPrice debe ser un número válido.');
          expect(mockOfertasService.getFilteredOfertas).not.toHaveBeenCalled();
        });
    });
  });

  // -------------------------------------------------------------------------
  // Escenario 9: maxPrice=0 (cero no válido) → 400
  // -------------------------------------------------------------------------
  describe('Escenario 9: maxPrice="0" (cero, debe ser positivo estricto)', () => {
    it('debería responder 400 Bad Request con mensaje "maxPrice debe ser un número positivo."', async () => {
      await request(app.getHttpServer())
        .get('/api/ofertas?maxPrice=0')
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.error).toBe('Bad Request');
          const messages: string[] = res.body.message as string[];
          expect(messages).toContain('maxPrice debe ser un número positivo.');
          expect(mockOfertasService.getFilteredOfertas).not.toHaveBeenCalled();
        });
    });
  });

  // -------------------------------------------------------------------------
  // Escenario 10: Error interno del servidor
  // -------------------------------------------------------------------------
  describe('Escenario 10: Error interno del servidor en el servicio', () => {
    it('debería responder 500 con el mensaje acordado "Error interno al filtrar ofertas."', async () => {
      mockOfertasService.getFilteredOfertas.mockRejectedValueOnce(
        new InternalServerErrorException('Error interno al filtrar ofertas.'),
      );

      await request(app.getHttpServer())
        .get('/api/ofertas')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        .expect((res) => {
          expect(res.body.statusCode).toBe(500);
          expect(res.body.message).toBe('Error interno al filtrar ofertas.');
          expect(res.body.error).toBe('Internal Server Error');
          expect(mockOfertasService.getFilteredOfertas).toHaveBeenCalledTimes(
            1,
          );
        });
    });
  });
});
