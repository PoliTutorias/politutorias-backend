/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import {
  PaginatedOffersResponse,
  OfferResponseDto,
} from './interfaces/paginated-offers-response.interface';

/**
 * E2E Tests for HU03: GET /api/offers
 *
 * Fase ROJA TDD: estos tests fallarán hasta que existan:
 *   - OffersController en src/offers/offers.controller.ts
 *   - OffersService en src/offers/offers.service.ts
 *   - Interfaz PaginatedOffersResponse en src/offers/interfaces/paginated-offers-response.interface.ts
 *   - OfferQueryDto en src/offers/dto/offer-query.dto.ts
 */

describe('OffersController (e2e) - HU03', () => {
  let app: INestApplication;
  let offersService: OffersService;

  // ─── Mock data: 13 ofertas para cubrir escenarios de paginación ───────────
  const mockOffers: OfferResponseDto[] = [
    {
      id: 'uuid-oferta-1',
      title: 'Cálculo Vectorial',
      price: 10.0,
      modality: 'Virtual/Presencial',
      description:
        'Clases personalizadas de cálculo vectorial para estudiantes universitarios.',
      tags: ['Matemática', 'Formación Básica', 'Cálculo'],
      rating: 4.8,
      reviewsCount: 15,
      tutor: {
        id: 'uuid-tutor-juan',
        name: 'Juan Pérez',
        photo: 'https://example.com/photos/juan_perez.jpg',
      },
      createdAt: new Date('2023-10-27T10:30:00.000Z'),
    },
    {
      id: 'uuid-oferta-2',
      title: 'Álgebra Lineal',
      price: 12.0,
      modality: 'Virtual',
      description: 'desc',
      tags: ['Matemática'],
      rating: 4.5,
      reviewsCount: 10,
      tutor: { id: 't2', name: 'Maria', photo: 'photo' },
      createdAt: new Date('2023-10-27T10:31:00.000Z'),
    },
    {
      id: 'uuid-oferta-3',
      title: 'Física Clásica',
      price: 15.0,
      modality: 'Presencial',
      description: 'desc',
      tags: ['Física'],
      rating: 4.0,
      reviewsCount: 5,
      tutor: { id: 't3', name: 'Pedro', photo: 'photo' },
      createdAt: new Date('2023-10-27T10:32:00.000Z'),
    },
    {
      id: 'uuid-oferta-4',
      title: 'Química Orgánica',
      price: 20.0,
      modality: 'Virtual/Presencial',
      description: 'desc',
      tags: ['Química'],
      rating: 4.9,
      reviewsCount: 20,
      tutor: { id: 't4', name: 'Ana', photo: 'photo' },
      createdAt: new Date('2023-10-27T10:33:00.000Z'),
    },
    {
      id: 'uuid-oferta-5',
      title: 'Historia Antigua',
      price: 8.0,
      modality: 'Virtual',
      description: 'desc',
      tags: ['Historia'],
      rating: 3.5,
      reviewsCount: 2,
      tutor: { id: 't5', name: 'Luis', photo: 'photo' },
      createdAt: new Date('2023-10-27T10:34:00.000Z'),
    },
    {
      id: 'uuid-oferta-6',
      title: 'Literatura Moderna',
      price: 9.0,
      modality: 'Presencial',
      description: 'desc',
      tags: ['Literatura'],
      rating: 4.2,
      reviewsCount: 8,
      tutor: { id: 't6', name: 'Sofia', photo: 'photo' },
      createdAt: new Date('2023-10-27T10:35:00.000Z'),
    },
    {
      id: 'uuid-oferta-7',
      title: 'Programación Python',
      price: 25.0,
      modality: 'Virtual',
      description: 'desc',
      tags: ['Programación'],
      rating: 4.7,
      reviewsCount: 30,
      tutor: { id: 't7', name: 'Carlos', photo: 'photo' },
      createdAt: new Date('2023-10-27T10:36:00.000Z'),
    },
    {
      id: 'uuid-oferta-8',
      title: 'Diseño Gráfico',
      price: 18.0,
      modality: 'Virtual/Presencial',
      description: 'desc',
      tags: ['Diseño'],
      rating: 4.1,
      reviewsCount: 7,
      tutor: { id: 't8', name: 'Laura', photo: 'photo' },
      createdAt: new Date('2023-10-27T10:37:00.000Z'),
    },
    {
      id: 'uuid-oferta-9',
      title: 'Economía Básica',
      price: 11.0,
      modality: 'Presencial',
      description: 'desc',
      tags: ['Economía'],
      rating: 3.9,
      reviewsCount: 4,
      tutor: { id: 't9', name: 'David', photo: 'photo' },
      createdAt: new Date('2023-10-27T10:38:00.000Z'),
    },
    {
      id: 'uuid-oferta-10',
      title: 'Redacción Académica',
      price: 14.0,
      modality: 'Virtual',
      description: 'desc',
      tags: ['Comunicación'],
      rating: 4.6,
      reviewsCount: 12,
      tutor: { id: 't10', name: 'Elena', photo: 'photo' },
      createdAt: new Date('2023-10-27T10:39:00.000Z'),
    },
    {
      id: 'uuid-oferta-11',
      title: 'Estadística Aplicada',
      price: 16.0,
      modality: 'Virtual',
      description: 'desc',
      tags: ['Matemática'],
      rating: 4.3,
      reviewsCount: 9,
      tutor: { id: 't11', name: 'Pablo', photo: 'photo' },
      createdAt: new Date('2023-10-27T10:40:00.000Z'),
    },
    {
      id: 'uuid-oferta-12',
      title: 'Microeconomía',
      price: 13.0,
      modality: 'Presencial',
      description: 'desc',
      tags: ['Economía'],
      rating: 3.8,
      reviewsCount: 6,
      tutor: { id: 't12', name: 'Silvia', photo: 'photo' },
      createdAt: new Date('2023-10-27T10:41:00.000Z'),
    },
    {
      id: 'uuid-oferta-13',
      title: 'Cálculo Multivariable',
      price: 17.0,
      modality: 'Virtual/Presencial',
      description: 'desc',
      tags: ['Matemática'],
      rating: 4.9,
      reviewsCount: 18,
      tutor: { id: 't13', name: 'Marcos', photo: 'photo' },
      createdAt: new Date('2023-10-27T10:42:00.000Z'),
    },
  ];

  // ─── Setup ────────────────────────────────────────────────────────────────
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OffersController],
      providers: [
        {
          provide: OffersService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );
    await app.init();

    offersService = moduleFixture.get<OffersService>(OffersService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  // ─── Sanity ───────────────────────────────────────────────────────────────
  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(offersService).toBeDefined();
  });

  // ─── GET /api/offers ──────────────────────────────────────────────────────
  describe('GET /api/offers', () => {
    // 1. Paginación por defecto + estructura completa
    it('should return paginated offers with default parameters (page=1, limit=10) and correct structure (200 OK)', async () => {
      const expectedResponse: PaginatedOffersResponse = {
        offers: mockOffers.slice(0, 10),
        totalResults: 13,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 2,
      };
      (offersService.findAll as jest.Mock).mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .get('/api/offers')
        .expect(HttpStatus.OK);

      // Verifica que el servicio fue llamado con los valores por defecto
      expect(offersService.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });

      // Verifica estructura de paginación
      expect(response.body.totalResults).toBe(13);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.itemsPerPage).toBe(10);
      expect(response.body.totalPages).toBe(2);
      expect(response.body.offers).toHaveLength(10);

      // Verifica campos del primer OfferResponseDto
      const first = response.body.offers[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('title');
      expect(typeof first.price).toBe('number');
      expect(first).toHaveProperty('modality');
      expect(first).toHaveProperty('description');
      expect(Array.isArray(first.tags)).toBe(true);
      expect(typeof first.rating).toBe('number');
      expect(typeof first.reviewsCount).toBe('number');
      expect(first).toHaveProperty('tutor.id');
      expect(first).toHaveProperty('tutor.name');
      expect(first).toHaveProperty('tutor.photo');
      expect(first).toHaveProperty('createdAt');
      // createdAt debe ser formato ISO 8601
      expect(first.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
      );
    });

    // 2. Segunda página
    it('should return offers for the second page (page=2, limit=10) (200 OK)', async () => {
      const expectedResponse: PaginatedOffersResponse = {
        offers: mockOffers.slice(10, 13),
        totalResults: 13,
        currentPage: 2,
        itemsPerPage: 10,
        totalPages: 2,
      };
      (offersService.findAll as jest.Mock).mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .get('/api/offers?page=2&limit=10')
        .expect(HttpStatus.OK);

      expect(offersService.findAll).toHaveBeenCalledWith({ page: 2, limit: 10 });
      expect(response.body.offers).toHaveLength(3);
      expect(response.body.currentPage).toBe(2);
      expect(response.body.totalResults).toBe(13);
    });

    // 3. Filtro por modalidad
    it('should filter offers by modality "Virtual" (200 OK)', async () => {
      const filteredOffers = mockOffers.filter((o) =>
        o.modality.includes('Virtual'),
      );
      const expectedResponse: PaginatedOffersResponse = {
        offers: filteredOffers,
        totalResults: filteredOffers.length,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: Math.ceil(filteredOffers.length / 10),
      };
      (offersService.findAll as jest.Mock).mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .get('/api/offers?modality=Virtual')
        .expect(HttpStatus.OK);

      expect(offersService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        modality: 'Virtual',
      });
      expect(
        response.body.offers.every((o: OfferResponseDto) =>
          o.modality.includes('Virtual'),
        ),
      ).toBe(true);
    });

    // 4. Filtro por múltiples áreas de conocimiento (AND)
    it('should filter offers by multiple areas of knowledge ("Matemática" AND "Física") (200 OK)', async () => {
      const filteredOffers = mockOffers.filter(
        (o) =>
          o.tags.includes('Matemática') && o.tags.includes('Física'),
      );
      const expectedResponse: PaginatedOffersResponse = {
        offers: filteredOffers,
        totalResults: filteredOffers.length,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: Math.ceil(filteredOffers.length / 10) || 1,
      };
      (offersService.findAll as jest.Mock).mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .get('/api/offers?areaConocimiento=Matemática&areaConocimiento=Física')
        .expect(HttpStatus.OK);

      expect(offersService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        areaConocimiento: ['Matemática', 'Física'],
      });
    });

    // 5. Filtro por rango de precios
    it('should filter offers by price range (minPrice=10, maxPrice=20) (200 OK)', async () => {
      const filteredOffers = mockOffers.filter(
        (o) => o.price >= 10 && o.price <= 20,
      );
      const expectedResponse: PaginatedOffersResponse = {
        offers: filteredOffers,
        totalResults: filteredOffers.length,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: Math.ceil(filteredOffers.length / 10),
      };
      (offersService.findAll as jest.Mock).mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .get('/api/offers?minPrice=10&maxPrice=20')
        .expect(HttpStatus.OK);

      expect(offersService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        minPrice: 10,
        maxPrice: 20,
      });
      expect(
        response.body.offers.every(
          (o: OfferResponseDto) => o.price >= 10 && o.price <= 20,
        ),
      ).toBe(true);
    });

    // 6. Ordenamiento por precio ascendente
    it('should sort offers by price ascending (sortBy=price&sortOrder=asc) (200 OK)', async () => {
      const sortedOffers = [...mockOffers].sort((a, b) => a.price - b.price);
      const expectedResponse: PaginatedOffersResponse = {
        offers: sortedOffers.slice(0, 10),
        totalResults: 13,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 2,
      };
      (offersService.findAll as jest.Mock).mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .get('/api/offers?sortBy=price&sortOrder=asc')
        .expect(HttpStatus.OK);

      expect(offersService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'price',
        sortOrder: 'asc',
      });
      expect(response.body.offers[0].price).toBeLessThanOrEqual(
        response.body.offers[1].price,
      );
    });

    // 7. Parámetros de paginación inválidos → 400
    it('should return 400 Bad Request for invalid pagination parameters (page=0, limit=101)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/offers?page=0&limit=101')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toEqual({
        statusCode: 400,
        message: expect.arrayContaining([
          'page must not be less than 1',
          'limit must not be greater than 100',
        ]),
        error: 'Bad Request',
      });
      // El servicio NO debe ser invocado cuando el DTO falla
      expect(offersService.findAll).not.toHaveBeenCalled();
    });

    // 8. sortOrder inválido → 400
    it('should return 400 Bad Request for invalid sortOrder parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/offers?sortBy=price&sortOrder=invalid_value')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toEqual({
        statusCode: 400,
        message: expect.arrayContaining([
          expect.stringContaining('sortOrder'),
        ]),
        error: 'Bad Request',
      });
      expect(offersService.findAll).not.toHaveBeenCalled();
    });

    // 9. Error inesperado del servicio → 500
    it('should return 500 Internal Server Error if the service throws an unexpected error', async () => {
      (offersService.findAll as jest.Mock).mockRejectedValue(
        new Error('Database connection failed.'),
      );

      const response = await request(app.getHttpServer())
        .get('/api/offers')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body).toEqual({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Error al consultar la base de datos.',
      });
      expect(offersService.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });
});
