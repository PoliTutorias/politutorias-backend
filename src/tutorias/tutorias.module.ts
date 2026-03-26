import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TutoriasController } from './tutorias.controller';
import { TutoriasService } from './tutorias.service';
import { SolicitudEntity } from '../solicitudes/entities/solicitud.entity';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { UserEntity } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SolicitudEntity, Oferta, Tutor, UserEntity]),
  ],
  controllers: [TutoriasController],
  providers: [TutoriasService],
})
export class TutoriasModule {}
