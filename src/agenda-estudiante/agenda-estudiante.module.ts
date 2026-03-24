import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudEntity } from '../solicitudes/entities/solicitud.entity';
import { AgendaEstudianteController } from './agenda-estudiante.controller';
import { AgendaEstudianteService } from './agenda-estudiante.service';
import { IsSolicitudOwnerGuard } from './guards/is-solicitud-owner.guard';

@Module({
  imports: [TypeOrmModule.forFeature([SolicitudEntity])],
  controllers: [AgendaEstudianteController],
  providers: [AgendaEstudianteService, IsSolicitudOwnerGuard],
})
export class AgendaEstudianteModule {}
