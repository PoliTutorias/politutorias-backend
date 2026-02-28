/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OffersService } from './offers.service';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { OfferQueryDto } from './dto/offer-query.dto';

/**
 * Unit Tests for OffersService - HU03
 *
 * Fase ROJA TDD: estos tests fallarán hasta que existan:
 *   - OffersService en src/offers/offers.service.ts (con método findAll)
 *   - OfferQueryDto en src/offers/dto/offer-query.dto.ts
 *   - Interfaz PaginatedOffersResponse en src/offers/interfaces/paginated-offers-response.interface.ts
 */

describe('OffersService', () => {
  let service: OffersService;
  let ofertaRepository: Repository<Oferta>;

  // ─── Mock Tutor ───────────────────────────────────────────────────────────
  const mockTutor = {
    id: 'uuid-tutor-juan',
    nombreCompleto: 'Juan Pérez',
    ofertas: [],
  } as unknown as Tutor;

  // ─── Mock Ofertas (13 entidades de BD) ───────────────────────────────────
  const mockOfertasEntity: Oferta[] = [
    {
      id: 'uuid-oferta-1',
      title: 'Cálculo Vectorial',
      price: 10.0,
      modality: 'Virtual/Presencial',
      categories: ['Matemática', 'Formación Básica', 'Cálculo'],
      description:
        'Clases personalizadas de cálculo vectorial para estudiantes universitarios.',
      rating: 4.8,
      reviewsCount: 15,
      tutorId: mockTutor.id,
      tutor: mockTutor,
      createdAt: new Date('2023-10-27T10:30:00.000Z'),
      updatedAt: new Date('2023-10-27T10:30:00.000Z'),
    } as Oferta,
    {
      id: 'uuid-oferta-2',
      title: 'Álgebra Lineal Avanzada',
      price: 12.5,
      modality: 'Virtual',
      categories: ['Matemática', 'Ingeniería'],
      description:
        'Tutorías intensivas en álgebra lineal para niveles avanzados.',
      rating: 4.5,
      reviewsCount: 10,
      tutorId: 'uuid-tutor-maria',
      tutor: {
        ...mockTutor,
        id: 'uuid-tutor-maria',
        name: 'María García',
        photoUrl: 'https://example.com/photos/maria_garcia.jpg',
        ofertas: [],
      },
      createdAt: new Date('2023-10-27T11:00:00.000Z'),
      updatedAt: new Date('2023-10-27T11:00:00.000Z'),
    } as Oferta,
    {
      id: 'uuid-oferta-3',
      title: 'Física Cuántica',
      price: 25.0,
      modality: 'Virtual',
      categories: ['Física', 'Avanzado'],
      description: 'Introducción a la mecánica cuántica.',
      rating: 4.9,
      reviewsCount: 20,
      tutorId: mockTutor.id,
      tutor: mockTutor,
      createdAt: new Date('2023-10-27T11:30:00.000Z'),
      updatedAt: new Date('2023-10-27T11:30:00.000Z'),
    } as Oferta,
    {
      id: 'uuid-oferta-4',
      title: 'Economía I',
      price: 15.0,
      modality: 'Presencial',
      categories: ['Economía'],
      description: 'Fundamentos de economía.',
      rating: 3.8,
      reviewsCount: 5,
      tutorId: 'uuid-tutor-pedro',
      tutor: {
        ...mockTutor,
        id: 'uuid-tutor-pedro',
        name: 'Pedro López',
        photoUrl: 'https://example.com/photos/pedro_lopez.jpg',
        ofertas: [],
      },
      createdAt: new Date('2023-10-27T12:00:00.000Z'),
      updatedAt: new Date('2023-10-27T12:00:00.000Z'),
    } as Oferta,
    {
      id: 'uuid-oferta-5',
      title: 'Literatura Clásica',
      price: 8.0,
      modality: 'Presencial',
      categories: ['Literatura'],
      description: 'desc',
      rating: 4.0,
      reviewsCount: 7,
      tutorId: 't5',
      tutor: {
        ...mockTutor,
        id: 't5',
        name: 'Laura',
        photoUrl: 'url',
        ofertas: [],
      },
      createdAt: new Date('2023-10-27T12:30:00.000Z'),
      updatedAt: new Date(),
    } as Oferta,
    {
      id: 'uuid-oferta-6',
      title: 'Historia Moderna',
      price: 9.0,
      modality: 'Virtual',
      categories: ['Historia'],
      description: 'desc',
      rating: 4.2,
      reviewsCount: 10,
      tutorId: 't6',
      tutor: {
        ...mockTutor,
        id: 't6',
        name: 'Carlos',
        photoUrl: 'url',
        ofertas: [],
      },
      createdAt: new Date('2023-10-27T13:00:00.000Z'),
      updatedAt: new Date(),
    } as Oferta,
    {
      id: 'uuid-oferta-7',
      title: 'Programación Web',
      price: 20.0,
      modality: 'Virtual/Presencial',
      categories: ['Programación'],
      description: 'desc',
      rating: 4.7,
      reviewsCount: 25,
      tutorId: 't7',
      tutor: {
        ...mockTutor,
        id: 't7',
        name: 'Ana',
        photoUrl: 'url',
        ofertas: [],
      },
      createdAt: new Date('2023-10-27T13:30:00.000Z'),
      updatedAt: new Date(),
    } as Oferta,
    {
      id: 'uuid-oferta-8',
      title: 'Diseño UX/UI',
      price: 18.0,
      modality: 'Virtual',
      categories: ['Diseño'],
      description: 'desc',
      rating: 4.5,
      reviewsCount: 12,
      tutorId: 't8',
      tutor: {
        ...mockTutor,
        id: 't8',
        name: 'Roberto',
        photoUrl: 'url',
        ofertas: [],
      },
      createdAt: new Date('2023-10-27T14:00:00.000Z'),
      updatedAt: new Date(),
    } as Oferta,
    {
      id: 'uuid-oferta-9',
      title: 'Matemáticas Discretas',
      price: 11.0,
      modality: 'Virtual',
      categories: ['Matemática', 'Informática'],
      description: 'desc',
      rating: 4.3,
      reviewsCount: 11,
      tutorId: 't9',
      tutor: {
        ...mockTutor,
        id: 't9',
        name: 'Sofia',
        photoUrl: 'url',
        ofertas: [],
      },
      createdAt: new Date('2023-10-27T14:30:00.000Z'),
      updatedAt: new Date(),
    } as Oferta,
    {
      id: 'uuid-oferta-10',
      title: 'Biología Celular',
      price: 14.0,
      modality: 'Presencial',
      categories: ['Biología'],
      description: 'desc',
      rating: 3.9,
      reviewsCount: 8,
      tutorId: 't10',
      tutor: {
        ...mockTutor,
        id: 't10',
        name: 'Daniela',
        photoUrl: 'url',
        ofertas: [],
      },
      createdAt: new Date('2023-10-27T15:00:00.000Z'),
      updatedAt: new Date(),
    } as Oferta,
    {
      id: 'uuid-oferta-11',
      title: 'Cálculo Avanzado',
      price: 16.0,
      modality: 'Virtual/Presencial',
      categories: ['Matemática'],
      description: 'desc',
      rating: 4.6,
      reviewsCount: 16,
      tutorId: 't11',
      tutor: {
        ...mockTutor,
        id: 't11',
        name: 'Fernando',
        photoUrl: 'url',
        ofertas: [],
      },
      createdAt: new Date('2023-10-27T15:30:00.000Z'),
      updatedAt: new Date(),
    } as Oferta,
    {
      id: 'uuid-oferta-12',
      title: 'Estadística para Data Science',
      price: 22.0,
      modality: 'Virtual',
      categories: ['Data Science', 'Estadística'],
      description: 'desc',
      rating: 4.9,
      reviewsCount: 30,
      tutorId: 't12',
      tutor: {
        ...mockTutor,
        id: 't12',
        name: 'Gabriela',
        photoUrl: 'url',
        ofertas: [],
      },
      createdAt: new Date('2023-10-27T16:00:00.000Z'),
      updatedAt: new Date(),
    } as Oferta,
    {
      id: 'uuid-oferta-13',
      title: 'Fundamentos de Marketing',
      price: 10.0,
      modality: 'Presencial',
      categories: ['Marketing'],
      description: 'desc',
      rating: 3.5,
      reviewsCount: 4,
      tutorId: 't13',
      tutor: {
        ...mockTutor,
        id: 't13',
        name: 'Javier',
        photoUrl: 'url',
        ofertas: [],
      },
      createdAt: new Date('2023-10-27T16:30:00.000Z'),
      updatedAt: new Date(),
    } as Oferta,
  ];

  // ─── Mock QueryBuilder (cadena fluida) ────────────────────────────────────
  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  // ─── Setup ────────────────────────────────────────────────────────────────
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersService,
        {
          provide: getRepositoryToken(Oferta),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<OffersService>(OffersService);
    ofertaRepository = module.get<Repository<Oferta>>(
      getRepositoryToken(Oferta),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Sanity ───────────────────────────────────────────────────────────────
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    // 1. Valores por defecto, paginación y mapeo correcto
    it('should return paginated offers with default parameters (page=1, limit=10) and correct mapping', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        mockOfertasEntity.slice(0, 10),
        mockOfertasEntity.length,
      ]);

      const result = await service.findAll({});

      // Verifica llamadas al QueryBuilder
      expect(ofertaRepository.createQueryBuilder).toHaveBeenCalledWith('offer');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'offer.tutor',
        'tutor',
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      // Sin sortBy explícito → ordena por createdAt DESC
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'offer.createdAt',
        'DESC',
      );

      // Verifica estructura de paginación
      expect(result.offers).toHaveLength(10);
      expect(result.totalResults).toBe(13);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalPages).toBe(2);

      // Verifica mapeo de la primera oferta
      expect(result.offers[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          price: expect.any(Number), // parseFloat → number, no Decimal
          modality: expect.any(String),
          description: expect.any(String),
          tags: expect.any(Array), // mapeado desde categories
          rating: expect.any(Number),
          reviewsCount: expect.any(Number),
          tutor: {
            id: expect.any(String),
            name: expect.any(String),
            photo: expect.any(String), // mapeado desde photoUrl
          },
          createdAt: expect.any(Date),
        }),
      );
      // categories → tags
      expect(result.offers[0].tags).toEqual(mockOfertasEntity[0].categories);
      // photoUrl → photo
      expect(result.offers[0].tutor?.photo).toEqual('');
    });

    // 2. Segunda página
    it('should return offers for the second page (page=2, limit=10)', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        mockOfertasEntity.slice(10, 13),
        mockOfertasEntity.length,
      ]);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10); // (2-1)*10
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.offers).toHaveLength(3);
      expect(result.currentPage).toBe(2);
      expect(result.totalResults).toBe(13);
    });

    // 3. Filtro por modalidad
    it('should filter offers by modality "Virtual"', async () => {
      const filteredOffers = mockOfertasEntity.filter((o) =>
        o.modality.includes('Virtual'),
      );
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        filteredOffers,
        filteredOffers.length,
      ]);

      const query: OfferQueryDto = { modality: 'Virtual' };
      const result = await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'offer.modality LIKE :modalityValue',
        { modalityValue: '%Virtual%' },
      );
      expect(result.offers.every((o) => o.modality.includes('Virtual'))).toBe(
        true,
      );
      expect(result.totalResults).toBe(filteredOffers.length);
    });

    // 4. Filtro por una sola área de conocimiento
    it('should filter offers by a single areaConocimiento "Matemática"', async () => {
      const filteredOffers = mockOfertasEntity.filter((o) =>
        o.categories.includes('Matemática'),
      );
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        filteredOffers,
        filteredOffers.length,
      ]);

      const query: OfferQueryDto = { areaConocimiento: ['Matemática'] };
      const result = await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'offer.categories && ARRAY[:...areaConocimiento]::text[]',
        { areaConocimiento: ['Matemática'] },
      );
      expect(result.offers.every((o) => o.tags.includes('Matemática'))).toBe(
        true,
      );
      expect(result.totalResults).toBe(filteredOffers.length);
    });

    // 5. Filtro por múltiples áreas de conocimiento (AND)
    it('should filter offers by multiple areasConocimiento "Matemática" AND "Física"', async () => {
      const filteredOffers = mockOfertasEntity.filter(
        (o) =>
          o.categories.includes('Matemática') &&
          o.categories.includes('Física'),
      );
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        filteredOffers,
        filteredOffers.length,
      ]);

      const query: OfferQueryDto = {
        areaConocimiento: ['Matemática', 'Física'],
      };
      const result = await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'offer.categories && ARRAY[:...areaConocimiento]::text[]',
        { areaConocimiento: ['Matemática', 'Física'] },
      );
      expect(
        result.offers.every(
          (o) => o.tags.includes('Matemática') && o.tags.includes('Física'),
        ),
      ).toBe(true);
      expect(result.totalResults).toBe(filteredOffers.length);
    });

    // 6. Filtro por rango de precios
    it('should filter offers by price range (minPrice=10, maxPrice=20)', async () => {
      const filteredOffers = mockOfertasEntity.filter(
        (o) => o.price >= 10 && o.price <= 20,
      );
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        filteredOffers,
        filteredOffers.length,
      ]);

      const query: OfferQueryDto = { minPrice: 10, maxPrice: 20 };
      const result = await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'offer.price >= :minPrice',
        { minPrice: 10 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'offer.price <= :maxPrice',
        { maxPrice: 20 },
      );
      expect(result.offers.every((o) => o.price >= 10 && o.price <= 20)).toBe(
        true,
      );
      expect(result.totalResults).toBe(filteredOffers.length);
    });

    // 7. Ordenamiento por precio ascendente
    it('should sort offers by price in ascending order (sortBy=price, sortOrder=asc)', async () => {
      const sortedOffers = [...mockOfertasEntity].sort(
        (a, b) => a.price - b.price,
      );
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        sortedOffers.slice(0, 10),
        mockOfertasEntity.length,
      ]);

      const query: OfferQueryDto = { sortBy: 'price', sortOrder: 'asc' };
      await service.findAll(query);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'offer.price',
        'ASC',
      );
    });

    // 8. Ordenamiento por rating descendente
    it('should sort offers by rating in descending order (sortBy=rating, sortOrder=desc)', async () => {
      const sortedOffers = [...mockOfertasEntity].sort(
        (a, b) => b.rating - a.rating,
      );
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        sortedOffers.slice(0, 10),
        mockOfertasEntity.length,
      ]);

      const query: OfferQueryDto = { sortBy: 'rating', sortOrder: 'desc' };
      await service.findAll(query);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'offer.rating',
        'DESC',
      );
    });

    // 9. Ordenamiento por fecha de creación (sortBy=date → DESC por defecto)
    it('should sort offers by createdAt descending when sortBy=date', async () => {
      const sortedOffers = [...mockOfertasEntity].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        sortedOffers.slice(0, 10),
        mockOfertasEntity.length,
      ]);

      const query: OfferQueryDto = { sortBy: 'date' };
      await service.findAll(query);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'offer.createdAt',
        'DESC',
      );
    });

    // 10. Error de BD → InternalServerErrorException
    it('should throw InternalServerErrorException when the database throws an error', async () => {
      mockQueryBuilder.getManyAndCount.mockRejectedValue(
        new Error('Database connection lost.'),
      );

      await expect(service.findAll({})).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
