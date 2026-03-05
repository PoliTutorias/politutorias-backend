import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
    Between,
    In,
    IsNull,
    LessThanOrEqual,
    MoreThanOrEqual,
    Not,
} from 'typeorm';
import { AvailabilityEntity } from '../disponibilidad/entities/availability.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { Oferta } from './domain/entities/oferta.entity';
import { OffersQueryParams } from './dto/offers-query.dto';
import { PaginatedOffersResponse } from './dto/paginated-offers-response.dto';
import { OfertasService } from './ofertas.service';

/**
 * Unit Tests for OfertasService - HU02: findAllByTutorId
 *
 * These tests are in the RED phase of TDD - they will FAIL initially because:
 * 1. OfertasService class does not exist yet
 * 2. The findAllByTutorId method is not implemented
 * 3. The mapping logic (modality → isPresencial, price → pricePerHour, categories → tags) is missing
 *
 * These tests validate the domain rules and mapping logic.
 */

describe('OfertasService - findAllByTutorId (Unit Tests) - HU02', () => {
  let service: OfertasService;

  const mockRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfertasService,
        {
          provide: getRepositoryToken(Oferta),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(AvailabilityEntity),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<OfertasService>(OfertasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Escenario 1: Tutor tiene ofertas con diferentes modalidades
   * Given: El repositorio retorna entidades con modality "Presencial" y "Virtual"
   * When: Se llama a findAllByTutorId
   * Then: Debe mapear correctamente las entidades a OfertaDto
   */
  describe('Scenario 1: Tutor has offers with mixed modalities', () => {
    it('should correctly map Oferta entities to OfertaDto with proper field transformations', async () => {
      const tutorId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

      // Mock entities from database
      const mockOfertaEntities: Partial<Oferta>[] = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          title: 'Cálculo en una Variable',
          description:
            'Me enfoco en ejercicios de MRU y aplicaciones de derivadas e integrales.',
          modality: 'Presencial', // Debe mapear a isPresencial = true
          price: 10.0, // Debe mapear a pricePerHour = 10.00
          categories: [
            'Matemática',
            'Formación Básica',
            'Preparación de Exámenes',
            'Resolución de Ejercicios',
            'Laboratorios',
          ], // Debe mapear a tags
          tutorId: tutorId,
          createdAt: new Date('2023-10-27T10:30:00.000Z'),
          updatedAt: new Date('2023-10-27T10:30:00.000Z'),
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          title: 'Física General',
          description: 'Clases de física con énfasis en mecánica clásica.',
          modality: 'Virtual', // Debe mapear a isPresencial = false
          price: 15.0, // Debe mapear a pricePerHour = 15.00
          categories: ['Física', 'Formación Básica'], // Debe mapear a tags
          tutorId: tutorId,
          createdAt: new Date('2023-10-28T14:20:00.000Z'),
          updatedAt: new Date('2023-10-28T14:20:00.000Z'),
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          title: 'Química Orgánica',
          description: 'Estudio de compuestos orgánicos y reacciones.',
          modality: 'Híbrida', // Cualquier valor diferente a "Presencial" → isPresencial = false
          price: 20.0,
          categories: ['Química', 'Ciencias'],
          tutorId: tutorId,
          createdAt: new Date('2023-10-29T09:15:00.000Z'),
          updatedAt: new Date('2023-10-29T09:15:00.000Z'),
        },
      ];

      mockRepository.find.mockResolvedValueOnce(mockOfertaEntities);

      const result = await service.findAllByTutorId(tutorId);

      // Verifica que el repositorio fue llamado correctamente
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tutorId: tutorId },
      });

      // Verifica que el resultado es un arreglo
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);

      // Verifica el mapeo de la primera oferta (Presencial)
      expect(result[0]).toEqual({
        id: '11111111-1111-1111-1111-111111111111',
        title: 'Cálculo en una Variable',
        description:
          'Me enfoco en ejercicios de MRU y aplicaciones de derivadas e integrales.',
        isPresencial: true, // CRÍTICO: modality === "Presencial" → true
        pricePerHour: 10.0, // CRÍTICO: price → pricePerHour
        tags: [
          'Matemática',
          'Formación Básica',
          'Preparación de Exámenes',
          'Resolución de Ejercicios',
          'Laboratorios',
        ], // CRÍTICO: categories → tags
        createdAt: '2023-10-27T10:30:00.000Z',
      });

      // Verifica el mapeo de la segunda oferta (Virtual)
      expect(result[1]).toEqual({
        id: '22222222-2222-2222-2222-222222222222',
        title: 'Física General',
        description: 'Clases de física con énfasis en mecánica clásica.',
        isPresencial: false, // CRÍTICO: modality !== "Presencial" → false
        pricePerHour: 15.0,
        tags: ['Física', 'Formación Básica'],
        createdAt: '2023-10-28T14:20:00.000Z',
      });

      // Verifica el mapeo de la tercera oferta (Híbrida)
      expect(result[2]).toEqual({
        id: '33333333-3333-3333-3333-333333333333',
        title: 'Química Orgánica',
        description: 'Estudio de compuestos orgánicos y reacciones.',
        isPresencial: false, // CRÍTICO: modality !== "Presencial" → false
        pricePerHour: 20.0,
        tags: ['Química', 'Ciencias'],
        createdAt: '2023-10-29T09:15:00.000Z',
      });

      // Verifica que los DTOs NO contienen campos de la entidad
      result.forEach((dto) => {
        expect(dto).not.toHaveProperty('modality');
        expect(dto).not.toHaveProperty('price');
        expect(dto).not.toHaveProperty('categories');
        expect(dto).not.toHaveProperty('tutorId');
        expect(dto).not.toHaveProperty('updatedAt');
      });
    });

    /**
     * Test específico para validar la lógica de mapeo isPresencial
     */
    it('should map isPresencial to true only when modality is exactly "Presencial"', async () => {
      const tutorId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

      const mockOfertaEntities: Partial<Oferta>[] = [
        {
          id: '1',
          title: 'Test 1',
          description: 'Test description',
          modality: 'Presencial', // → true
          price: 10,
          categories: ['Test'],
          tutorId: tutorId,
          createdAt: new Date('2023-10-27T10:30:00.000Z'),
          updatedAt: new Date('2023-10-27T10:30:00.000Z'),
        },
        {
          id: '2',
          title: 'Test 2',
          description: 'Test description',
          modality: 'presencial', // case-sensitive: → false
          price: 10,
          categories: ['Test'],
          tutorId: tutorId,
          createdAt: new Date('2023-10-27T10:30:00.000Z'),
          updatedAt: new Date('2023-10-27T10:30:00.000Z'),
        },
        {
          id: '3',
          title: 'Test 3',
          description: 'Test description',
          modality: 'Virtual', // → false
          price: 10,
          categories: ['Test'],
          tutorId: tutorId,
          createdAt: new Date('2023-10-27T10:30:00.000Z'),
          updatedAt: new Date('2023-10-27T10:30:00.000Z'),
        },
        {
          id: '4',
          title: 'Test 4',
          description: 'Test description',
          modality: 'Híbrida', // → false
          price: 10,
          categories: ['Test'],
          tutorId: tutorId,
          createdAt: new Date('2023-10-27T10:30:00.000Z'),
          updatedAt: new Date('2023-10-27T10:30:00.000Z'),
        },
        {
          id: '5',
          title: 'Test 5',
          description: 'Test description',
          modality: '', // empty string → false
          price: 10,
          categories: ['Test'],
          tutorId: tutorId,
          createdAt: new Date('2023-10-27T10:30:00.000Z'),
          updatedAt: new Date('2023-10-27T10:30:00.000Z'),
        },
      ];

      mockRepository.find.mockResolvedValueOnce(mockOfertaEntities);

      const result = await service.findAllByTutorId(tutorId);

      // CRÍTICO: Solo "Presencial" (case-sensitive) debe ser true
      expect(result[0].isPresencial).toBe(true);
      expect(result[1].isPresencial).toBe(false); // "presencial" minúsculas
      expect(result[2].isPresencial).toBe(false); // "Virtual"
      expect(result[3].isPresencial).toBe(false); // "Híbrida"
      expect(result[4].isPresencial).toBe(false); // ""
    });
  });

  /**
   * Escenario 2: Tutor no tiene ofertas
   * Given: El repositorio retorna un arreglo vacío
   * When: Se llama a findAllByTutorId
   * Then: Debe retornar un arreglo vacío
   */
  describe('Scenario 2: Tutor has no offers', () => {
    it('should return an empty array when tutor has no offers', async () => {
      const tutorId = 'f5e4d3c2-b1a0-9876-5432-10fedcba9876';

      mockRepository.find.mockResolvedValueOnce([]);

      const result = await service.findAllByTutorId(tutorId);

      // Verifica que el repositorio fue llamado correctamente
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tutorId: tutorId },
      });

      // CRÍTICO: Debe retornar un arreglo vacío, NO null, NO undefined
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  /**
   * Escenario 3: Error en el repositorio
   * Given: El repositorio lanza una excepción
   * When: Se llama a findAllByTutorId
   * Then: La excepción debe propagarse (o transformarse según la implementación)
   */
  describe('Scenario 3: Repository throws an error', () => {
    it('should throw an error when repository fails', async () => {
      const tutorId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
      const dbError = new Error('Database connection failed');

      mockRepository.find.mockRejectedValueOnce(dbError);

      // Verifica que el error se propague
      await expect(service.findAllByTutorId(tutorId)).rejects.toThrow(
        'Database connection failed',
      );

      // Verifica que el repositorio fue llamado
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tutorId: tutorId },
      });
    });

    it('should handle generic errors from repository', async () => {
      const tutorId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
      const genericError = new Error('Unexpected error');

      mockRepository.find.mockRejectedValueOnce(genericError);

      await expect(service.findAllByTutorId(tutorId)).rejects.toThrow();

      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test adicional: Verifica que el formato de createdAt sea ISO 8601
   */
  describe('Additional: Date formatting', () => {
    it('should format createdAt as ISO 8601 string', async () => {
      const tutorId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

      const mockOfertaEntities: Partial<Oferta>[] = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          title: 'Test Oferta',
          description: 'Test description for date formatting.',
          modality: 'Presencial',
          price: 10.0,
          categories: ['Test'],
          tutorId: tutorId,
          createdAt: new Date('2023-10-27T10:30:00.000Z'),
          updatedAt: new Date('2023-10-27T10:30:00.000Z'),
        },
      ];

      mockRepository.find.mockResolvedValueOnce(mockOfertaEntities);

      const result = await service.findAllByTutorId(tutorId);

      // CRÍTICO: createdAt debe ser string en formato ISO 8601
      expect(typeof result[0].createdAt).toBe('string');
      expect(result[0].createdAt).toBe('2023-10-27T10:30:00.000Z');

      // Verifica que sea una fecha válida en formato ISO
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(result[0].createdAt).toMatch(dateRegex);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HU17 - Tests Unitarios: searchOffers
// Fase ROJA TDD: estos tests fallarán hasta que se implemente correctamente:
//   - Método searchOffers en OfertasService
//   - QueryBuilder con LOWER() LIKE y LEFT JOIN a tutor
//   - Mapeo categories→tags, photoUrl→photo, price→parseFloat
//   - Manejo de InternalServerErrorException con mensaje acordado
// ─────────────────────────────────────────────────────────────────────────────
describe('OfertasService - searchOffers (Unit Tests) - HU17', () => {
  let service: OfertasService;

  // ─── Datos de prueba ──────────────────────────────────────────────────────
  const mockTutor = {
    id: 'uuid-tutor-juan',
    nombreCompleto: 'Juan Pérez',
    ofertas: [],
  } as unknown as Tutor;

  const mockTutor2 = {
    id: 'uuid-tutor-programador',
    nombreCompleto: 'Programador Experto',
    ofertas: [],
  } as unknown as Tutor;

  const mockOfertasEntity: Partial<Oferta>[] = [
    {
      id: 'uuid-oferta-1',
      title: 'Cálculo Diferencial',
      price: 10.0,
      modality: 'Presencial',
      categories: ['Matemática', 'Cálculo'],
      description: 'Clases personalizadas de cálculo diferencial.',
      rating: 4.8,
      reviewsCount: 15,
      tutorId: mockTutor.id,
      tutor: mockTutor,
      createdAt: new Date('2023-10-27T10:30:00.000Z'),
      updatedAt: new Date('2023-10-27T10:30:00.000Z'),
    },
    {
      id: 'uuid-oferta-2',
      title: 'Álgebra Lineal',
      price: 12.0,
      modality: 'Virtual',
      categories: ['Matemática', 'Álgebra'],
      description: 'Tutorías de álgebra lineal avanzada.',
      rating: 4.5,
      reviewsCount: 10,
      tutorId: mockTutor.id,
      tutor: mockTutor,
      createdAt: new Date('2023-10-28T11:00:00.000Z'),
      updatedAt: new Date('2023-10-28T11:00:00.000Z'),
    },
    {
      id: 'uuid-oferta-3',
      title: 'Programación en Python',
      price: 20.0,
      modality: 'Virtual',
      categories: ['Programación', 'Python'],
      description: 'Aprende programación Python desde cero.',
      rating: 4.9,
      reviewsCount: 30,
      tutorId: mockTutor2.id,
      tutor: mockTutor2,
      createdAt: new Date('2023-10-29T09:00:00.000Z'),
      updatedAt: new Date('2023-10-29T09:00:00.000Z'),
    },
  ];

  // ─── Mock QueryBuilder (cadena fluida HU17) ───────────────────────────────
  const mockQBHU17 = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockRepositoryHU17 = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQBHU17),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfertasService,
        {
          provide: getRepositoryToken(Oferta),
          useValue: mockRepositoryHU17,
        },
        {
          provide: getRepositoryToken(AvailabilityEntity),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<OfertasService>(OfertasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Scenario 1: Búsqueda por título - coincidencia única', () => {
    it('should use LOWER() LIKE and return matching offer when searchTerm matches title', async () => {
      const ofertaCalculo = [mockOfertasEntity[0]] as Oferta[];
      mockQBHU17.getManyAndCount.mockResolvedValue([ofertaCalculo, 1]);

      const result = await service.searchOffers({ searchTerm: 'Cálculo' });

      expect(mockRepositoryHU17.createQueryBuilder).toHaveBeenCalledWith(
        'offer',
      );
      expect(mockQBHU17.leftJoinAndSelect).toHaveBeenCalledWith(
        'offer.tutor',
        'tutor',
      );
      expect(mockQBHU17.andWhere).toHaveBeenCalledWith(
        '(LOWER(offer.title) LIKE LOWER(:searchTerm) OR LOWER(tutor.nombreCompleto) LIKE LOWER(:searchTerm))',
        { searchTerm: '%Cálculo%' },
      );
      expect(result.totalResults).toBe(1);
      expect(result.offers).toHaveLength(1);
      expect(result.offers[0].title).toBe('Cálculo Diferencial');
      // Verifica mapeo categories → tags
      expect(result.offers[0].tags).toEqual(mockOfertasEntity[0].categories);
      // Verifica mapeo photoUrl → photo
      expect(result.offers[0].tutor?.photo).toBe('');
      // Verifica que price es number
      expect(typeof result.offers[0].price).toBe('number');
    });
  });

  describe('Scenario 2: Búsqueda por nombre de tutor', () => {
    it('should match offers by tutor name using LOWER() LIKE', async () => {
      const ofertasJuan = mockOfertasEntity.slice(0, 2) as Oferta[];
      mockQBHU17.getManyAndCount.mockResolvedValue([ofertasJuan, 2]);

      const result = await service.searchOffers({ searchTerm: 'Juan Pérez' });

      expect(mockQBHU17.andWhere).toHaveBeenCalledWith(
        '(LOWER(offer.title) LIKE LOWER(:searchTerm) OR LOWER(tutor.nombreCompleto) LIKE LOWER(:searchTerm))',
        { searchTerm: '%Juan Pérez%' },
      );
      expect(result.totalResults).toBe(2);
    });
  });

  describe('Scenario 3: Búsqueda que coincide por título y por tutor (condición OR)', () => {
    it('should use OR condition covering both title and tutor.name', async () => {
      const allMatches = mockOfertasEntity as Oferta[];
      mockQBHU17.getManyAndCount.mockResolvedValue([allMatches, 3]);

      await service.searchOffers({ searchTerm: 'Programación' });

      expect(mockQBHU17.andWhere).toHaveBeenCalledWith(
        '(LOWER(offer.title) LIKE LOWER(:searchTerm) OR LOWER(tutor.nombreCompleto) LIKE LOWER(:searchTerm))',
        { searchTerm: '%Programación%' },
      );
    });
  });

  describe('Scenario 4: Búsqueda insensible a mayúsculas/minúsculas', () => {
    it('should find offer when searchTerm is lowercase "cálculo"', async () => {
      const ofertaCalculo = [mockOfertasEntity[0]] as Oferta[];
      mockQBHU17.getManyAndCount.mockResolvedValue([ofertaCalculo, 1]);

      await service.searchOffers({ searchTerm: 'cálculo' });

      expect(mockQBHU17.andWhere).toHaveBeenCalledWith(
        '(LOWER(offer.title) LIKE LOWER(:searchTerm) OR LOWER(tutor.nombreCompleto) LIKE LOWER(:searchTerm))',
        { searchTerm: '%cálculo%' },
      );
    });

    it('should find offer when searchTerm is uppercase "CÁLCULO"', async () => {
      const ofertaCalculo = [mockOfertasEntity[0]] as Oferta[];
      mockQBHU17.getManyAndCount.mockResolvedValue([ofertaCalculo, 1]);

      await service.searchOffers({ searchTerm: 'CÁLCULO' });

      expect(mockQBHU17.andWhere).toHaveBeenCalledWith(
        '(LOWER(offer.title) LIKE LOWER(:searchTerm) OR LOWER(tutor.nombreCompleto) LIKE LOWER(:searchTerm))',
        { searchTerm: '%CÁLCULO%' },
      );
    });
  });

  describe('Scenario 5: Búsqueda ignorando espacios en blanco (trim)', () => {
    it('should trim searchTerm before applying LIKE pattern', async () => {
      const ofertaAlgebra = [mockOfertasEntity[1]] as Oferta[];
      mockQBHU17.getManyAndCount.mockResolvedValue([ofertaAlgebra, 1]);

      await service.searchOffers({ searchTerm: ' Álgebra Lineal ' });

      // El parámetro trimmeado debe ser '%Álgebra Lineal%'
      expect(mockQBHU17.andWhere).toHaveBeenCalledWith(
        '(LOWER(offer.title) LIKE LOWER(:searchTerm) OR LOWER(tutor.nombreCompleto) LIKE LOWER(:searchTerm))',
        { searchTerm: '%Álgebra Lineal%' },
      );
    });
  });

  describe('Scenario 6: Búsqueda sin searchTerm (undefined/null)', () => {
    it('should NOT apply andWhere when searchTerm is undefined and return all offers', async () => {
      const allOfertas = mockOfertasEntity as Oferta[];
      mockQBHU17.getManyAndCount.mockResolvedValue([allOfertas, 3]);

      const result = await service.searchOffers({});

      // Sin searchTerm no debe aplicar ningún filtro andWhere
      expect(mockQBHU17.andWhere).not.toHaveBeenCalled();
      // Ordenamiento por defecto: createdAt DESC
      expect(mockQBHU17.orderBy).toHaveBeenCalledWith(
        'offer.createdAt',
        'DESC',
      );
      expect(result.totalResults).toBe(3);
      expect(result.offers).toHaveLength(3);
    });
  });

  describe('Scenario 7: searchTerm vacío (empty string)', () => {
    it('should NOT apply andWhere when searchTerm is an empty string', async () => {
      const allOfertas = mockOfertasEntity as Oferta[];
      mockQBHU17.getManyAndCount.mockResolvedValue([allOfertas, 3]);

      await service.searchOffers({ searchTerm: '' });

      expect(mockQBHU17.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 8: searchTerm con solo espacios', () => {
    it('should NOT apply andWhere when searchTerm is only whitespace ("   ")', async () => {
      const allOfertas = mockOfertasEntity as Oferta[];
      mockQBHU17.getManyAndCount.mockResolvedValue([allOfertas, 3]);

      await service.searchOffers({ searchTerm: '   ' });

      // trim() da '' → no debe aplicar filtro
      expect(mockQBHU17.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 9: Búsqueda sin coincidencias', () => {
    it('should return empty offers array with totalResults=0 and totalPages=0 when no matches', async () => {
      mockQBHU17.getManyAndCount.mockResolvedValue([[], 0]);

      const result: PaginatedOffersResponse = await service.searchOffers({
        searchTerm: 'Astronomía',
      });

      expect(result.offers).toEqual([]);
      expect(result.totalResults).toBe(0);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('Scenario 10: Paginación correcta (page=2, limit=5, 15 resultados)', () => {
    it('should calculate skip=5, take=5 and return correct pagination metadata', async () => {
      const page2Ofertas = mockOfertasEntity.slice(0, 3) as Oferta[];
      mockQBHU17.getManyAndCount.mockResolvedValue([page2Ofertas, 15]);

      const queryParams: OffersQueryParams = { page: 2, limit: 5 };
      const result = await service.searchOffers(queryParams);

      // Verifica skip = (2-1)*5 = 5
      expect(mockQBHU17.skip).toHaveBeenCalledWith(5);
      expect(mockQBHU17.take).toHaveBeenCalledWith(5);

      // Verifica metadatos de paginación
      expect(result.currentPage).toBe(2);
      expect(result.itemsPerPage).toBe(5);
      expect(result.totalResults).toBe(15);
      expect(result.totalPages).toBe(3); // Math.ceil(15/5) = 3
    });
  });

  describe('Scenario 11: Paginación que excede el total de páginas', () => {
    it('should return empty offers with totalResults=13 and totalPages=2 when page=5 exceeds available pages', async () => {
      mockQBHU17.getManyAndCount.mockResolvedValue([[], 13]);

      const result = await service.searchOffers({ page: 5, limit: 10 });

      expect(result.offers).toEqual([]);
      expect(result.totalResults).toBe(13);
      expect(result.currentPage).toBe(5);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalPages).toBe(2); // Math.ceil(13/10) = 2
    });
  });

  describe('Scenario 12: Manejo de InternalServerErrorException', () => {
    it('should throw InternalServerErrorException with agreed message when DB throws', async () => {
      mockQBHU17.getManyAndCount.mockRejectedValue(
        new Error('DB connection lost'),
      );

      await expect(service.searchOffers({})).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.searchOffers({})).rejects.toThrow(
        'Error al consultar las ofertas de tutoría.',
      );
    });
  });
});

// =============================================================================
// HU27: OfertasService.findFilteredOfertas — Filtrado por rango de precio
//
// FASE ROJA del TDD: Estos tests FALLARÁN inicialmente porque:
// 1. El método findFilteredOfertas no existe en OfertasService.
// 2. El repositorio ofertaRepository no tiene findAndCount configurado con
//    las condiciones Between / MoreThanOrEqual / LessThanOrEqual sobre 'precio'.
// 3. El mapeo de entidad → respuesta con nombres en español no está implementado.
// =============================================================================

describe('OfertasService - findFilteredOfertas (Unit Tests) - HU27', () => {
  let service: OfertasService;

  // Mock del Repository<Oferta> con findAndCount
  const mockHU27Repository = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  // -------------------------------------------------------------------------
  // Datos de entidad mock — incluyen los campos nuevos requeridos por HU27
  // -------------------------------------------------------------------------
  const mockTutorEntity = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Ana García',
    photoUrl: 'https://example.com/fotos/ana-garcia.jpg',
    email: 'ana.garcia@example.com',
    bio: null,
    ofertas: [],
  } as unknown as Tutor;

  const mockOfertaEntity1 = {
    id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    titulo: 'Cálculo Diferencial e Integral',
    carrera: 'Ingeniería de Sistemas',
    modalidad: 'Presencial',
    descripcion: 'Clases especializadas en límites, derivadas e integrales.',
    lugarReunion: 'Campus Central',
    precio: 15.0,
    imagenRepresentativaUrl: 'https://example.com/imagenes/calculo.jpg',
    tutorId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    tutor: mockTutorEntity,
    createdAt: new Date('2024-03-15T10:00:00.000Z'),
    updatedAt: new Date('2024-03-15T10:00:00.000Z'),
  } as unknown as Oferta;

  const mockOfertaEntity2 = {
    id: 'b2c3d4e5-f6a7-8901-2345-678901bcdef0',
    titulo: 'Álgebra Lineal',
    carrera: 'Matemáticas',
    modalidad: 'Virtual',
    descripcion: 'Matrices, vectores y transformaciones lineales.',
    lugarReunion: null,
    precio: 12.5,
    imagenRepresentativaUrl: null,
    tutorId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    tutor: mockTutorEntity,
    createdAt: new Date('2024-03-16T09:00:00.000Z'),
    updatedAt: new Date('2024-03-16T09:00:00.000Z'),
  } as unknown as Oferta;

  const mockOfertaEntity3 = {
    id: 'c3d4e5f6-a7b8-9012-3456-789012cdef01',
    titulo: 'Programación Orientada a Objetos',
    carrera: 'Ingeniería de Software',
    modalidad: 'Híbrida',
    descripcion: 'Fundamentos de POO con Java y patrones de diseño.',
    lugarReunion: 'Biblioteca Central',
    precio: 20.0,
    imagenRepresentativaUrl: null,
    tutorId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    tutor: mockTutorEntity,
    createdAt: new Date('2024-03-17T08:30:00.000Z'),
    updatedAt: new Date('2024-03-17T08:30:00.000Z'),
  } as unknown as Oferta;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfertasService,
        {
          provide: getRepositoryToken(Oferta),
          useValue: mockHU27Repository,
        },
        {
          provide: getRepositoryToken(AvailabilityEntity),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<OfertasService>(OfertasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Escenario 1: Sin parámetros — devuelve todas las ofertas
  // -------------------------------------------------------------------------
  describe('Escenario 1: findFilteredOfertas() sin parámetros de filtro', () => {
    it('debería llamar findAndCount con { where: {}, relations: ["tutor"] } y devolver { ofertas, total }', async () => {
      const allEntities = [
        mockOfertaEntity1,
        mockOfertaEntity2,
        mockOfertaEntity3,
      ];
      mockHU27Repository.findAndCount.mockResolvedValueOnce([allEntities, 3]);

      const result = await service.findFilteredOfertas({});

      // Verifica la llamada al repositorio
      expect(mockHU27Repository.findAndCount).toHaveBeenCalledWith({
        where: {},
        relations: ['tutor'],
      });

      // Verifica la estructura de respuesta
      expect(result).toHaveProperty('ofertas');
      expect(result).toHaveProperty('total');
      expect(result.total).toBe(3);
      expect(result.ofertas.length).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // Escenario 2: Solo minPrice — filtra precio >= minPrice
  // -------------------------------------------------------------------------
  describe('Escenario 2: findFilteredOfertas({ minPrice: 10 })', () => {
    it('debería llamar findAndCount con where: { precio: MoreThanOrEqual(10) } y devolver los resultados correctos', async () => {
      const filteredEntities = [
        mockOfertaEntity1,
        mockOfertaEntity2,
        mockOfertaEntity3,
      ];
      mockHU27Repository.findAndCount.mockResolvedValueOnce([
        filteredEntities,
        3,
      ]);

      const result = await service.findFilteredOfertas({ minPrice: 10 });

      expect(mockHU27Repository.findAndCount).toHaveBeenCalledWith({
        where: { price: MoreThanOrEqual(10) },
        relations: ['tutor'],
      });
      expect(result.total).toBe(3);
      expect(result.ofertas.length).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // Escenario 3: Solo maxPrice — filtra precio <= maxPrice
  // -------------------------------------------------------------------------
  describe('Escenario 3: findFilteredOfertas({ maxPrice: 20 })', () => {
    it('debería llamar findAndCount con where: { precio: LessThanOrEqual(20) } y devolver los resultados correctos', async () => {
      const filteredEntities = [mockOfertaEntity1, mockOfertaEntity2];
      mockHU27Repository.findAndCount.mockResolvedValueOnce([
        filteredEntities,
        2,
      ]);

      const result = await service.findFilteredOfertas({ maxPrice: 20 });

      expect(mockHU27Repository.findAndCount).toHaveBeenCalledWith({
        where: { price: LessThanOrEqual(20) },
        relations: ['tutor'],
      });
      expect(result.total).toBe(2);
      expect(result.ofertas.length).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Escenario 4: Rango completo — filtra minPrice <= precio <= maxPrice
  // -------------------------------------------------------------------------
  describe('Escenario 4: findFilteredOfertas({ minPrice: 10, maxPrice: 20 })', () => {
    it('debería llamar findAndCount con where: { precio: Between(10, 20) } y devolver los resultados correctos', async () => {
      const filteredEntities = [mockOfertaEntity1, mockOfertaEntity2];
      mockHU27Repository.findAndCount.mockResolvedValueOnce([
        filteredEntities,
        2,
      ]);

      const result = await service.findFilteredOfertas({
        minPrice: 10,
        maxPrice: 20,
      });

      expect(mockHU27Repository.findAndCount).toHaveBeenCalledWith({
        where: { price: Between(10, 20) },
        relations: ['tutor'],
      });
      expect(result.total).toBe(2);
      expect(result.ofertas.length).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Escenario 5: Sin resultados — devuelve array vacío y total 0
  // -------------------------------------------------------------------------
  describe('Escenario 5: El repositorio no encuentra ofertas en el rango', () => {
    it('debería devolver { ofertas: [], total: 0 }', async () => {
      mockHU27Repository.findAndCount.mockResolvedValueOnce([[], 0]);

      const result = await service.findFilteredOfertas({
        minPrice: 100,
        maxPrice: 200,
      });

      expect(result.ofertas).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Escenario 6: El repositorio lanza un error — debe propagar InternalServerErrorException
  // -------------------------------------------------------------------------
  describe('Escenario 6: El repositorio lanza un error inesperado', () => {
    it('debería lanzar InternalServerErrorException con mensaje "Error interno al filtrar ofertas." y registrar el error', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockHU27Repository.findAndCount.mockRejectedValueOnce(
        new Error('DB connection lost'),
      );

      await expect(service.findFilteredOfertas({})).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.findFilteredOfertas({})).rejects.toThrow(
        'Error interno al filtrar ofertas.',
      );

      // Verifica que se registró el error en consola
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

// =============================================================================
// HU26: OfertasService.getFilteredOfertas — Filtrado por modalidad
//
// FASE ROJA del TDD: Estos tests FALLARÁN inicialmente porque:
// 1. El método `getFilteredOfertas` aún no existe en OfertasService.
// 2. La entidad `Oferta` usa campos en inglés (title, price, modality, createdAt)
//    pero el contrato de HU26 requiere campos en español (titulo, precioHora,
//    modalidad, fechaCreacion) y un enum PRESENCIAL/VIRTUAL/VIRTUAL/PRESENCIAL.
// 3. El repositorio no tiene configurada la cláusula WHERE con `In([...])` sobre
//    el campo `modalidad`.
// 4. El mapeo de `tutor.calificacionPromedio` y `tutor.numResenas` a la raíz
//    del OfertaDto todavía no existe (Riesgo 1 del análisis).
// 5. El orden por `fechaCreacion DESC` no está implementado para este nuevo método.
//
// Entidad OfertaEntity esperada (nueva estructura HU26 en español):
//   - id: string (UUID)
//   - titulo: string
//   - descripcion: string | null
//   - modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'VIRTUAL/PRESENCIAL'  (OfferModality enum)
//   - precioHora: number (decimal)
//   - areaConocimiento: string | null
//   - nivel: string | null
//   - tutor: TutorEntity { id, nombre, fotoUrl, calificacionPromedio, numResenas }
//   - fechaCreacion: Date  (CreateDateColumn)
//
// OfertaDto de respuesta esperado (raíz del objeto):
//   { id, titulo, descripcion, modalidad, precioHora, areaConocimiento, nivel,
//     tutor: { id, nombre, fotoUrl },
//     calificacionPromedio, numResenas, fechaCreacion: string ISO 8601 }
//
// OfertasListResponseDto:
//   { data: OfertaDto[], total: number }
// =============================================================================

// Tipos locales que documentan la estructura FUTURA de las entidades en HU26.
// Estos NO importan de producción para que el test compile aunque la entidad
// aún tenga campos en inglés.
interface MockTutorHU26 {
  id: string;
  nombre: string;
  fotoUrl: string | null;
  calificacionPromedio: number;
  numResenas: number;
}

interface MockOfertaEntityHU26 {
  id: string;
  titulo: string;
  descripcion: string | null;
  modalidad: string; // 'PRESENCIAL' | 'VIRTUAL' | 'VIRTUAL/PRESENCIAL'
  precioHora: number;
  areaConocimiento: string | null;
  nivel: string | null;
  tutor: MockTutorHU26;
  fechaCreacion: Date;
}

describe('OfertasService - getFilteredOfertas (Unit Tests) - HU26', () => {
  let service: OfertasService;

  // ─── Tutores mock (estructura nueva TutorEntity) ──────────────────────────
  const mockTutorHU26A: MockTutorHU26 = {
    id: 'tutor-hu26-0001-4000-8000-000000000001',
    nombre: 'Ana Martínez',
    fotoUrl: 'https://example.com/fotos/ana.jpg',
    calificacionPromedio: 4.7,
    numResenas: 45,
  };

  const mockTutorHU26B: MockTutorHU26 = {
    id: 'tutor-hu26-0002-4000-8000-000000000002',
    nombre: 'Luis Torres',
    fotoUrl: null,
    calificacionPromedio: 4.2,
    numResenas: 30,
  };

  const mockTutorHU26C: MockTutorHU26 = {
    id: 'tutor-hu26-0003-4000-8000-000000000003',
    nombre: 'Sofía Ramírez',
    fotoUrl: 'https://example.com/fotos/sofia.jpg',
    calificacionPromedio: 4.9,
    numResenas: 88,
  };

  // ─── Entidades mock (estructura nueva OfertaEntity) ──────────────────────
  // fechaCreacion con distintas fechas para verificar ordenamiento DESC
  const mockOfertaPresencialEntity: MockOfertaEntityHU26 = {
    id: 'oferta-hu26-0001-4000-8000-000000000001',
    titulo: 'Cálculo Diferencial Presencial',
    descripcion: 'Clases presenciales de cálculo.',
    modalidad: 'PRESENCIAL',
    precioHora: 18.5,
    areaConocimiento: 'Matemáticas',
    nivel: 'Universitario',
    tutor: mockTutorHU26A,
    fechaCreacion: new Date('2024-03-10T10:00:00.000Z'),
  };

  const mockOfertaVirtualEntity: MockOfertaEntityHU26 = {
    id: 'oferta-hu26-0002-4000-8000-000000000002',
    titulo: 'Álgebra Lineal Virtual',
    descripcion: 'Tutorías online de álgebra lineal.',
    modalidad: 'VIRTUAL',
    precioHora: 15.0,
    areaConocimiento: 'Matemáticas',
    nivel: 'Universitario',
    tutor: mockTutorHU26B,
    fechaCreacion: new Date('2024-03-09T08:00:00.000Z'),
  };

  const mockOfertaAmbosEntity: MockOfertaEntityHU26 = {
    id: 'oferta-hu26-0003-4000-8000-000000000003',
    titulo: 'Física General (cualquier modalidad)',
    descripcion: null,
    modalidad: 'VIRTUAL/PRESENCIAL',
    precioHora: 20.0,
    areaConocimiento: 'Física',
    nivel: null,
    tutor: mockTutorHU26C,
    fechaCreacion: new Date('2024-03-08T06:00:00.000Z'),
  };

  // ─── Mock del repositorio ─────────────────────────────────────────────────
  // Se usa findAndCount (no find) para obtener lista + conteo en una sola query.
  const mockHU26Repository = {
    findAndCount: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfertasService,
        {
          provide: getRepositoryToken(Oferta),
          useValue: mockHU26Repository,
        },
        {
          provide: getRepositoryToken(AvailabilityEntity),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<OfertasService>(OfertasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── Escenario 1: Filtrar PRESENCIAL (frontend envía solo PRESENCIAL) ─────
  /**
   * GIVEN: Repositorio con entidades PRESENCIAL, VIRTUAL y VIRTUAL/PRESENCIAL.
   * WHEN:  getFilteredOfertas({ modalidad: ['PRESENCIAL'] })
   * THEN:  findAndCount se llama con where: { modalidad: In(['PRESENCIAL','VIRTUAL/PRESENCIAL']) }
   *        (expansión automática) y order: { fechaCreacion: 'DESC' }.
   */
  describe('Escenario 1: filtro modalidad=["PRESENCIAL"] → expande a PRESENCIAL+VIRTUAL/PRESENCIAL', () => {
    it('debe expandir PRESENCIAL e incluir VIRTUAL/PRESENCIAL en la query', async () => {
      const entidadesFiltradas = [
        mockOfertaPresencialEntity,
        mockOfertaAmbosEntity,
      ];
      mockHU26Repository.findAndCount.mockResolvedValueOnce([
        entidadesFiltradas,
        2,
      ]);

      const result = await (
        service as unknown as Record<string, unknown> & {
          getFilteredOfertas: (dto: unknown) => Promise<unknown>;
        }
      ).getFilteredOfertas({ modalidad: ['PRESENCIAL'] });

      // El use case debe haber expandido PRESENCIAL → PRESENCIAL + VIRTUAL/PRESENCIAL
      expect(mockHU26Repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            titulo: Not(IsNull()),
            modalidad: In(['PRESENCIAL', 'VIRTUAL/PRESENCIAL']),
          },
          order: { fechaCreacion: 'DESC' },
        }),
      );

      // Verifica que la respuesta usa la clave `data` (no `ofertas`)
      const typedResult = result as { data: unknown[]; total: number };
      expect(typedResult).toHaveProperty('data');
      expect(typedResult).toHaveProperty('total', 2);
      expect(typedResult.data).toHaveLength(2);
    });
  });

  // ── Escenario 2: Filtrar VIRTUAL (frontend envía solo VIRTUAL) ───────────
  /**
   * GIVEN: Repositorio con entidades PRESENCIAL, VIRTUAL y VIRTUAL/PRESENCIAL.
   * WHEN:  getFilteredOfertas({ modalidad: ['VIRTUAL'] })
   * THEN:  findAndCount se llama con where: { modalidad: In(['VIRTUAL','VIRTUAL/PRESENCIAL']) }
   *        (expansión automática) y order: { fechaCreacion: 'DESC' }.
   */
  describe('Escenario 2: filtro modalidad=["VIRTUAL"] → expande a VIRTUAL+VIRTUAL/PRESENCIAL', () => {
    it('debe expandir VIRTUAL e incluir VIRTUAL/PRESENCIAL en la query', async () => {
      const entidadesFiltradas = [
        mockOfertaVirtualEntity,
        mockOfertaAmbosEntity,
      ];
      mockHU26Repository.findAndCount.mockResolvedValueOnce([
        entidadesFiltradas,
        2,
      ]);

      const result = await (
        service as unknown as Record<string, unknown> & {
          getFilteredOfertas: (dto: unknown) => Promise<unknown>;
        }
      ).getFilteredOfertas({ modalidad: ['VIRTUAL'] });

      // El use case debe haber expandido VIRTUAL → VIRTUAL + VIRTUAL/PRESENCIAL
      expect(mockHU26Repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { titulo: Not(IsNull()), modalidad: In(['VIRTUAL', 'VIRTUAL/PRESENCIAL']) },
          order: { fechaCreacion: 'DESC' },
        }),
      );

      const typedResult = result as { data: unknown[]; total: number };
      expect(typedResult).toHaveProperty('data');
      expect(typedResult).toHaveProperty('total', 2);
      expect(typedResult.data).toHaveLength(2);
    });
  });

  // ── Escenario 3: Filtrar VIRTUAL/PRESENCIAL únicamente ────────────────────
  /**
   * GIVEN: Repositorio con entidades de todas las modalidades.
   * WHEN:  getFilteredOfertas({ modalidad: ['VIRTUAL/PRESENCIAL'] })
   * THEN:  findAndCount se llama con where: { modalidad: In(['VIRTUAL/PRESENCIAL']) }
   *        y order: { fechaCreacion: 'DESC' }.
   */
  describe('Escenario 3: filtro modalidad=["VIRTUAL/PRESENCIAL"]', () => {
    it('debe llamar al repositorio con In(["VIRTUAL/PRESENCIAL"]) y retornar solo entidades VIRTUAL/PRESENCIAL', async () => {
      mockHU26Repository.findAndCount.mockResolvedValueOnce([
        [mockOfertaAmbosEntity],
        1,
      ]);

      const result = await (
        service as unknown as Record<string, unknown> & {
          getFilteredOfertas: (dto: unknown) => Promise<unknown>;
        }
      ).getFilteredOfertas({ modalidad: ['VIRTUAL/PRESENCIAL'] });

      expect(mockHU26Repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { titulo: Not(IsNull()), modalidad: In(['VIRTUAL/PRESENCIAL']) },
          order: { fechaCreacion: 'DESC' },
        }),
      );

      const typedResult = result as { data: unknown[]; total: number };
      expect(typedResult.total).toBe(1);
      expect(typedResult.data).toHaveLength(1);
    });
  });

  // ── Escenario 4: Sin filtro de modalidad (todas las ofertas) ──────────────
  /**
   * GIVEN: Repositorio con entidades de todas las modalidades.
   * WHEN:  getFilteredOfertas({}) o getFilteredOfertas({ modalidad: undefined })
   * THEN:  findAndCount se llama con where:{} vacío (sin condición de modalidad)
   *        y order: { fechaCreacion: 'DESC' }.
   *
   * Verifica que modalidad=undefined NO añade una cláusula WHERE.
   */
  describe('Escenario 4: Sin filtro de modalidad (modalidad undefined / ausente)', () => {
    it('debe llamar al repositorio sin cláusula WHERE de modalidad y retornar todas', async () => {
      const todasLasEntidades = [
        mockOfertaPresencialEntity,
        mockOfertaVirtualEntity,
        mockOfertaAmbosEntity,
      ];
      mockHU26Repository.findAndCount.mockResolvedValueOnce([
        todasLasEntidades,
        3,
      ]);

      const result = await (
        service as unknown as Record<string, unknown> & {
          getFilteredOfertas: (dto: unknown) => Promise<unknown>;
        }
      ).getFilteredOfertas({});

      // WHERE debe tener solo titulo IS NOT NULL: sin restricción de modalidad
      expect(mockHU26Repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { titulo: Not(IsNull()) },
          order: { fechaCreacion: 'DESC' },
        }),
      );

      // La condición WHERE NO debe contener ninguna clave `modalidad`
      const firstCall = mockHU26Repository.findAndCount.mock
        .calls[0] as unknown[];
      const callArgs = firstCall[0] as Record<string, unknown>;
      const whereClause = callArgs.where as Record<string, unknown>;
      expect(whereClause).not.toHaveProperty('modalidad');

      const typedResult = result as { data: unknown[]; total: number };
      expect(typedResult.total).toBe(3);
      expect(typedResult.data).toHaveLength(3);
    });

    it('debe comportarse igual cuando modalidad es un array vacío', async () => {
      mockHU26Repository.findAndCount.mockResolvedValueOnce([
        [mockOfertaPresencialEntity, mockOfertaVirtualEntity],
        2,
      ]);

      await (
        service as unknown as Record<string, unknown> & {
          getFilteredOfertas: (dto: unknown) => Promise<unknown>;
        }
      ).getFilteredOfertas({ modalidad: [] });

      expect(mockHU26Repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { titulo: Not(IsNull()) },
          order: { fechaCreacion: 'DESC' },
        }),
      );
    });
  });

  // ── Escenario 5: Mapeo correcto de OfertaDto (Riesgos 1 y 2) ─────────────
  /**
   * GIVEN: Repositorio retorna una entidad completa con tutor anidado.
   * WHEN:  getFilteredOfertas({ modalidad: ['PRESENCIAL', 'VIRTUAL/PRESENCIAL'] })
   * THEN:  El DTO resultante tiene:
   *        - calificacionPromedio en la RAÍZ (no en tutor) — Riesgo 1
   *        - numResenas en la RAÍZ (no en tutor) — Riesgo 1
   *        - fechaCreacion como string ISO 8601 (no Date) — Riesgo 2
   *        - tutor con id, nombre, fotoUrl
   */
  describe('Escenario 5: Mapeo OfertaDto — calificacionPromedio, numResenas y fechaCreacion', () => {
    it('debe aplanar calificacionPromedio y numResenas del tutor a la raíz del OfertaDto (Riesgo 1)', async () => {
      mockHU26Repository.findAndCount.mockResolvedValueOnce([
        [mockOfertaPresencialEntity],
        1,
      ]);

      const result = await (
        service as unknown as Record<string, unknown> & {
          getFilteredOfertas: (dto: unknown) => Promise<unknown>;
        }
      ).getFilteredOfertas({ modalidad: ['PRESENCIAL', 'VIRTUAL/PRESENCIAL'] });

      const typedResult = result as {
        data: Array<Record<string, unknown>>;
        total: number;
      };
      const ofertaDto = typedResult.data[0];

      // RIESGO 1: calificacionPromedio debe estar en la RAÍZ del objeto oferta
      expect(ofertaDto).toHaveProperty(
        'calificacionPromedio',
        mockTutorHU26A.calificacionPromedio,
      );
      expect(ofertaDto).toHaveProperty('numResenas', mockTutorHU26A.numResenas);

      // El tutor anidado solo debe tener id, nombre, fotoUrl (no las calificaciones)
      const tutor = ofertaDto.tutor as Record<string, unknown>;
      expect(tutor).toHaveProperty('id', mockTutorHU26A.id);
      expect(tutor).toHaveProperty('nombre', mockTutorHU26A.nombre);
      expect(tutor).toHaveProperty('fotoUrl', mockTutorHU26A.fotoUrl);
      expect(tutor).not.toHaveProperty('calificacionPromedio');
      expect(tutor).not.toHaveProperty('numResenas');
    });

    it('debe retornar fechaCreacion como string ISO 8601 (no como Date) (Riesgo 2)', async () => {
      mockHU26Repository.findAndCount.mockResolvedValueOnce([
        [mockOfertaPresencialEntity],
        1,
      ]);

      const result = await (
        service as unknown as Record<string, unknown> & {
          getFilteredOfertas: (dto: unknown) => Promise<unknown>;
        }
      ).getFilteredOfertas({ modalidad: ['PRESENCIAL', 'VIRTUAL/PRESENCIAL'] });

      const typedResult = result as {
        data: Array<Record<string, unknown>>;
        total: number;
      };
      const ofertaDto = typedResult.data[0];

      // RIESGO 2: fechaCreacion debe ser string ISO 8601
      expect(ofertaDto).toHaveProperty('fechaCreacion');
      expect(typeof ofertaDto.fechaCreacion).toBe('string');
      expect(ofertaDto.fechaCreacion as string).toBe(
        mockOfertaPresencialEntity.fechaCreacion.toISOString(),
      );
      expect(ofertaDto.fechaCreacion as string).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
      );
    });
  });

  // ── Escenario 6: Sin resultados ───────────────────────────────────────────
  /**
   * GIVEN: Repositorio retorna [[], 0] para cualquier filtro.
   * WHEN:  getFilteredOfertas({ modalidad: ['PRESENCIAL', 'VIRTUAL/PRESENCIAL'] })
   * THEN:  El servicio retorna { data: [], total: 0 }.
   *
   * RIESGO 6: total debe ser exactamente 0.
   */
  describe('Escenario 6: Sin ofertas que coincidan', () => {
    it('debe retornar { data: [], total: 0 } cuando el repositorio no encuentra resultados', async () => {
      mockHU26Repository.findAndCount.mockResolvedValueOnce([[], 0]);

      const result = await (
        service as unknown as Record<string, unknown> & {
          getFilteredOfertas: (dto: unknown) => Promise<unknown>;
        }
      ).getFilteredOfertas({ modalidad: ['PRESENCIAL', 'VIRTUAL/PRESENCIAL'] });

      const typedResult = result as { data: unknown[]; total: number };
      expect(typedResult).toEqual({ data: [], total: 0 });
      expect(typedResult.data).toHaveLength(0);
      expect(typedResult.total).toBe(0);
    });
  });

  // ── Escenario 7: Error interno del repositorio ────────────────────────────
  /**
   * GIVEN: findAndCount lanza un Error genérico.
   * WHEN:  getFilteredOfertas({ modalidad: ['VIRTUAL'] })
   * THEN:  El servicio captura el error y lanza InternalServerErrorException
   *        con el mensaje exacto del contrato: "Error interno al filtrar ofertas."
   *        Y registra el error en console.error.
   */
  describe('Escenario 7: El repositorio lanza un error interno', () => {
    it('debe capturar el error y lanzar InternalServerErrorException con el mensaje del contrato', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockHU26Repository.findAndCount.mockRejectedValueOnce(
        new Error('DB connection lost'),
      );

      await expect(
        (
          service as unknown as Record<string, unknown> & {
            getFilteredOfertas: (dto: unknown) => Promise<unknown>;
          }
        ).getFilteredOfertas({ modalidad: ['VIRTUAL'] }),
      ).rejects.toThrow(InternalServerErrorException);

      mockHU26Repository.findAndCount.mockRejectedValueOnce(
        new Error('DB connection lost'),
      );

      await expect(
        (
          service as unknown as Record<string, unknown> & {
            getFilteredOfertas: (dto: unknown) => Promise<unknown>;
          }
        ).getFilteredOfertas({ modalidad: ['VIRTUAL'] }),
      ).rejects.toThrow('Error interno al filtrar ofertas.');

      // Verifica que el error fue registrado en consola
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
