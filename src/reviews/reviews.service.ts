import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SolicitudEntity,
  SolicitudEstado,
} from '../solicitudes/entities/solicitud.entity';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { UserEntity } from '../users/entities/user.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { TutoriasService } from '../tutorias/tutorias.service';
import { ReviewEntity } from '../tutorias/entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  GetTutorReviewsQueryDto,
  RatingFilter,
  ReviewSortBy,
} from './dto/get-tutor-reviews-query.dto';
import {
  ReviewItemDto,
  ReviewSummaryDto,
  StarDistributionDto,
  TutorReviewsResponseDto,
  TutorStatsDto,
} from './dto/tutor-reviews-response.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(SolicitudEntity)
    private readonly solicitudRepository: Repository<SolicitudEntity>,
    @InjectRepository(Oferta)
    private readonly ofertaRepository: Repository<Oferta>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(Tutor)
    private readonly tutorRepository: Repository<Tutor>,
    private readonly tutoriasService: TutoriasService,
  ) {}

  /**
   * HU-22: Obtiene las reseñas de un tutor con resumen estadístico y paginación.
   * Endpoint público (sin JWT).
   */
  async getTutorReviews(
    tutorId: string,
    params: GetTutorReviewsQueryDto,
  ): Promise<TutorReviewsResponseDto> {
    // 1. Verificar que el tutor existe
    const tutor = await this.tutorRepository.findOne({
      where: { id: tutorId },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor no encontrado');
    }

    // 2. Calcular el resumen estadístico (siempre sobre TODAS las reseñas del tutor)
    const summary = await this.calculateReviewSummary(tutorId);

    // 3. Obtener reseñas paginadas con filtro
    const page = params.page ?? 1;
    const limit = params.limit ?? 5;
    const sortBy = params.sortBy ?? ReviewSortBy.CREATED_AT;
    const ratingFilter = params.ratingFilter ?? RatingFilter.ALL;
    const skip = (page - 1) * limit;

    // Query con join a solicitud → oferta (para materia)
    const qb = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.solicitud', 'solicitud')
      .leftJoin('solicitud.oferta', 'oferta')
      .addSelect([
        'solicitud.id',
        'solicitud.estudianteId',
        'solicitud.ofertaId',
      ])
      .addSelect(['oferta.titulo'])
      .where('review.tutorId = :tutorId', { tutorId });

    // Filtro por estrellas
    if (ratingFilter !== RatingFilter.ALL) {
      qb.andWhere('review.rating = :rating', {
        rating: parseInt(ratingFilter, 10),
      });
    }

    // Ordenamiento
    if (sortBy === ReviewSortBy.RATING) {
      qb.orderBy('review.rating', 'DESC');
      qb.addOrderBy('review.createdAt', 'DESC');
    } else {
      qb.orderBy('review.createdAt', 'DESC');
    }

    // Contar total (con filtro aplicado)
    const total = await qb.getCount();

    // Paginación
    const reviews = await qb.skip(skip).take(limit).getMany();

    // 4. Cargar nombres de estudiantes en batch (evitar N+1)
    const studentIds = [...new Set(reviews.map((r) => r.estudianteId))];
    const studentsMap = new Map<string, UserEntity>();

    if (studentIds.length > 0) {
      const students = await this.userRepository
        .createQueryBuilder('user')
        .where('user.id IN (:...ids)', { ids: studentIds })
        .getMany();

      students.forEach((s) => studentsMap.set(s.id, s));
    }

    // 5. Mapear a DTOs de respuesta
    const reviewItems: ReviewItemDto[] = reviews.map((r) => {
      const student = studentsMap.get(r.estudianteId);
      const fullName = student?.name ?? 'Anónimo';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] ?? 'Anónimo';
      const lastName = nameParts.length > 1 ? `${nameParts[1].charAt(0)}.` : '';

      const avatarUrl = this.generateAvatarUrl(fullName);
      const subjectName = r.solicitud?.oferta?.titulo ?? 'Materia';

      return {
        id: r.id,
        student: {
          id: r.estudianteId,
          firstName,
          lastName,
          avatarUrl,
        },
        date: r.createdAt.toISOString(),
        stars: r.rating,
        tutoringSubject: subjectName,
        comment: r.comment,
      };
    });

    // 6. Calcular estadísticas del tutor (tutorías completadas, materias, % que califican)
    const completedTutorias = await this.solicitudRepository.count({
      where: { tutorId, estado: SolicitudEstado.COMPLETADA },
    });

    const subjectsRaw = await this.solicitudRepository
      .createQueryBuilder('s')
      .leftJoin('s.oferta', 'oferta')
      .select('DISTINCT oferta.titulo', 'titulo')
      .where('s.tutorId = :tutorId', { tutorId })
      .andWhere('s.estado = :estado', { estado: SolicitudEstado.COMPLETADA })
      .getRawMany<{ titulo: string }>();

    const uniqueSubjects = subjectsRaw.length;

    const ratingParticipation =
      completedTutorias > 0
        ? Math.round((summary.totalReviews / completedTutorias) * 100)
        : 0;

    const tutorStats: TutorStatsDto = {
      completedTutorias,
      uniqueSubjects,
      ratingParticipation,
    };

    return {
      reviews: reviewItems,
      summary,
      tutorStats,
      total,
      page,
      limit,
    };
  }

  /**
   * Calcula el resumen estadístico de reseñas de un tutor:
   * - Promedio redondeado a 1 decimal
   * - Total de reseñas
   * - Distribución porcentual de estrellas (1-5), siempre presentes
   */
  async calculateReviewSummary(tutorId: string): Promise<ReviewSummaryDto> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.tutorId = :tutorId', { tutorId })
      .getRawOne<{ avg: string | null; count: string }>();

    const totalReviews = parseInt(result?.count ?? '0', 10);
    const avgRating =
      totalReviews > 0
        ? Math.round(parseFloat(result?.avg ?? '0') * 10) / 10
        : 0;

    // Distribución de estrellas
    const distribution = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.tutorId = :tutorId', { tutorId })
      .groupBy('review.rating')
      .getRawMany<{ rating: number; count: string }>();

    const starDistribution: StarDistributionDto = {
      '5': 0,
      '4': 0,
      '3': 0,
      '2': 0,
      '1': 0,
    };

    if (totalReviews > 0) {
      distribution.forEach((row) => {
        const key = String(row.rating) as keyof StarDistributionDto;
        const count = parseInt(row.count, 10);
        starDistribution[key] = Math.round((count / totalReviews) * 100);
      });
    }

    return {
      avgRating,
      totalReviews,
      starDistribution,
    };
  }

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

  /**
   * Genera una URL de avatar usando UI Avatars
   */
  private generateAvatarUrl(name: string): string {
    if (!name || name === 'Anónimo') {
      return 'https://ui-avatars.com/api/?name=A&background=6c757d&color=fff&size=128&bold=true&rounded=true';
    }

    const encodedName = encodeURIComponent(name).replace(/%20/g, '+');
    return `https://ui-avatars.com/api/?name=${encodedName}&background=0D8ABC&color=fff&size=128&bold=true&rounded=true`;
  }
}
