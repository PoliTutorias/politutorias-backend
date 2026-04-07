import {
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TutorReviewsController } from '../../src/reviews/tutor-reviews.controller';
import { ReviewsService } from '../../src/reviews/reviews.service';

type StarDistributionBody = {
  '5': number;
  '4': number;
  '3': number;
  '2': number;
  '1': number;
};

type ReviewResponseBody = {
  reviews: {
    id: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
    date: string;
    stars: number;
    tutoringSubject: string;
    comment: string | null;
  }[];
  summary: {
    avgRating: number;
    totalReviews: number;
    starDistribution: StarDistributionBody;
  };
  total: number;
  page: number;
  limit: number;
};

type ErrorBody = {
  statusCode: number;
  message: string;
};

describe('TutorReviewsController (e2e) — GET /api/tutors/:tutorId/reviews', () => {
  let app: INestApplication;

  const reviewsServiceMock = {
    getTutorReviews: jest.fn(),
    create: jest.fn(),
  };

  const validTutorId = '11111111-1111-4111-8111-111111111111';

  const mockSummary = {
    avgRating: 4.7,
    totalReviews: 10,
    starDistribution: { '5': 60, '4': 20, '3': 10, '2': 5, '1': 5 },
  };

  const mockReviewItem = {
    id: '22222222-2222-4222-8222-222222222222',
    student: {
      id: '33333333-3333-4333-8333-333333333333',
      firstName: 'Juan',
      lastName: 'P.',
      avatarUrl: 'https://ui-avatars.com/api/?name=Juan+P',
    },
    date: '2024-05-24T10:00:00.000Z',
    stars: 5,
    tutoringSubject: 'Cálculo Diferencial',
    comment: 'Excelente tutor, explica muy claro.',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TutorReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: reviewsServiceMock,
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  // T-01: Acceso público sin JWT
  it('GET /api/tutors/:tutorId/reviews: debe responder 200 sin necesidad de header Authorization', async () => {
    reviewsServiceMock.getTutorReviews.mockResolvedValue({
      reviews: [mockReviewItem],
      summary: mockSummary,
      total: 10,
      page: 1,
      limit: 5,
    });

    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .get(`/api/tutors/${validTutorId}/reviews`)
      .expect(200);

    const body = response.body as ReviewResponseBody;
    expect(body).toHaveProperty('reviews');
    expect(body).toHaveProperty('summary');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('limit');
    expect(body.summary.avgRating).toBe(4.7);
    expect(body.summary.totalReviews).toBe(10);
    expect(body.summary.starDistribution).toBeDefined();
  });

  // Contrato de respuesta completo
  it('GET /api/tutors/:tutorId/reviews: debe retornar el contrato de datos completo', async () => {
    reviewsServiceMock.getTutorReviews.mockResolvedValue({
      reviews: [mockReviewItem],
      summary: mockSummary,
      total: 10,
      page: 1,
      limit: 5,
    });

    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .get(`/api/tutors/${validTutorId}/reviews`)
      .expect(200);

    const body = response.body as ReviewResponseBody;
    const review = body.reviews[0];
    expect(review).toHaveProperty('id');
    expect(review).toHaveProperty('student');
    expect(review.student).toHaveProperty('id');
    expect(review.student).toHaveProperty('firstName');
    expect(review.student).toHaveProperty('lastName');
    expect(review.student).toHaveProperty('avatarUrl');
    expect(review).toHaveProperty('date');
    expect(review).toHaveProperty('stars');
    expect(review).toHaveProperty('tutoringSubject');
    expect(review).toHaveProperty('comment');
  });

  // Parámetros de query válidos
  it('GET /api/tutors/:tutorId/reviews: debe aceptar query params válidos', async () => {
    reviewsServiceMock.getTutorReviews.mockResolvedValue({
      reviews: [],
      summary: {
        avgRating: 0,
        totalReviews: 0,
        starDistribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
      },
      total: 0,
      page: 2,
      limit: 3,
    });

    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .get(
        `/api/tutors/${validTutorId}/reviews?page=2&limit=3&sortBy=rating&ratingFilter=5`,
      )
      .expect(200);

    expect(reviewsServiceMock.getTutorReviews).toHaveBeenCalledWith(
      validTutorId,
      expect.objectContaining({
        page: 2,
        limit: 3,
        sortBy: 'rating',
        ratingFilter: '5',
      }),
    );
  });

  // Validación: tutorId inválido (no UUID)
  it('GET /api/tutors/:tutorId/reviews: debe responder 400 si tutorId no es UUID', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server).get('/api/tutors/not-a-uuid/reviews').expect(400);
  });

  // Validación: page < 1
  it('GET /api/tutors/:tutorId/reviews: debe responder 400 si page < 1', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .get(`/api/tutors/${validTutorId}/reviews?page=0`)
      .expect(400);
  });

  // Validación: limit > 20
  it('GET /api/tutors/:tutorId/reviews: debe responder 400 si limit > 20', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .get(`/api/tutors/${validTutorId}/reviews?limit=21`)
      .expect(400);
  });

  // Validación: sortBy inválido
  it('GET /api/tutors/:tutorId/reviews: debe responder 400 si sortBy es inválido', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .get(`/api/tutors/${validTutorId}/reviews?sortBy=invalid`)
      .expect(400);
  });

  // Validación: ratingFilter inválido
  it('GET /api/tutors/:tutorId/reviews: debe responder 400 si ratingFilter es inválido', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .get(`/api/tutors/${validTutorId}/reviews?ratingFilter=6`)
      .expect(400);
  });

  // Tutor no encontrado (404 propagado del service)
  it('GET /api/tutors/:tutorId/reviews: debe responder 404 si el tutor no existe', async () => {
    reviewsServiceMock.getTutorReviews.mockRejectedValue(
      new NotFoundException('Tutor no encontrado'),
    );

    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .get(`/api/tutors/${validTutorId}/reviews`)
      .expect(404);

    const body = response.body as ErrorBody;
    expect(body.message).toBe('Tutor no encontrado');
  });

  // Valores por defecto
  it('GET /api/tutors/:tutorId/reviews: debe aplicar valores por defecto (page=1, limit=5, sortBy=createdAt, ratingFilter=all)', async () => {
    reviewsServiceMock.getTutorReviews.mockResolvedValue({
      reviews: [],
      summary: {
        avgRating: 0,
        totalReviews: 0,
        starDistribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
      },
      total: 0,
      page: 1,
      limit: 5,
    });

    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .get(`/api/tutors/${validTutorId}/reviews`)
      .expect(200);

    expect(reviewsServiceMock.getTutorReviews).toHaveBeenCalledWith(
      validTutorId,
      expect.objectContaining({
        page: 1,
        limit: 5,
        sortBy: 'createdAt',
        ratingFilter: 'all',
      }),
    );
  });

  // Tutor sin reseñas
  it('GET /api/tutors/:tutorId/reviews: debe retornar arreglo vacío y resumen en ceros para tutor sin reseñas', async () => {
    const emptySummary = {
      avgRating: 0,
      totalReviews: 0,
      starDistribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
    };

    reviewsServiceMock.getTutorReviews.mockResolvedValue({
      reviews: [],
      summary: emptySummary,
      total: 0,
      page: 1,
      limit: 5,
    });

    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .get(`/api/tutors/${validTutorId}/reviews`)
      .expect(200);

    const body = response.body as ReviewResponseBody;
    expect(body.reviews).toEqual([]);
    expect(body.summary.avgRating).toBe(0);
    expect(body.summary.totalReviews).toBe(0);
    expect(body.summary.starDistribution['1']).toBe(0);
    expect(body.summary.starDistribution['5']).toBe(0);
  });
});
