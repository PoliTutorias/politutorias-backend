import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SolicitudEntity,
  SolicitudEstado,
} from '../solicitudes/entities/solicitud.entity';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import {
  SessionDetailDto,
  SelectedDayInfoDto,
  CalendarSessionSummaryDto,
} from './dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(SolicitudEntity)
    private readonly solicitudRepository: Repository<SolicitudEntity>,
  ) {}

  /**
   * HU15 — Obtiene las sesiones de un día específico para un tutor.
   *
   * Filtra solicitudes ACEPTADAS/COMPLETADAS del tutor cuyo horario
   * coincide con la fecha indicada.
   */
  async getSessionsByDay(
    tutorId: string,
    date: string,
  ): Promise<SelectedDayInfoDto> {
    const solicitudes = await this.solicitudRepository
      .createQueryBuilder('solicitud')
      .leftJoinAndSelect('solicitud.oferta', 'oferta')
      .where('solicitud.tutorId = :tutorId', { tutorId })
      .andWhere('solicitud.estado IN (:...estados)', {
        estados: [SolicitudEstado.ACEPTADA, SolicitudEstado.COMPLETADA],
      })
      .getMany();

    // Filtrar las que tienen horario en la fecha indicada
    const sessions: CalendarSessionSummaryDto[] = [];

    for (const solicitud of solicitudes) {
      for (const horario of solicitud.horarios) {
        if (horario.fecha === date) {
          const oferta = (solicitud as SolicitudEntity & { oferta?: Oferta })
            .oferta;

          sessions.push({
            id: solicitud.id,
            subject: oferta?.titulo ?? oferta?.title ?? '',
            hour: horario.hora,
            studentName: solicitud.nombreEstudiante ?? '',
            modality: solicitud.modalidad ?? '',
          });
        }
      }
    }

    // Ordenar por hora
    sessions.sort((a, b) => a.hour.localeCompare(b.hour));

    return {
      date,
      sessionCount: sessions.length,
      sessions,
    };
  }

  /**
   * HU15 — Obtiene el detalle completo de una sesión (solicitud confirmada).
   *
   * Incluye información del estudiante, materia, modalidad, precio,
   * enlace de reunión o ubicación, y el mensaje del estudiante.
   *
   * El estado PENDING/COMPLETED se determina comparando la fecha/hora
   * de la sesión con el momento actual.
   */
  async getDetails(
    tutorId: string,
    sessionId: string,
  ): Promise<SessionDetailDto> {
    const solicitud = await this.solicitudRepository
      .createQueryBuilder('solicitud')
      .leftJoinAndSelect('solicitud.oferta', 'oferta')
      .leftJoinAndSelect('oferta.tutor', 'tutor')
      .where('solicitud.id = :sessionId', { sessionId })
      .getOne();

    if (!solicitud) {
      throw new NotFoundException('Sesión no encontrada.');
    }

    // Validar que la sesión pertenece al tutor autenticado
    if (solicitud.tutorId !== tutorId) {
      throw new NotFoundException('Sesión no encontrada.');
    }

    // Solo ACEPTADA o COMPLETADA son sesiones válidas para la agenda
    if (
      solicitud.estado !== SolicitudEstado.ACEPTADA &&
      solicitud.estado !== SolicitudEstado.COMPLETADA
    ) {
      throw new NotFoundException('Sesión no encontrada.');
    }

    const oferta = (solicitud as SolicitudEntity & { oferta?: Oferta }).oferta;
    const precio = Number(oferta?.price ?? oferta?.precioHora ?? 0);

    // Determinar estado PENDING/COMPLETED
    const now = new Date();
    const firstHorario = solicitud.horarios?.[0];
    let status: 'PENDING' | 'COMPLETED' = 'PENDING';

    if (solicitud.estado === SolicitudEstado.COMPLETADA) {
      status = 'COMPLETED';
    } else if (firstHorario) {
      const sessionDateTime = new Date(
        `${firstHorario.fecha}T${firstHorario.hora}:00`,
      );
      if (sessionDateTime < now) {
        status = 'COMPLETED';
      }
    }

    return {
      id: solicitud.id,
      studentName: solicitud.nombreEstudiante ?? '',
      studentEmail: null, // El email no está en SolicitudEntity; se puede extender luego
      subject: oferta?.titulo ?? oferta?.title ?? '',
      date: firstHorario?.fecha ?? '',
      hour: firstHorario?.hora ?? '',
      modality: solicitud.modalidad ?? '',
      pricePerHour: precio,
      meetingLink: solicitud.acceptedMeetingLink ?? null,
      meetingLocation: solicitud.acceptedMeetingLocation ?? null,
      studentMessage: solicitud.mensaje,
      status,
    };
  }
}
