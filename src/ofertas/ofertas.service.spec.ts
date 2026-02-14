import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfertasService } from './ofertas.service';
import { Oferta } from './domain/entities/oferta.entity';

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
      ],
    }).compile();

    service = module.get<OfertasService>(OfertasService);
    repository = module.get<Repository<Oferta>>(getRepositoryToken(Oferta));
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
