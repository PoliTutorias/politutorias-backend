/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import request from 'supertest';
import { OfertasController } from './ofertas.controller';
import { CreateOfertaUseCase } from './application/use-cases/create-oferta.use-case';
import { GetAllOfertasUseCase } from './application/use-cases/get-all-ofertas.use-case';
import { OfertasService } from './ofertas.service';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { Oferta } from './domain/entities/oferta.entity';
import { v4 as uuid } from 'uuid';

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
