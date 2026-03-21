import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudEntity } from '../solicitudes/entities/solicitud.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';
import { SessionsService } from './sessions.service';
import { IsSessionOwnerGuard } from './guards/is-session-owner.guard';

@Module({
  imports: [TypeOrmModule.forFeature([SolicitudEntity, Tutor])],
  controllers: [AgendaController],
  providers: [AgendaService, SessionsService, IsSessionOwnerGuard],
})
export class AgendaModule {}
