import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudEstado } from '../solicitudes/entities/solicitud.entity';
import { ReviewEntity } from '../tutorias/entities/review.entity';
import { TutoriasService } from '../tutorias/tutorias.service';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepository: jest.Mocked<Repository<ReviewEntity>>;
  let tutoriasService: {
    findOneForReview: jest.Mock;
    linkReviewToTutorial: jest.Mock;
  };

  const studentId = 'student-1';
  const tutoriaId = '11111111-1111-4111-8111-111111111111';

  beforeEach(async () => {
    const reviewRepositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
    };

    tutoriasService = {
      findOneForReview: jest.fn(),
      linkReviewToTutorial: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(ReviewEntity),
          useValue: reviewRepositoryMock,
        },
        {
          provide: TutoriasService,
          useValue: tutoriasService,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    reviewRepository = module.get(getRepositoryToken(ReviewEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('create(): debe lanzar NotFoundException si la tutoría no existe o no pertenece al studentId', async () => {
    tutoriasService.findOneForReview.mockResolvedValue(null);

    await expect(
      service.create(studentId, { tutoriaId, rating: 5, comment: 'Excelente' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create(): debe lanzar BadRequestException si el estado de la tutoría no es COMPLETED', async () => {
    tutoriasService.findOneForReview.mockResolvedValue({
      id: tutoriaId,
      estudianteId: studentId,
      tutorId: 'tutor-1',
      estado: SolicitudEstado.ACEPTADA,
      reviewId: null,
    });

    await expect(
      service.create(studentId, { tutoriaId, rating: 4, comment: 'Bien' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create(): debe lanzar BadRequestException si la tutoría ya tiene una reseña asociada', async () => {
    tutoriasService.findOneForReview.mockResolvedValue({
      id: tutoriaId,
      estudianteId: studentId,
      tutorId: 'tutor-1',
      estado: SolicitudEstado.COMPLETADA,
      reviewId: 'review-1',
    });

    await expect(
      service.create(studentId, { tutoriaId, rating: 4, comment: 'Duplicada' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create(): debe guardar la reseña y llamar a tutoriasService.linkReviewToTutorial', async () => {
    tutoriasService.findOneForReview.mockResolvedValue({
      id: tutoriaId,
      estudianteId: studentId,
      tutorId: 'tutor-1',
      estado: SolicitudEstado.COMPLETADA,
      reviewId: null,
    });

    reviewRepository.create.mockReturnValue({
      solicitudId: tutoriaId,
      estudianteId: studentId,
      tutorId: 'tutor-1',
      rating: 5,
      comment: 'Excelente',
    } as ReviewEntity);

    reviewRepository.save.mockResolvedValue({
      id: 'review-id',
      solicitudId: tutoriaId,
      estudianteId: studentId,
      tutorId: 'tutor-1',
      rating: 5,
      comment: 'Excelente',
      createdAt: new Date('2024-05-24T10:00:00.000Z'),
    } as ReviewEntity);

    await service.create(studentId, {
      tutoriaId,
      rating: 5,
      comment: 'Excelente',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(reviewRepository.create).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(reviewRepository.save).toHaveBeenCalledTimes(1);
    expect(tutoriasService.linkReviewToTutorial).toHaveBeenCalledWith(
      tutoriaId,
      'review-id',
    );
  });

  it('create(): debe propagar un error inesperado de base de datos', async () => {
    tutoriasService.findOneForReview.mockResolvedValue({
      id: tutoriaId,
      estudianteId: studentId,
      tutorId: 'tutor-1',
      estado: SolicitudEstado.COMPLETADA,
      reviewId: null,
    });

    reviewRepository.create.mockReturnValue({
      solicitudId: tutoriaId,
      estudianteId: studentId,
      tutorId: 'tutor-1',
      rating: 5,
      comment: null,
    } as ReviewEntity);

    reviewRepository.save.mockRejectedValue(new Error('DB error'));

    await expect(
      service.create(studentId, { tutoriaId, rating: 5 }),
    ).rejects.toThrow('DB error');
  });
});
