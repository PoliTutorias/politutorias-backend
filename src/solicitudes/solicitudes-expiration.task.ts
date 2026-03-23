import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { estaExpirado } from '../common/utils/week-window.util';
import { SolicitudEntity, SolicitudEstado } from './entities/solicitud.entity';

/**
 * Tarea programada que implementa SOL-03:
 *
 * "Si la diferencia de tiempo entre la hora actual y la hora de inicio
 *  de la disponibilidad del tutor es menor a 4 horas y la solicitud
 *  sigue en estado PENDIENTE, el sistema la cambiará automáticamente
 *  a EXPIRADA."
 *
 * Se ejecuta cada 5 minutos para mantener el estado actualizado sin
 * carga excesiva a la base de datos.
 */
@Injectable()
export class SolicitudesExpirationTask {
  private readonly logger = new Logger(SolicitudesExpirationTask.name);

  constructor(
    @InjectRepository(SolicitudEntity)
    private readonly solicitudRepository: Repository<SolicitudEntity>,
  ) {}

  @Cron('*/5 * * * *') // cada 5 minutos
  async expirarSolicitudesVencidas(): Promise<void> {
    const ahora = new Date();

    // Obtener todas las solicitudes PENDIENTES
    // Filtramos con una ventana generosa: solo las creadas hace más de 4 horas
    // para reducir el conjunto y evitar leer toda la tabla.
    const cuatroHorasAtras = new Date(ahora.getTime() - 4 * 60 * 60 * 1000);

    const pendientes = await this.solicitudRepository.find({
      where: {
        estado: SolicitudEstado.PENDIENTE,
        createdAt: LessThan(cuatroHorasAtras),
      },
      select: ['id', 'horarios', 'estado', 'createdAt'],
    });

    if (pendientes.length === 0) return;

    const idsAExpirar: string[] = [];

    for (const solicitud of pendientes) {
      const primerHorario = solicitud.horarios?.[0];
      if (!primerHorario?.fecha || !primerHorario?.hora) continue;

      if (estaExpirado(primerHorario.fecha, primerHorario.hora, ahora)) {
        idsAExpirar.push(solicitud.id);
      }
    }

    if (idsAExpirar.length === 0) return;

    await this.solicitudRepository
      .createQueryBuilder()
      .update(SolicitudEntity)
      .set({ estado: SolicitudEstado.EXPIRADA })
      .whereInIds(idsAExpirar)
      .execute();

    this.logger.log(
      `SOL-03 | Expiradas ${idsAExpirar.length} solicitud(es): [${idsAExpirar.join(', ')}]`,
    );
  }
}
