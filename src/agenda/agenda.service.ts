import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  SolicitudEntity,
  SolicitudEstado,
} from '../solicitudes/entities/solicitud.entity';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import {
  InitialAgendaDataDto,
  MonthSessionCardDto,
  CalendarDayDto,
} from './dto';

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(SolicitudEntity)
    private readonly solicitudRepository: Repository<SolicitudEntity>,
  ) {}

  /**
   * HU15 — Obtiene los datos de la agenda mensual del tutor.
   *
   * Busca todas las solicitudes ACEPTADAS o COMPLETADAS del tutor
   * cuyo horario cae dentro del mes/año indicados.
   *
   * @returns InitialAgendaDataDto con calendarDays y upcomingSessions
   */
  async getMonthlyAgendaData(
    tutorId: string,
    year: number,
    month: number,
  ): Promise<InitialAgendaDataDto> {
    // Calcular rango de fechas del mes
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Buscar solicitudes ACEPTADAS y COMPLETADAS del tutor
    const solicitudes = await this.solicitudRepository
      .createQueryBuilder('solicitud')
      .leftJoinAndSelect('solicitud.oferta', 'oferta')
      .leftJoinAndSelect('oferta.tutor', 'tutor')
      .where('solicitud.tutorId = :tutorId', { tutorId })
      .andWhere('solicitud.estado IN (:...estados)', {
        estados: [SolicitudEstado.ACEPTADA, SolicitudEstado.COMPLETADA],
      })
      .orderBy('solicitud.createdAt', 'ASC')
      .getMany();

    // Filtrar sesiones cuyo horario cae dentro del mes solicitado
    const sessionsInMonth: {
      solicitud: SolicitudEntity;
      horario: { fecha: string; hora: string };
    }[] = [];

    for (const solicitud of solicitudes) {
      for (const horario of solicitud.horarios) {
        if (horario.fecha >= startDate && horario.fecha <= endDate) {
          sessionsInMonth.push({ solicitud, horario });
        }
      }
    }

    // Agrupar por día para el calendario
    const dayMap = new Map<number, CalendarDayDto>();

    for (const { solicitud, horario } of sessionsInMonth) {
      const dayNum = parseInt(horario.fecha.split('-')[2], 10);
      const oferta = (solicitud as SolicitudEntity & { oferta?: Oferta })
        .oferta;
      const subject = oferta?.titulo ?? oferta?.title ?? '';
      const label = `${horario.hora} ${subject}`.substring(0, 30);

      if (!dayMap.has(dayNum)) {
        dayMap.set(dayNum, {
          day: dayNum,
          sessionCount: 0,
          labels: [],
        });
      }

      const dayDto = dayMap.get(dayNum)!;
      dayDto.sessionCount++;
      dayDto.labels.push(label);
    }

    const calendarDays = Array.from(dayMap.values()).sort(
      (a, b) => a.day - b.day,
    );

    // Construir lista de sesiones para el panel "ESTE MES" (futuras primero)
    const now = new Date();
    const upcomingSessions: MonthSessionCardDto[] = sessionsInMonth
      .sort((a, b) => {
        const dateA = `${a.horario.fecha}T${a.horario.hora}`;
        const dateB = `${b.horario.fecha}T${b.horario.hora}`;
        return dateA.localeCompare(dateB);
      })
      .map(({ solicitud, horario }) => {
        const oferta = (solicitud as SolicitudEntity & { oferta?: Oferta })
          .oferta;
        const sessionDateTime = new Date(
          `${horario.fecha}T${horario.hora}:00`,
        );
        const isCompleted =
          solicitud.estado === SolicitudEstado.COMPLETADA ||
          sessionDateTime < now;

        return {
          id: solicitud.id,
          subject: oferta?.titulo ?? oferta?.title ?? '',
          studentName: solicitud.nombreEstudiante ?? '',
          date: horario.fecha,
          hour: horario.hora,
          modality: solicitud.modalidad ?? '',
          status: (isCompleted ? 'COMPLETED' : 'PENDING') as
            | 'PENDING'
            | 'COMPLETED',
        };
      });

    return {
      year,
      month,
      totalSessions: sessionsInMonth.length,
      calendarDays,
      upcomingSessions,
    };
  }
}
