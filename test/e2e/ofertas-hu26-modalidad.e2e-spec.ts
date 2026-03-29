/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/**
 * E2E Tests — HU26: Filtrar ofertas por modalidad
 *
 * FASE ROJA TDD: Todos los tests FALLARÁN antes de que se implemente el
 * código de producción. Razones concretas de fallo inicial:
 *
 * 1. El controlador no llama a `service.getFilteredOfertas()`, llama a
 *    `findFilteredOfertas()` que no devuelve el shape `{ data, total }`.
 * 2. El DTO de query (`FilterQueryParams`) no tiene el campo `modalidad`,
 *    por lo que la transformación por comas y la validación @IsIn no existen.
 * 3. El mensaje de error 400 para modalidad inválida no coincide con el contrato.
 * 4. Los campos `calificacionPromedio`, `numResenas` y `fechaCreacion` no están
 *    presentes a nivel raíz del OfertaDto en la respuesta actual.
 *
 * Contrato HTTP acordado:
 *   GET /api/ofertas?modalidad=PRESENCIAL,Virtual%2FPresencial
 *   → 200 { data: OfertaDto[], total: number }
 *
 *   GET /api/ofertas?modalidad=INVALIDO
 *   → 400 { statusCode: 400, message: [...], error: "Bad Request" }
 *
 *   (servicio lanza InternalServerErrorException)
 *   → 500 { statusCode: 500, message: "Error interno al filtrar ofertas.", error: "Internal Server Error" }
 */

