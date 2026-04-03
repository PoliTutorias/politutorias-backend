import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import request from 'supertest';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { ReviewsController } from '../../src/reviews/reviews.controller';
import { ReviewsService } from '../../src/reviews/reviews.service';

type AuthenticatedRequest = Request & {
  headers: {
    authorization?: string;
  };
  user?: {
    id: string;
  };
};

type ErrorResponseBody = {
  statusCode: number;
  message: string | string[];
};

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!req.headers.authorization) {
      throw new UnauthorizedException('Unauthorized');
    }

    req.user = { id: '11111111-1111-4111-8111-111111111111' };
    return true;
  }
}

describe('ReviewsController (e2e)', () => {
  let app: INestApplication;

  const reviewsServiceMock = {
    create: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: reviewsServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

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

  it('POST /api/reviews: debe responder 201 con contrato exitoso', async () => {
    reviewsServiceMock.create.mockResolvedValue({
      id: 'review-id',
      tutoriaId: '11111111-1111-4111-8111-111111111111',
      calificacion: 5,
      comentario: 'Excelente explicación',
      fechaCreacion: '2024-05-24T10:00:00.000Z',
    });

    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .post('/api/reviews')
      .set('Authorization', 'Bearer fake-token')
      .send({
        tutoriaId: '11111111-1111-4111-8111-111111111111',
        rating: 5,
        comment: 'Excelente explicación',
      })
      .expect(201);

    expect(response.body).toEqual({
      statusCode: 201,
      message: 'Reseña creada correctamente',
      data: {
        id: 'review-id',
        tutoriaId: '11111111-1111-4111-8111-111111111111',
        calificacion: 5,
        comentario: 'Excelente explicación',
        fechaCreacion: '2024-05-24T10:00:00.000Z',
      },
    });
  });

  it.each([0, 6, 3.5])(
    'POST /api/reviews: debe responder 400 si rating es inválido (%s)',
    async (invalidRating) => {
      const server = app.getHttpServer() as Parameters<typeof request>[0];

      const response = await request(server)
        .post('/api/reviews')
        .set('Authorization', 'Bearer fake-token')
        .send({
          tutoriaId: '11111111-1111-4111-8111-111111111111',
          rating: invalidRating,
          comment: 'Comentario',
        })
        .expect(400);

      const body = response.body as ErrorResponseBody;
      expect(body.statusCode).toBe(400);
      expect(body.message).toBeDefined();
    },
  );

  it('POST /api/reviews: debe responder 400 si tutoriaId no es UUID válido', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .post('/api/reviews')
      .set('Authorization', 'Bearer fake-token')
      .send({
        tutoriaId: 'no-es-uuid',
        rating: 5,
        comment: 'Comentario',
      })
      .expect(400);

    const body = response.body as ErrorResponseBody;
    expect(body.statusCode).toBe(400);
    expect(body.message).toBeDefined();
  });

  it('POST /api/reviews: debe responder 400 si comment supera 300 caracteres', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .post('/api/reviews')
      .set('Authorization', 'Bearer fake-token')
      .send({
        tutoriaId: '11111111-1111-4111-8111-111111111111',
        rating: 5,
        comment: 'a'.repeat(301),
      })
      .expect(400);

    const body = response.body as ErrorResponseBody;
    expect(body.statusCode).toBe(400);
    expect(body.message).toBeDefined();
  });

  it('POST /api/reviews: debe responder 401 si no hay token JWT', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .post('/api/reviews')
      .send({
        tutoriaId: '11111111-1111-4111-8111-111111111111',
        rating: 5,
      })
      .expect(401);

    const body = response.body as ErrorResponseBody;
    expect(body.statusCode).toBe(401);
    expect(body.message).toBe('Unauthorized');
  });
});
