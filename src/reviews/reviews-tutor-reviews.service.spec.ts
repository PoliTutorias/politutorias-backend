import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReviewEntity } from '../tutorias/entities/review.entity';
import { SolicitudEntity } from '../solicitudes/entities/solicitud.entity';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { UserEntity } from '../users/entities/user.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { TutoriasService } from '../tutorias/tutorias.service';
import { ReviewsService } from './reviews.service';
import { RatingFilter, ReviewSortBy } from './dto/get-tutor-reviews-query.dto';

describe('ReviewsService — getTutorReviews (HU-22)', () => {
  let service: ReviewsService;

  const tutorId = 'tutor-uuid-1';

  // ─── Mock QueryBuilder ──────────────────────────────────────────────────
  const createMockQb = () => {
    const qb: Record<string, jest.Mock> = {};
    qb.leftJoin = jest.fn().mockReturnValue(qb);
    qb.addSelect = jest.fn().mockReturnValue(qb);
    qb.where = jest.fn().mockReturnValue(qb);
    qb.andWhere = jest.fn().mockReturnValue(qb);
    qb.orderBy = jest.fn().mockReturnValue(qb);
    qb.addOrderBy = jest.fn().mockReturnValue(qb);
    qb.select = jest.fn().mockReturnValue(qb);
    qb.groupBy = jest.fn().mockReturnValue(qb);
    qb.skip = jest.fn().mockReturnValue(qb);
    qb.take = jest.fn().mockReturnValue(qb);
    qb.getCount = jest.fn().mockResolvedValue(0);
    qb.getMany = jest.fn().mockResolvedValue([]);
    qb.getRawOne = jest.fn().mockResolvedValue({ avg: null, count: '0' });
    qb.getRawMany = jest.fn().mockResolvedValue([]);
    return qb;
  };

  // ─── Repository Mocks ──────────────────────────────────────────────────
  let reviewQb: ReturnType<typeof createMockQb>;
  let userQb: ReturnType<typeof createMockQb>;
  let reviewRepositoryMock: {
    createQueryBuilder: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let tutorRepositoryMock: { findOne: jest.Mock };
  let userRepositoryMock: { createQueryBuilder: jest.Mock };
  let solicitudRepositoryMock: {
    count: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  const tutoriasServiceMock = {
    findOneForReview: jest.fn(),
    linkReviewToTutorial: jest.fn(),
  };

  beforeEach(async () => {
    reviewQb = createMockQb();
    userQb = createMockQb();

    reviewRepositoryMock = {
      createQueryBuilder: jest.fn().mockReturnValue(reviewQb),
      create: jest.fn(),
      save: jest.fn(),
    };
    tutorRepositoryMock = {
      findOne: jest.fn(),
    };
    userRepositoryMock = {
      createQueryBuilder: jest.fn().mockReturnValue(userQb),
    };

    const solicitudQb = createMockQb();
    solicitudQb.getRawMany.mockResolvedValue([]);
    solicitudRepositoryMock = {
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(solicitudQb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(ReviewEntity),
          useValue: reviewRepositoryMock,
        },
        {
          provide: getRepositoryToken(SolicitudEntity),
          useValue: solicitudRepositoryMock,
        },
        {
          provide: getRepositoryToken(Oferta),
          useValue: {},
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepositoryMock,
        },
        {
          provide: getRepositoryToken(Tutor),
          useValue: tutorRepositoryMock,
        },
        {
          provide: TutoriasService,
          useValue: tutoriasServiceMock,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Escenario: Tutor inexistente ──────────────────────────────────────
  it('getTutorReviews(): debe lanzar NotFoundException si el tutor no existe', async () => {
    tutorRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.getTutorReviews(tutorId, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // ─── Escenario: Tutor sin reseñas ─────────────────────────────────────
  it('getTutorReviews(): debe retornar resumen con 0 y arreglo vacío si el tutor no tiene reseñas', async () => {
    tutorRepositoryMock.findOne.mockResolvedValue({ id: tutorId });

    // summary: avg=null, count=0
    reviewQb.getRawOne.mockResolvedValue({ avg: null, count: '0' });
    reviewQb.getRawMany.mockResolvedValue([]);
    // paginated: count=0, reviews=[]
    reviewQb.getCount.mockResolvedValue(0);
    reviewQb.getMany.mockResolvedValue([]);

    const result = await service.getTutorReviews(tutorId, {});

    expect(result.summary.avgRating).toBe(0);
    expect(result.summary.totalReviews).toBe(0);
    expect(result.summary.starDistribution).toEqual({
      '5': 0,
      '4': 0,
      '3': 0,
      '2': 0,
      '1': 0,
    });
    expect(result.reviews).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(5);
  });

  // ─── Escenario: Resumen con datos ─────────────────────────────────────
  it('getTutorReviews(): debe calcular correctamente el promedio y distribución de estrellas', async () => {
    tutorRepositoryMock.findOne.mockResolvedValue({ id: tutorId });

    // El primer createQueryBuilder es para summary (AVG)
    // El segundo es para summary (distribution)
    // El tercero es para paginated query
    const summaryAvgQb = createMockQb();
    summaryAvgQb.getRawOne.mockResolvedValue({ avg: '4.6667', count: '3' });

    const summaryDistQb = createMockQb();
    summaryDistQb.getRawMany.mockResolvedValue([
      { rating: 5, count: '2' },
      { rating: 4, count: '1' },
    ]);

    const paginatedQb = createMockQb();
    paginatedQb.getCount.mockResolvedValue(3);
    paginatedQb.getMany.mockResolvedValue([
      {
        id: 'r1',
        estudianteId: 'student-1',
        tutorId,
        rating: 5,
        comment: 'Excelente',
        createdAt: new Date('2024-05-24T10:00:00Z'),
        solicitud: {
          id: 'sol-1',
          oferta: { titulo: 'Cálculo' },
        },
      },
    ]);

    // Override createQueryBuilder to return different QBs in sequence
    reviewRepositoryMock.createQueryBuilder
      .mockReturnValueOnce(summaryAvgQb)
      .mockReturnValueOnce(summaryDistQb)
      .mockReturnValueOnce(paginatedQb);

    userRepositoryMock.createQueryBuilder.mockReturnValue(userQb);
    userQb.getMany.mockResolvedValue([{ id: 'student-1', name: 'Juan Pérez' }]);

    const result = await service.getTutorReviews(tutorId, {
      page: 1,
      limit: 5,
    });

    expect(result.summary.avgRating).toBe(4.7);
    expect(result.summary.totalReviews).toBe(3);
    expect(result.summary.starDistribution['5']).toBe(67);
    expect(result.summary.starDistribution['4']).toBe(33);
    expect(result.summary.starDistribution['3']).toBe(0);

    expect(result.reviews).toHaveLength(1);
    expect(result.reviews[0].student.firstName).toBe('Juan');
    expect(result.reviews[0].student.lastName).toBe('P.');
    expect(result.reviews[0].stars).toBe(5);
    expect(result.reviews[0].tutoringSubject).toBe('Cálculo');
    expect(result.reviews[0].comment).toBe('Excelente');
    expect(result.total).toBe(3);
  });

  // ─── Escenario: Filtro por estrellas ──────────────────────────────────
  it('getTutorReviews(): debe aplicar filtro por rating cuando ratingFilter no es ALL', async () => {
    tutorRepositoryMock.findOne.mockResolvedValue({ id: tutorId });

    // summary QBs
    const summaryAvgQb = createMockQb();
    summaryAvgQb.getRawOne.mockResolvedValue({ avg: '3.0', count: '5' });
    const summaryDistQb = createMockQb();
    summaryDistQb.getRawMany.mockResolvedValue([
      { rating: 5, count: '1' },
      { rating: 3, count: '2' },
      { rating: 1, count: '2' },
    ]);

    const paginatedQb = createMockQb();
    paginatedQb.getCount.mockResolvedValue(2);
    paginatedQb.getMany.mockResolvedValue([]);

    reviewRepositoryMock.createQueryBuilder
      .mockReturnValueOnce(summaryAvgQb)
      .mockReturnValueOnce(summaryDistQb)
      .mockReturnValueOnce(paginatedQb);

    const result = await service.getTutorReviews(tutorId, {
      ratingFilter: RatingFilter.ONE,
    });

    // Verifica que se aplicó el filtro andWhere rating = 1
    expect(paginatedQb.andWhere).toHaveBeenCalledWith(
      'review.rating = :rating',
      { rating: 1 },
    );
    expect(result.total).toBe(2);
  });

  // ─── Escenario: Ordenamiento por rating ───────────────────────────────
  it('getTutorReviews(): debe ordenar por rating DESC cuando sortBy es rating', async () => {
    tutorRepositoryMock.findOne.mockResolvedValue({ id: tutorId });

    const summaryAvgQb = createMockQb();
    summaryAvgQb.getRawOne.mockResolvedValue({ avg: '4.0', count: '2' });
    const summaryDistQb = createMockQb();
    summaryDistQb.getRawMany.mockResolvedValue([]);

    const paginatedQb = createMockQb();
    paginatedQb.getCount.mockResolvedValue(0);
    paginatedQb.getMany.mockResolvedValue([]);

    reviewRepositoryMock.createQueryBuilder
      .mockReturnValueOnce(summaryAvgQb)
      .mockReturnValueOnce(summaryDistQb)
      .mockReturnValueOnce(paginatedQb);

    await service.getTutorReviews(tutorId, {
      sortBy: ReviewSortBy.RATING,
    });

    expect(paginatedQb.orderBy).toHaveBeenCalledWith('review.rating', 'DESC');
    expect(paginatedQb.addOrderBy).toHaveBeenCalledWith(
      'review.createdAt',
      'DESC',
    );
  });

  // ─── Escenario: Paginación ────────────────────────────────────────────
  it('getTutorReviews(): debe aplicar skip/take correctamente para paginación', async () => {
    tutorRepositoryMock.findOne.mockResolvedValue({ id: tutorId });

    const summaryAvgQb = createMockQb();
    summaryAvgQb.getRawOne.mockResolvedValue({ avg: '4.0', count: '10' });
    const summaryDistQb = createMockQb();
    summaryDistQb.getRawMany.mockResolvedValue([]);

    const paginatedQb = createMockQb();
    paginatedQb.getCount.mockResolvedValue(10);
    paginatedQb.getMany.mockResolvedValue([]);

    reviewRepositoryMock.createQueryBuilder
      .mockReturnValueOnce(summaryAvgQb)
      .mockReturnValueOnce(summaryDistQb)
      .mockReturnValueOnce(paginatedQb);

    await service.getTutorReviews(tutorId, { page: 3, limit: 5 });

    // skip = (3-1)*5 = 10
    expect(paginatedQb.skip).toHaveBeenCalledWith(10);
    expect(paginatedQb.take).toHaveBeenCalledWith(5);
  });

  // ─── Escenario: Estudiante sin nombre → "Anónimo" ────────────────────
  it('getTutorReviews(): debe mostrar "Anónimo" si el estudiante no se encuentra', async () => {
    tutorRepositoryMock.findOne.mockResolvedValue({ id: tutorId });

    const summaryAvgQb = createMockQb();
    summaryAvgQb.getRawOne.mockResolvedValue({ avg: '5.0', count: '1' });
    const summaryDistQb = createMockQb();
    summaryDistQb.getRawMany.mockResolvedValue([{ rating: 5, count: '1' }]);

    const paginatedQb = createMockQb();
    paginatedQb.getCount.mockResolvedValue(1);
    paginatedQb.getMany.mockResolvedValue([
      {
        id: 'r1',
        estudianteId: 'unknown-student',
        tutorId,
        rating: 5,
        comment: null,
        createdAt: new Date('2024-05-24T10:00:00Z'),
        solicitud: { id: 'sol-1', oferta: { titulo: 'Física' } },
      },
    ]);

    reviewRepositoryMock.createQueryBuilder
      .mockReturnValueOnce(summaryAvgQb)
      .mockReturnValueOnce(summaryDistQb)
      .mockReturnValueOnce(paginatedQb);

    // User not found
    userRepositoryMock.createQueryBuilder.mockReturnValue(userQb);
    userQb.getMany.mockResolvedValue([]);

    const result = await service.getTutorReviews(tutorId, {});

    expect(result.reviews[0].student.firstName).toBe('Anónimo');
    expect(result.reviews[0].student.lastName).toBe('');
  });

  // ─── Escenario: Distribución siempre suma ~100% ──────────────────────
  it('calculateReviewSummary(): la suma de porcentajes de distribución debe ser ~100%', async () => {
    const summaryAvgQb = createMockQb();
    summaryAvgQb.getRawOne.mockResolvedValue({ avg: '4.0', count: '10' });
    const summaryDistQb = createMockQb();
    summaryDistQb.getRawMany.mockResolvedValue([
      { rating: 5, count: '5' },
      { rating: 4, count: '3' },
      { rating: 3, count: '1' },
      { rating: 2, count: '1' },
    ]);

    reviewRepositoryMock.createQueryBuilder
      .mockReturnValueOnce(summaryAvgQb)
      .mockReturnValueOnce(summaryDistQb);

    const summary = await service.calculateReviewSummary(tutorId);

    const totalPercent =
      summary.starDistribution['5'] +
      summary.starDistribution['4'] +
      summary.starDistribution['3'] +
      summary.starDistribution['2'] +
      summary.starDistribution['1'];

    // Due to rounding, total may be 99-101
    expect(totalPercent).toBeGreaterThanOrEqual(99);
    expect(totalPercent).toBeLessThanOrEqual(101);
    expect(summary.avgRating).toBe(4);
    expect(summary.totalReviews).toBe(10);
  });

  // ─── Escenario: Limit no puede exceder 20 (validación a nivel DTO) ───
  it('GetTutorReviewsQueryDto: limit máximo es 20 (verificación indirecta en paginación)', async () => {
    tutorRepositoryMock.findOne.mockResolvedValue({ id: tutorId });

    const summaryAvgQb = createMockQb();
    summaryAvgQb.getRawOne.mockResolvedValue({ avg: null, count: '0' });
    const summaryDistQb = createMockQb();
    summaryDistQb.getRawMany.mockResolvedValue([]);

    const paginatedQb = createMockQb();
    paginatedQb.getCount.mockResolvedValue(0);
    paginatedQb.getMany.mockResolvedValue([]);

    reviewRepositoryMock.createQueryBuilder
      .mockReturnValueOnce(summaryAvgQb)
      .mockReturnValueOnce(summaryDistQb)
      .mockReturnValueOnce(paginatedQb);

    // Even if 20 is passed, it should work (max is 20)
    const result = await service.getTutorReviews(tutorId, { limit: 20 });
    expect(result.limit).toBe(20);
  });
});
