/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { OfertasController } from '../src/ofertas/ofertas.controller';
import { CreateOfertaUseCase } from '../src/ofertas/application/use-cases/create-oferta.use-case';
import { GetAllOfertasUseCase } from '../src/ofertas/application/use-cases/get-all-ofertas.use-case';
import { OfertasService } from '../src/ofertas/ofertas.service';

/**
 * E2E Tests for HU17: GET /api/ofertas/search
 *
 * Validates the search and pagination functionality for tutoring offers.
 * Tests search by title or tutor name with pagination support.
 */

// Mock de OfertasService
const mockOfertasService = {
  findAllByTutorId: jest.fn(),
  searchOffers: jest.fn(),
};

// Mock de los use cases de HU01
const mockCreateOfertaUseCase = {
  execute: jest.fn(),
};

const mockGetAllOfertasUseCase = {
  execute: jest.fn(),
};

describe('OfertasController - GET /api/ofertas/search (e2e) - HU17', () => {
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

  // Scenario 1: Search with results
  describe('Scenario 1: Search with matching results', () => {
    it('should return paginated results when searching for "matemáticas"', async () => {
      const mockResponse = {
        offers: [
          {
            id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
            title: 'Cálculo Vectorial - Matemáticas',
            price: 10.0,
            modality: 'Presencial',
            description: 'Clases de cálculo vectorial',
            tags: ['Matemáticas', 'Física'],
            rating: 4.5,
            reviewsCount: 10,
            tutor: {
              id: 'tutor-1',
              name: 'Juan Pérez',
              photo: 'https://example.com/photo.jpg',
            },
            createdAt: '2024-01-15T10:00:00.000Z',
          },
          {
            id: 'b2c3d4e5-f6g7-8901-2345-678901bcdefg',
            title: 'Álgebra Lineal',
            price: 15.0,
            modality: 'Virtual',
            description: 'Clases de álgebra lineal',
            tags: ['Matemáticas'],
            rating: 4.8,
            reviewsCount: 25,
            tutor: {
              id: 'tutor-2',
              name: 'María González',
              photo: 'https://example.com/photo2.jpg',
            },
            createdAt: '2024-01-16T10:00:00.000Z',
          },
        ],
        totalResults: 2,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 1,
      };

      mockOfertasService.searchOffers.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/ofertas/search')
        .query({ searchTerm: 'matemáticas', page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockResponse);
      expect(mockOfertasService.searchOffers).toHaveBeenCalledWith({
        searchTerm: 'matemáticas',
        page: 1,
        limit: 10,
      });
    });

    it('should search by tutor name', async () => {
      const mockResponse = {
        offers: [
          {
            id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
            title: 'Programación en Python',
            price: 20.0,
            modality: 'Virtual',
            description: 'Clases de Python',
            tags: ['Programación', 'Python'],
            rating: 4.9,
            reviewsCount: 30,
            tutor: {
              id: 'tutor-1',
              name: 'Juan Pérez',
              photo: 'https://example.com/photo.jpg',
            },
            createdAt: '2024-01-15T10:00:00.000Z',
          },
        ],
        totalResults: 1,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 1,
      };

      mockOfertasService.searchOffers.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/ofertas/search')
        .query({ searchTerm: 'Juan', page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockResponse);
      expect(mockOfertasService.searchOffers).toHaveBeenCalledWith({
        searchTerm: 'Juan',
        page: 1,
        limit: 10,
      });
    });
  });

  // Scenario 2: Search with no results
  describe('Scenario 2: Search with no results', () => {
    it('should return empty array when no offers match the search term', async () => {
      const mockResponse = {
        offers: [],
        totalResults: 0,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 0,
      };

      mockOfertasService.searchOffers.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/ofertas/search')
        .query({ searchTerm: 'nonexistent', page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockResponse);
      expect(response.body.offers).toHaveLength(0);
    });
  });

  // Scenario 3: Search without searchTerm (all offers)
  describe('Scenario 3: Get all offers with pagination', () => {
    it('should return all offers when searchTerm is empty', async () => {
      const mockResponse = {
        offers: [
          {
            id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
            title: 'Física Cuántica',
            price: 25.0,
            modality: 'Presencial',
            description: 'Clases de física cuántica',
            tags: ['Física'],
            rating: 4.7,
            reviewsCount: 15,
            tutor: {
              id: 'tutor-1',
              name: 'Carlos Rodríguez',
              photo: 'https://example.com/photo3.jpg',
            },
            createdAt: '2024-01-15T10:00:00.000Z',
          },
        ],
        totalResults: 50,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 5,
      };

      mockOfertasService.searchOffers.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/ofertas/search')
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockResponse);
      expect(mockOfertasService.searchOffers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });
  });

  // Scenario 4: Pagination
  describe('Scenario 4: Pagination', () => {
    it('should handle pagination correctly for page 2', async () => {
      const mockResponse = {
        offers: [
          {
            id: 'c3d4e5f6-g7h8-9012-3456-789012cdefgh',
            title: 'Historia del Arte',
            price: 12.0,
            modality: 'Virtual',
            description: 'Clases de historia del arte',
            tags: ['Historia', 'Arte'],
            rating: 4.6,
            reviewsCount: 20,
            tutor: {
              id: 'tutor-3',
              name: 'Ana López',
              photo: 'https://example.com/photo4.jpg',
            },
            createdAt: '2024-01-17T10:00:00.000Z',
          },
        ],
        totalResults: 15,
        currentPage: 2,
        itemsPerPage: 10,
        totalPages: 2,
      };

      mockOfertasService.searchOffers.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/ofertas/search')
        .query({ searchTerm: 'arte', page: 2, limit: 10 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockResponse);
      expect(response.body.currentPage).toBe(2);
      expect(mockOfertasService.searchOffers).toHaveBeenCalledWith({
        searchTerm: 'arte',
        page: 2,
        limit: 10,
      });
    });

    it('should use default pagination values when not provided', async () => {
      const mockResponse = {
        offers: [],
        totalResults: 0,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 0,
      };

      mockOfertasService.searchOffers.mockResolvedValue(mockResponse);

      await request(app.getHttpServer())
        .get('/api/ofertas/search')
        .expect(HttpStatus.OK);

      expect(mockOfertasService.searchOffers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });
  });

  // Scenario 5: Invalid query parameters
  describe('Scenario 5: Invalid query parameters', () => {
    it('should return 400 when page is less than 1', async () => {
      await request(app.getHttpServer())
        .get('/api/ofertas/search')
        .query({ page: 0, limit: 10 })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when limit is not positive', async () => {
      await request(app.getHttpServer())
        .get('/api/ofertas/search')
        .query({ page: 1, limit: 0 })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when limit is negative', async () => {
      await request(app.getHttpServer())
        .get('/api/ofertas/search')
        .query({ page: 1, limit: -5 })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