import {
  INestApplication,
  InternalServerErrorException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { CreateOfertaUseCase } from '../../src/ofertas/application/use-cases/create-oferta.use-case';
import { GetAllOfertasUseCase } from '../../src/ofertas/application/use-cases/get-all-ofertas.use-case';
import { OfertasController } from '../../src/ofertas/ofertas.controller';
import { OfertasService } from '../../src/ofertas/ofertas.service';
import { Tutor } from '../../src/tutors/entities/tutor.entity';

// ─── Mock data (shape del OfertaDto según contrato HU26) ─────────────────────
// Los campos reflejan el contrato de respuesta esperado:
//   - `titulo`, `descripcion`, `modalidad`, `precioHora` (en español)
//   - `calificacionPromedio` y `numResenas` en la RAÍZ del objeto (no en tutor)
//   - `fechaCreacion` como string ISO 8601 (no `createdAt`)
//   - `tutor` con `id`, `nombre`, `fotoUrl`
// RIESGO 1 cubierto: calificacionPromedio/numResenas deben aplanarse desde TutorEntity.
// RIESGO 2 cubierto: fechaCreacion debe ser string ISO 8601.

const mockOfertaPresencial = {
  id: 'a1b2c3d4-0001-4000-8000-000000000001',
  titulo: 'Cálculo Diferencial Presencial',
  descripcion: 'Tutorías presenciales de cálculo diferencial e integral.',
  modalidad: 'PRESENCIAL',
  precioHora: 18.5,
  areaConocimiento: 'Matemáticas',
  nivel: 'Universitario',
  tutor: {
    id: 'tutor-0001-4000-8000-000000000001',
    nombre: 'Juan Pérez',
    fotoUrl: 'https://example.com/fotos/juan.jpg',
  },
  calificacionPromedio: 4.7,
  numResenas: 45,
  fechaCreacion: '2024-03-10T10:00:00.000Z',
};

const mockOfertaVirtual = {
  id: 'a1b2c3d4-0002-4000-8000-000000000002',
  titulo: 'Álgebra Lineal Online',
  descripcion: 'Clases virtuales de álgebra lineal.',
  modalidad: 'VIRTUAL',
  precioHora: 15.0,
  areaConocimiento: 'Matemáticas',
  nivel: 'Universitario',
  tutor: {
    id: 'tutor-0002-4000-8000-000000000002',
    nombre: 'María García',
    fotoUrl: null,
  },
  calificacionPromedio: 4.2,
  numResenas: 30,
  fechaCreacion: '2024-03-09T08:00:00.000Z',
};

const mockOfertaAmbos = {
  id: 'a1b2c3d4-0003-4000-8000-000000000003',
  titulo: 'Física General (Presencial y Virtual)',
  descripcion: 'Clases de física en cualquier modalidad.',
  modalidad: 'VIRTUAL/PRESENCIAL',
  precioHora: 20.0,
  areaConocimiento: 'Física',
  nivel: 'Universitario',
  tutor: {
    id: 'tutor-0003-4000-8000-000000000003',
    nombre: 'Carlos López',
    fotoUrl: 'https://example.com/fotos/carlos.jpg',
  },
  calificacionPromedio: 4.9,
  numResenas: 88,
  fechaCreacion: '2024-03-08T06:00:00.000Z',
};

// ─── Helpers de aserción reutilizables ────────────────────────────────────────

/**
 * Verifica la estructura completa de un OfertaDto en la respuesta.
 * Cubre Riesgos 1 y 2 del análisis:
 *   - Riesgo 1: calificacionPromedio y numResenas deben estar en la RAÍZ.
 *   - Riesgo 2: fechaCreacion debe ser un string ISO 8601.
 */
function assertOfertaDtoStructure(oferta: Record<string, unknown>): void {
  // Campos básicos de oferta
  expect(oferta).toHaveProperty('id');
  expect(typeof oferta.id).toBe('string');

  expect(oferta).toHaveProperty('titulo');
  expect(typeof oferta.titulo).toBe('string');

  expect(oferta).toHaveProperty('modalidad');
  expect(['PRESENCIAL', 'VIRTUAL', 'VIRTUAL/PRESENCIAL']).toContain(
    oferta.modalidad,
  );

  expect(oferta).toHaveProperty('precioHora');
  expect(typeof oferta.precioHora).toBe('number');

  // Tutor anidado con sus campos básicos
  expect(oferta).toHaveProperty('tutor');
  const tutor = oferta.tutor as Record<string, unknown>;
  expect(tutor).toHaveProperty('id');
  expect(tutor).toHaveProperty('nombre');

  // RIESGO 1: calificacionPromedio y numResenas en la RAÍZ de OfertaDto
  expect(oferta).toHaveProperty('calificacionPromedio');
  expect(typeof oferta.calificacionPromedio).toBe('number');

  expect(oferta).toHaveProperty('numResenas');
  expect(typeof oferta.numResenas).toBe('number');

  // RIESGO 2: fechaCreacion como string ISO 8601
  expect(oferta).toHaveProperty('fechaCreacion');
  expect(typeof oferta.fechaCreacion).toBe('string');
  expect(oferta.fechaCreacion as string).toMatch(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
  );
}

// ─────────────────────────────────────────────────────────────────────────────

describe('OfertasController (e2e) — HU26: Filtrar por modalidad', () => {
  let app: INestApplication;
  let mockTutorRepository: ReturnType<typeof createMockTutorRepository>;

  // El mock expone getFilteredOfertas (método NUEVO que aún no existe en el servicio real).
  // Los tests fallarán inicialmente porque el controlador llama a findFilteredOfertas,
  // no a getFilteredOfertas.
  const mockGetFilteredOfertas = jest.fn();

  const mockOfertasService = {
    getFilteredOfertas: mockGetFilteredOfertas,
    // Métodos existentes incluidos para no romper la inicialización del módulo
    findFilteredOfertas: jest.fn(),
    searchOffers: jest.fn(),
    findAllByTutorId: jest.fn(),
  };

  const mockCreateOfertaUseCase = { execute: jest.fn() };
  const mockGetAllOfertasUseCase = { execute: jest.fn() };

  const createMockTutorRepository = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  });

  beforeAll(async () => {
    mockTutorRepository = createMockTutorRepository();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OfertasController],
      providers: [
        { provide: OfertasService, useValue: mockOfertasService },
        { provide: CreateOfertaUseCase, useValue: mockCreateOfertaUseCase },
        { provide: GetAllOfertasUseCase, useValue: mockGetAllOfertasUseCase },
        {
          provide: getRepositoryToken(Tutor),
          useValue: mockTutorRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // ValidationPipe con transform: true es CRÍTICO para que el @Transform
    // del GetOfertasFilterDto divida la cadena por comas (Riesgo 3).
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Escenario 1: Filtrar por PRESENCIAL ──────────────────────────────────
  /**
   * GIVEN: Existen ofertas PRESENCIAL, VIRTUAL y VIRTUAL/PRESENCIAL en la base de datos.
   * WHEN:  GET /api/ofertas?modalidad=PRESENCIAL
   * THEN:  200 con ofertas PRESENCIAL y VIRTUAL/PRESENCIAL (expansión automática en use case).
   */
  describe('Escenario 1: Filtrar por modalidad=PRESENCIAL', () => {
    it('debe retornar 200 con ofertas PRESENCIAL y VIRTUAL/PRESENCIAL (expansión automática)', async () => {
      const mockResponse = {
        data: [mockOfertaPresencial, mockOfertaAmbos],
        total: 2,
      };
      mockGetFilteredOfertas.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/ofertas?modalidad=PRESENCIAL')
        .expect(200);

      // El servicio recibe solo ['PRESENCIAL']; la expansión ocurre en el use case
      expect(mockGetFilteredOfertas).toHaveBeenCalledWith(
        expect.objectContaining({ modalidad: ['PRESENCIAL'] }),
      );

      // Riesgo 6: el campo `total` debe estar en la respuesta
      expect(response.body).toHaveProperty('total', 2);

      // La clave de la lista debe ser `data` (no `ofertas`)
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(2);

      // Estructura completa de cada OfertaDto (Riesgos 1 y 2)
      assertOfertaDtoStructure(
        response.body.data[0] as Record<string, unknown>,
      );
      assertOfertaDtoStructure(
        response.body.data[1] as Record<string, unknown>,
      );

      // Los datos devueltos coinciden exactamente con el mock configurado
      expect(response.body).toEqual(mockResponse);

      // Sólo deben aparecer modalidades PRESENCIAL y VIRTUAL/PRESENCIAL
      const modalidades: string[] = (
        response.body.data as Array<{ modalidad: string }>
      ).map((o) => o.modalidad);
      expect(modalidades).not.toContain('VIRTUAL');
    });
  });

  // ── Escenario 2: Filtrar por VIRTUAL ─────────────────────────────────────
  /**
   * GIVEN: Existen ofertas PRESENCIAL, VIRTUAL y VIRTUAL/PRESENCIAL.
   * WHEN:  GET /api/ofertas?modalidad=VIRTUAL
   * THEN:  200 con ofertas VIRTUAL y VIRTUAL/PRESENCIAL (expansión automática en use case).
   */
  describe('Escenario 2: Filtrar por modalidad=VIRTUAL', () => {
    it('debe retornar 200 con ofertas VIRTUAL y VIRTUAL/PRESENCIAL (expansión automática)', async () => {
      const mockResponse = {
        data: [mockOfertaVirtual, mockOfertaAmbos],
        total: 2,
      };
      mockGetFilteredOfertas.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/ofertas?modalidad=VIRTUAL')
        .expect(200);

      // El servicio recibe solo ['VIRTUAL']; la expansión ocurre en el use case
      expect(mockGetFilteredOfertas).toHaveBeenCalledWith(
        expect.objectContaining({ modalidad: ['VIRTUAL'] }),
      );

      expect(response.body).toHaveProperty('total', 2);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(2);

      assertOfertaDtoStructure(
        response.body.data[0] as Record<string, unknown>,
      );
      assertOfertaDtoStructure(
        response.body.data[1] as Record<string, unknown>,
      );

      expect(response.body).toEqual(mockResponse);

      const modalidades: string[] = (
        response.body.data as Array<{ modalidad: string }>
      ).map((o) => o.modalidad);
      expect(modalidades).not.toContain('PRESENCIAL');
    });
  });

  // ── Escenario 3: Filtrar por VIRTUAL/PRESENCIAL ──────────────────────────────────────
  /**
   * GIVEN: Existen ofertas PRESENCIAL, VIRTUAL y VIRTUAL/PRESENCIAL.
   * WHEN:  GET /api/ofertas?modalidad=VIRTUAL/PRESENCIAL
   * THEN:  200 sólo con ofertas VIRTUAL/PRESENCIAL.
   */
  describe('Escenario 3: Filtrar por modalidad=VIRTUAL/PRESENCIAL (solo)', () => {
    it('debe retornar 200 únicamente con ofertas VIRTUAL/PRESENCIAL', async () => {
      const mockResponse = {
        data: [mockOfertaAmbos],
        total: 1,
      };
      mockGetFilteredOfertas.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/ofertas?modalidad=VIRTUAL%2FPRESENCIAL')
        .expect(200);

      expect(mockGetFilteredOfertas).toHaveBeenCalledWith(
        expect.objectContaining({ modalidad: ['VIRTUAL/PRESENCIAL'] }),
      );

      expect(response.body).toHaveProperty('total', 1);
      expect(response.body.data).toHaveLength(1);
      expect(
        (response.body.data as Array<{ modalidad: string }>)[0].modalidad,
      ).toBe('VIRTUAL/PRESENCIAL');

      assertOfertaDtoStructure(
        response.body.data[0] as Record<string, unknown>,
      );

      expect(response.body).toEqual(mockResponse);
    });
  });

  // ── Escenario 4: Sin filtro de modalidad (todas las ofertas) ──────────────
  /**
   * GIVEN: Existen ofertas de todas las modalidades.
   * WHEN:  GET /api/ofertas  (sin el parámetro `modalidad`)
   * THEN:  200 con todas las ofertas y modalidad undefined en el DTO.
   *
   * RIESGO 3: El @Transform sólo aplica cuando el campo está presente.
   * Cuando está ausente, modalidad debe llegar como undefined al servicio.
   */
  describe('Escenario 4: Sin parámetro modalidad (todas las ofertas)', () => {
    it('debe retornar 200 con todas las ofertas y llamar al servicio con modalidad=undefined', async () => {
      const mockResponse = {
        data: [mockOfertaPresencial, mockOfertaVirtual, mockOfertaAmbos],
        total: 3,
      };
      mockGetFilteredOfertas.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/ofertas')
        .expect(200);

      // Cuando modalidad no está en la query, el DTO debe tenerlo como undefined
      expect(mockGetFilteredOfertas).toHaveBeenCalledWith(
        expect.objectContaining({ modalidad: undefined }),
      );

      expect(response.body).toHaveProperty('total', 3);
      expect(response.body.data).toHaveLength(3);
      expect(response.body).toEqual(mockResponse);

      // Verifica estructura de todos los OfertaDtos
      (response.body.data as Array<Record<string, unknown>>).forEach(
        (oferta) => {
          assertOfertaDtoStructure(oferta);
        },
      );
    });
  });

  // ── Escenario 5: No hay ofertas que coincidan ───────────────────────────
  /**
   * GIVEN: No existen ofertas PRESENCIAL ni VIRTUAL/PRESENCIAL.
   * WHEN:  GET /api/ofertas?modalidad=PRESENCIAL,VIRTUAL/PRESENCIAL
   * THEN:  200 con data vacío y total=0.
   *
   * RIESGO 6: El campo `total` debe ser exactamente 0.
   */
  describe('Escenario 5: Sin ofertas que coincidan con el filtro', () => {
    it('debe retornar 200 con data=[] y total=0', async () => {
      mockGetFilteredOfertas.mockResolvedValue({ data: [], total: 0 });

      const response = await request(app.getHttpServer())
        .get('/api/ofertas?modalidad=PRESENCIAL,VIRTUAL%2FPRESENCIAL')
        .expect(200);

      expect(response.body).toEqual({ data: [], total: 0 });
      expect(response.body.data).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });

  // ── Escenario 6: Valor de modalidad inválido ──────────────────────────────
  /**
   * GIVEN: El sistema está operativo.
   * WHEN:  GET /api/ofertas?modalidad=INVALIDO
   * THEN:  400 con el mensaje exacto del contrato.
   *
   * RIESGO 5: El formato del error 400 debe ser exactamente el acordado.
   * Falla inicial porque: el DTO no tiene @IsIn para 'PRESENCIAL|VIRTUAL|VIRTUAL/PRESENCIAL'.
   */
  describe('Escenario 6: Valor de modalidad inválido', () => {
    it('debe retornar 400 con mensaje de error exacto del contrato', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/ofertas?modalidad=INVALIDO')
        .expect(400);

      // RIESGO 5: estructura exacta del error 400
      expect(response.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
      });
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          'Each modality must be one of the following values: PRESENCIAL, VIRTUAL, VIRTUAL/PRESENCIAL',
        ]),
      );

      // El servicio NO debe ser invocado si la validación falla
      expect(mockGetFilteredOfertas).not.toHaveBeenCalled();
    });
  });

  // ── Escenario 7: Mezcla de valores válidos e inválidos ────────────────────
  /**
   * GIVEN: El sistema está operativo.
   * WHEN:  GET /api/ofertas?modalidad=PRESENCIAL,MAL_VALOR,VIRTUAL/PRESENCIAL
   * THEN:  400 indicando que 'MAL_VALOR' no es un valor permitido.
   *
   * RIESGO 4: La coherencia del enum debe garantizarse en todos los valores del array.
   */
  describe('Escenario 7: Combinación de valores válidos e inválidos', () => {
    it('debe retornar 400 cuando hay al menos un valor inválido en la lista', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/ofertas?modalidad=PRESENCIAL,MAL_VALOR,VIRTUAL%2FPRESENCIAL')
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
      });
      // El mensaje debe indicar que hay valores no permitidos
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('PRESENCIAL, VIRTUAL, VIRTUAL/PRESENCIAL'),
        ]),
      );

      expect(mockGetFilteredOfertas).not.toHaveBeenCalled();
    });
  });

  // ── Escenario 8: InternalServerErrorException del servicio ────────────────
  /**
   * GIVEN: El servicio lanza InternalServerErrorException.
   * WHEN:  GET /api/ofertas?modalidad=VIRTUAL
   * THEN:  500 con el mensaje exacto del contrato.
   *
   * RIESGO 5: El formato del error 500 debe ser exactamente el acordado.
   */
  describe('Escenario 8: Error interno del servidor desde el servicio', () => {
    it('debe retornar 500 con el mensaje exacto del contrato cuando el servicio falla', async () => {
      mockGetFilteredOfertas.mockRejectedValue(
        new InternalServerErrorException('Error interno al filtrar ofertas.'),
      );

      const response = await request(app.getHttpServer())
        .get('/api/ofertas?modalidad=VIRTUAL')
        .expect(500);

      // RIESGO 5: estructura exacta del error 500
      expect(response.body).toEqual({
        statusCode: 500,
        message: 'Error interno al filtrar ofertas.',
        error: 'Internal Server Error',
      });
    });
  });
});
