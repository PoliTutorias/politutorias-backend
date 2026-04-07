import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TutoriasModule } from '../tutorias/tutorias.module';
import { ReviewEntity } from '../tutorias/entities/review.entity';
import { SolicitudEntity } from '../solicitudes/entities/solicitud.entity';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { UserEntity } from '../users/entities/user.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { ReviewsController } from './reviews.controller';
import { TutorReviewsController } from './tutor-reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReviewEntity,
      SolicitudEntity,
      Oferta,
      UserEntity,
      Tutor,
    ]),
    TutoriasModule,
  ],
  controllers: [ReviewsController, TutorReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
