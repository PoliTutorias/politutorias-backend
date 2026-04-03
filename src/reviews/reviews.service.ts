import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudEstado } from '../solicitudes/entities/solicitud.entity';
import { TutoriasService } from '../tutorias/tutorias.service';
import { ReviewEntity } from '../tutorias/entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    private readonly tutoriasService: TutoriasService,
  ) {}

  async create(
    studentId: string,
    dto: CreateReviewDto,
  ): Promise<{
    id: string;
    tutoriaId: string;
    calificacion: number;
    comentario: string | null;
    fechaCreacion: string;
  }> {
    const tutoria = await this.tutoriasService.findOneForReview(dto.tutoriaId);

    if (!tutoria || tutoria.estudianteId !== studentId) {
      throw new NotFoundException('Tutoria no encontrada');
    }

    if (tutoria.estado !== SolicitudEstado.COMPLETADA) {
      throw new BadRequestException(
        'Solo se pueden calificar tutorias completadas',
      );
    }

    if (tutoria.reviewId) {
      throw new BadRequestException('Esta tutoria ya ha sido calificada');
    }

    const review = this.reviewRepository.create({
      solicitudId: dto.tutoriaId,
      estudianteId: studentId,
      tutorId: tutoria.tutorId,
      rating: dto.rating,
      comment: dto.comment?.trim() || null,
    });

    const savedReview = await this.reviewRepository.save(review);
    await this.tutoriasService.linkReviewToTutorial(
      dto.tutoriaId,
      savedReview.id,
    );

    return {
      id: savedReview.id,
      tutoriaId: savedReview.solicitudId,
      calificacion: savedReview.rating,
      comentario: savedReview.comment,
      fechaCreacion: savedReview.createdAt.toISOString(),
    };
  }
}
