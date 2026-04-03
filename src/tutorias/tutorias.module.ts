import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TutoriasController } from './tutorias.controller';
import { TutoriasService } from './tutorias.service';
import { SolicitudEntity } from '../solicitudes/entities/solicitud.entity';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ReviewEntity } from './entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SolicitudEntity,
      Oferta,
      Tutor,
      UserEntity,
      ReviewEntity,
    ]),
  ],
  controllers: [TutoriasController],
  providers: [TutoriasService],
  exports: [TutoriasService],
})
export class TutoriasModule {}
