import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudEntity } from './entities/solicitud.entity';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { SolicitudesController } from './solicitudes.controller';
import { SolicitudesService } from './solicitudes.service';
import { TutorAuthGuard } from '../auth/guards/tutor-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([SolicitudEntity, Oferta, Tutor])],
  controllers: [SolicitudesController],
  providers: [SolicitudesService, TutorAuthGuard],
})
export class SolicitudesModule {}
