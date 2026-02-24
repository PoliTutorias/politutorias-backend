/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  HttpStatus,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import request from 'supertest';
import { OfertasController } from './ofertas.controller';
import { CreateOfertaUseCase } from './application/use-cases/create-oferta.use-case';
import { GetAllOfertasUseCase } from './application/use-cases/get-all-ofertas.use-case';
import { OfertasService } from './ofertas.service';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { Oferta } from './domain/entities/oferta.entity';
import { v4 as uuid } from 'uuid';
import {
  PaginatedOffersResponse,
  OfferResponseDto,
} from './dto/paginated-offers-response.dto';

// Mock de la implementación del CreateOfertaUseCase para controlarlo en los tests
const mockCreateOfertaUseCase = {
  execute: jest.fn(),
};

// Mock de la implementación del GetAllOfertasUseCase
const mockGetAllOfertasUseCase = {
  execute: jest.fn(),
};

// Mock de OfertasService
const mockOfertasService = {
  findAllByTutorId: jest.fn(),
  searchOffers: jest.fn(),
};

describe('OfertasController (e2e)', () => {
  let app: INestApplication;
  const tutorId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; // ID de tutor hardcodeado en el controlador

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OfertasController],
      providers: [
        {
          provide: CreateOfertaUseCase,
          useValue: mockCreateOfertaUseCase,
        },
        {
          provide: GetAllOfertasUseCase,
          useValue: mockGetAllOfertasUseCase,
        },
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
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  // Escenario 1: Publicación de oferta exitosa
  it('should create an offer successfully and return 201', async () => {
    const createOfertaDto: CreateOfertaDto = {
      title: 'Cálculo Vectorial',
      price: 10,
      modality: 'Presencial',
      categories: ['Matemáticas'],
      description:
        'Se enseñará cálculo vectorial, incluyendo integrales de línea y superficie.',
    };

    const mockOfertaEntity: Partial<Oferta> = {
      id: uuid(),
      ...createOfertaDto,
      tutorId: tutorId,
      rating: 0.0,
      reviewsCount: 0,
      createdAt: new Date('2023-10-27T10:30:00.000Z'),
      updatedAt: new Date('2023-10-27T10:30:00.000Z'),
    };

    mockCreateOfertaUseCase.execute.mockResolvedValueOnce(mockOfertaEntity);

    await request(app.getHttpServer())
      .post('/api/ofertas')
      .send(createOfertaDto)
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body.statusCode).toBe(HttpStatus.CREATED);
        expect(res.body.message).toBe('Oferta creada exitosamente');
        expect(res.body.data.id).toBe(mockOfertaEntity.id);
        expect(res.body.data.title).toBe(mockOfertaEntity.title);
        expect(res.body.data.price).toBe(mockOfertaEntity.price);
        expect(res.body.data.tutorId).toBe(tutorId);
        expect(res.body.data.createdAt).toBe('2023-10-27T10:30:00.000Z');
        expect(res.body.data.updatedAt).toBe('2023-10-27T10:30:00.000Z');
        expect(mockCreateOfertaUseCase.execute).toHaveBeenCalledWith(
          createOfertaDto,
          tutorId,
        );
      });
  });

  // Escenario 2: Intento de publicación con título duplicado para el mismo tutor
  it('should return 409 Conflict if an offer with the same title already exists for the tutor', async () => {
    const createOfertaDto: CreateOfertaDto = {
      title: 'Cálculo Vectorial',
      price: 10,
      modality: 'Presencial',
      categories: ['Matemáticas'],
      description:
        'Se enseñará cálculo vectorial, incluyendo integrales de línea y superficie.',
    };

    mockCreateOfertaUseCase.execute.mockRejectedValueOnce(
      new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          message: 'Ya existe una oferta con este título para este tutor.',
          error: 'Conflict',
        },
        HttpStatus.CONFLICT,
      ),
    );

    await request(app.getHttpServer())
      .post('/api/ofertas')
      .send(createOfertaDto)
      .expect(HttpStatus.CONFLICT)
      .expect((res) => {
        expect(res.body).toEqual({
          statusCode: HttpStatus.CONFLICT,
          message: 'Ya existe una oferta con este título para este tutor.',
          error: 'Conflict',
        });
        expect(mockCreateOfertaUseCase.execute).toHaveBeenCalledWith(
          createOfertaDto,
          tutorId,
        );
      });
  });

  // Escenario 3: Publicación con campos de DTO inválidos (ej. título muy corto)
  it('should return 400 Bad Request if title is too short', async () => {
    const createOfertaDto: CreateOfertaDto = {
      title: 'AB',
      price: 10,
      modality: 'Presencial',
      categories: ['Matemáticas'],
      description:
        'Se enseñará cálculo vectorial, incluyendo integrales de línea y superficie.',
    };

    await request(app.getHttpServer())
      .post('/api/ofertas')
      .send(createOfertaDto)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        expect(res.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toContain(
          'El título de la oferta debe tener al menos 3 caracteres.',
        );
        expect(res.body.error).toBe('Bad Request');
        expect(mockCreateOfertaUseCase.execute).not.toHaveBeenCalled();
      });
  });

  // Escenario 4: Publicación con campos de DTO inválidos (ej. precio negativo)
  it('should return 400 Bad Request if price is negative', async () => {
    const createOfertaDto: CreateOfertaDto = {
      title: 'Cálculo Avanzado',
      price: -5,
      modality: 'Virtual',
      categories: ['Física'],
      description: 'Descripción de al menos 20 caracteres para el curso.',
    };

    await request(app.getHttpServer())
      .post('/api/ofertas')
      .send(createOfertaDto)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        expect(res.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toContain(
          'El precio por hora debe ser un valor positivo.',
        );
        expect(res.body.error).toBe('Bad Request');
        expect(mockCreateOfertaUseCase.execute).not.toHaveBeenCalled();
      });
  });

  // Escenario 5: Publicación con campos de DTO inválidos (ej. menos de una categoría)
  it('should return 400 Bad Request if categories array is empty', async () => {
    const createOfertaDto: CreateOfertaDto = {
      title: 'Álgebra Lineal',
      price: 15,
      modality: 'Presencial',
      categories: [],
      description:
        'Descripción de al menos 20 caracteres para el curso de álgebra lineal.',
    };

    await request(app.getHttpServer())
      .post('/api/ofertas')
      .send(createOfertaDto)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        expect(res.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toContain(
          'Debe seleccionar al menos una categoría.',
        );
        expect(res.body.error).toBe('Bad Request');
        expect(mockCreateOfertaUseCase.execute).not.toHaveBeenCalled();
      });
  });

  // Escenario 6: Publicación con campos de DTO inválidos (ej. `price` no numérico)
  it('should return 400 Bad Request if price is not a number', async () => {
    const createOfertaDto: any = {
      title: 'Física Cuántica',
      price: 'diez',
      modality: 'Virtual',
      categories: ['Física'],
      description:
        'Introducción a la física cuántica, incluyendo principios fundamentales.',
    };

    await request(app.getHttpServer())
      .post('/api/ofertas')
      .send(createOfertaDto)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        expect(res.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toContain(
          'El precio por hora debe ser un número.',
        );
        expect(res.body.error).toBe('Bad Request');
        expect(mockCreateOfertaUseCase.execute).not.toHaveBeenCalled();
      });
  });

  // Escenario 7: Error interno del servidor durante la persistencia
  it('should return 500 Internal Server Error if an unexpected error occurs during creation', async () => {
    const createOfertaDto: CreateOfertaDto = {
      title: 'Economía Básica',
      price: 20,
      modality: 'Presencial',
      categories: ['Economía'],
      description:
        'Fundamentos de la economía para principiantes, oferta única.',
    };

    mockCreateOfertaUseCase.execute.mockRejectedValueOnce(
      new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno del servidor al crear la oferta',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      ),
    );

    await request(app.getHttpServer())
      .post('/api/ofertas')
      .send(createOfertaDto)
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
      .expect((res) => {
        expect(res.body).toEqual({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno del servidor al crear la oferta',
          error: 'Internal Server Error',
        });
        expect(mockCreateOfertaUseCase.execute).toHaveBeenCalledWith(
          createOfertaDto,
          tutorId,
        );
      });
  });

  // Test adicional para `forbidNonWhitelisted`
  it('should return 400 Bad Request if unexpected properties are sent', async () => {
    const createOfertaDtoWithExtraField: any = {
      title: 'Química Orgánica',
      price: 18,
      modality: 'Virtual',
      categories: ['Química'],
      description: 'Conceptos clave de química orgánica.',
      unexpectedField: 'someValue', // Propiedad no esperada
    };

    await request(app.getHttpServer())
      .post('/api/ofertas')
      .send(createOfertaDtoWithExtraField)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        expect(res.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toContain(
          'property unexpectedField should not exist',
        );
        expect(res.body.error).toBe('Bad Request');
        expect(mockCreateOfertaUseCase.execute).not.toHaveBeenCalled();
      });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HU17 - Tests E2E: GET /api/ofertas/search
// Fase ROJA TDD: estos tests fallarán hasta que se implemente correctamente:
//   - Endpoint GET /api/ofertas/search en OfertasController
//   - Método searchOffers en OfertasService con la firma acordada
//   - ValidationPipe con transform:true para convertir page/limit a número
// ─────────────────────────────────────────────────────────────────────────────
describe('OfertasController - GET /api/ofertas/search (e2e) - HU17', () => {
  let app: INestApplication;

  const mockOfertasServiceHU17 = {
    findAllByTutorId: jest.fn(),
    searchOffers: jest.fn(),
  };

  const mockTutor = {
    id: 'uuid-tutor-1',
    name: 'Juan Pérez',
    photo: 'https://example.com/photos/juan_perez.jpg',
  };

  const mockOfferResponse: OfferResponseDto = {
    id: 'uuid-oferta-1',
    title: 'Cálculo Diferencial',
    price: 10.0,
    modality: 'Presencial',
    description: 'Clases personalizadas de cálculo diferencial.',
    tags: ['Matemática', 'Cálculo'],
    rating: 4.8,
    reviewsCount: 15,
    tutor: mockTutor,
    createdAt: new Date('2023-10-27T10:30:00.000Z'),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OfertasController],
      providers: [
        {
          provide: CreateOfertaUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetAllOfertasUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: OfertasService,
          useValue: mockOfertasServiceHU17,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    // transform: true es CRÍTICO para convertir page/limit de string a number
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  // ─── Escenario 1: 200 OK con searchTerm ────────────────────────────────────
  it('should return 200 OK with matching offers when searchTerm="Cálculo" is provided', async () => {
    const expectedResponse: PaginatedOffersResponse = {
      offers: [mockOfferResponse],
      totalResults: 1,
      currentPage: 1,
      itemsPerPage: 10,
      totalPages: 1,
    };
    mockOfertasServiceHU17.searchOffers.mockResolvedValue(expectedResponse);

    const response = await request(app.getHttpServer())
      .get('/api/ofertas/search?searchTerm=Cálculo')
      .expect(HttpStatus.OK);

    // Verifica que el servicio fue llamado con los parámetros correctos
    expect(mockOfertasServiceHU17.searchOffers).toHaveBeenCalledWith({
      searchTerm: 'Cálculo',
      page: 1,
      limit: 10,
    });

    // Verifica estructura de respuesta
    expect(response.body.totalResults).toBe(1);
    expect(response.body.currentPage).toBe(1);
    expect(response.body.itemsPerPage).toBe(10);
    expect(response.body.totalPages).toBe(1);
    expect(response.body.offers).toHaveLength(1);
    expect(response.body.offers[0].id).toBe('uuid-oferta-1');
    expect(response.body.offers[0].title).toBe('Cálculo Diferencial');
    expect(response.body.offers[0].tutor.name).toBe('Juan Pérez');
  });

  // ─── Escenario 2: 200 OK sin searchTerm (valores por defecto) ──────────────
  it('should return 200 OK with all offers when no searchTerm is provided (default page=1, limit=10)', async () => {
    const expectedResponse: PaginatedOffersResponse = {
      offers: [mockOfferResponse],
      totalResults: 5,
      currentPage: 1,
      itemsPerPage: 10,
      totalPages: 1,
    };
    mockOfertasServiceHU17.searchOffers.mockResolvedValue(expectedResponse);

    const response = await request(app.getHttpServer())
      .get('/api/ofertas/search')
      .expect(HttpStatus.OK);

    // Sin searchTerm → debe llamar al servicio con page y limit por defecto
    expect(mockOfertasServiceHU17.searchOffers).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
    expect(response.body.totalResults).toBe(5);
    expect(response.body.currentPage).toBe(1);
  });

  // ─── Escenario 3: 200 OK sin coincidencias ─────────────────────────────────
  it('should return 200 OK with empty offers array when searchTerm="Astronomía" has no matches', async () => {
    const emptyResponse: PaginatedOffersResponse = {
      offers: [],
      totalResults: 0,
      currentPage: 1,
      itemsPerPage: 10,
      totalPages: 0,
    };
    mockOfertasServiceHU17.searchOffers.mockResolvedValue(emptyResponse);

    const response = await request(app.getHttpServer())
      .get('/api/ofertas/search?searchTerm=Astronomía')
      .expect(HttpStatus.OK);

    expect(response.body.offers).toEqual([]);
    expect(response.body.totalResults).toBe(0);
    expect(response.body.currentPage).toBe(1);
    expect(response.body.itemsPerPage).toBe(10);
    expect(response.body.totalPages).toBe(0);
  });

  // ─── Escenario 4: 200 OK con paginación explícita (page=2, limit=5) ─────────
  it('should return 200 OK with correct pagination metadata (page=2, limit=5)', async () => {
    const expectedResponse: PaginatedOffersResponse = {
      offers: [mockOfferResponse],
      totalResults: 12,
      currentPage: 2,
      itemsPerPage: 5,
      totalPages: 3,
    };
    mockOfertasServiceHU17.searchOffers.mockResolvedValue(expectedResponse);

    const response = await request(app.getHttpServer())
      .get('/api/ofertas/search?page=2&limit=5')
      .expect(HttpStatus.OK);

    expect(mockOfertasServiceHU17.searchOffers).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
    });
    expect(response.body.currentPage).toBe(2);
    expect(response.body.itemsPerPage).toBe(5);
    expect(response.body.totalResults).toBe(12);
    expect(response.body.totalPages).toBe(3);
  });

  // ─── Escenario 5: 400 Bad Request - page=0 ────────────────────────────────
  it('should return 400 Bad Request when page=0 (below minimum)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/ofertas/search?page=0')
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.statusCode).toBe(400);
    expect(response.body.message).toContain('La página debe ser al menos 1.');
    expect(response.body.error).toBe('Bad Request');
    // El servicio NO debe ser invocado cuando el DTO falla la validación
    expect(mockOfertasServiceHU17.searchOffers).not.toHaveBeenCalled();
  });

  // ─── Escenario 6: 400 Bad Request - page no es entero ────────────────────
  it('should return 400 Bad Request when page=1.5 (not an integer)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/ofertas/search?page=1.5')
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.statusCode).toBe(400);
    expect(response.body.message).toContain(
      'La página debe ser un número entero.',
    );
    expect(response.body.error).toBe('Bad Request');
    expect(mockOfertasServiceHU17.searchOffers).not.toHaveBeenCalled();
  });

  // ─── Escenario 7: 400 Bad Request - limit=0 ──────────────────────────────
  it('should return 400 Bad Request when limit=0 (not positive)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/ofertas/search?limit=0')
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.statusCode).toBe(400);
    expect(response.body.message).toContain(
      'El límite debe ser un número positivo.',
    );
    expect(response.body.error).toBe('Bad Request');
    expect(mockOfertasServiceHU17.searchOffers).not.toHaveBeenCalled();
  });

  // ─── Escenario 8: 400 Bad Request - limit no es entero ───────────────────
  it('should return 400 Bad Request when limit=10.5 (not an integer)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/ofertas/search?limit=10.5')
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.statusCode).toBe(400);
    expect(response.body.message).toContain(
      'El límite debe ser un número entero.',
    );
    expect(response.body.error).toBe('Bad Request');
    expect(mockOfertasServiceHU17.searchOffers).not.toHaveBeenCalled();
  });

  // ─── Escenario 9: 500 Internal Server Error ───────────────────────────────
  it('should return 500 Internal Server Error when service throws InternalServerErrorException', async () => {
    mockOfertasServiceHU17.searchOffers.mockRejectedValue(
      new InternalServerErrorException(
        'Error al consultar las ofertas de tutoría.',
      ),
    );

    const response = await request(app.getHttpServer())
      .get('/api/ofertas/search')
      .expect(HttpStatus.INTERNAL_SERVER_ERROR);

    expect(response.body.statusCode).toBe(500);
    expect(response.body.message).toBe(
      'Error al consultar las ofertas de tutoría.',
    );
    expect(response.body.error).toBe('Internal Server Error');
  });
});
