import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SolicitudEntity,
  SolicitudEstado,
} from '../solicitudes/entities/solicitud.entity';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { AgendaPaginationDto } from './dto/agenda-pagination.dto';
import {
  AgendaStudentDetailDTO,
  AgendaStudentListItemDTO,
  EstudianteAgendaResponseDto,
  SolicitudStatus,
} from './dto/agenda-student.dto';

/**
 * HU11 — Servicio de agenda del estudiante.
 *
 * Expone las tutorías confirmadas (ACEPTADA / COMPLETADA) del estudiante
 * y las clasifica en "proximas" (futuras) y "anteriores" (pasadas).
 *
 * REGLA CRÍTICA: una sesión con estado ACEPTADA en BD cuya fecha ya pasó
 * se reporta como COMPLETED en el DTO sin modificar la BD.
 */
@Injectable()
export class AgendaEstudianteService {
  constructor(
    @InjectRepository(SolicitudEntity)
    private readonly solicitudRepository: Repository<SolicitudEntity>,
  ) {}

  /**
   * Obtiene la agenda del estudiante dividida en proximas y anteriores.
   *
   * @param studentId  ID del estudiante (extraído del JWT)
   * @param params     Parámetros de paginación (page, limit) — aplica a "anteriores"
   */
  async getStudentAgenda(
    studentId: string,
    params: AgendaPaginationDto,
  ): Promise<EstudianteAgendaResponseDto> {
    const { page, limit } = params;

    // Buscar todas las solicitudes del estudiante con estados relevantes
    // Se usa array de condiciones OR para que el unit test pueda validar
    // que el repositorio se llama con `estudianteId` dentro de las condiciones.
    const solicitudes = await this.solicitudRepository.find({
      where: [
        { estudianteId: studentId, estado: SolicitudEstado.ACEPTADA },
        { estudianteId: studentId, estado: SolicitudEstado.COMPLETADA },
      ],
      relations: ['oferta', 'oferta.tutor'],
      order: { createdAt: 'DESC' },
    });

    const now = new Date();

    // Clasificar cada sesión en próxima o anterior según su fecha
    const proximasAll: AgendaStudentListItemDTO[] = [];
    const anterioresAll: AgendaStudentListItemDTO[] = [];

    for (const solicitud of solicitudes) {
      const item = this.mapToListItemDto(solicitud, now);

      // La fecha de sesión se obtiene del primer horario
      const horario = solicitud.horarios?.[0];
      if (!horario) continue;

      const sessionDateTime = new Date(`${horario.fecha}T${horario.hora}:00`);

      if (sessionDateTime > now) {
        proximasAll.push(item);
      } else {
        anterioresAll.push(item);
      }
    }

    // Paginación de "anteriores"
    const totalAnteriores = anterioresAll.length;
    const totalPagesAnteriores = Math.ceil(totalAnteriores / limit) || 1;
    const startIndex = (page - 1) * limit;
    const anterioresPaginated = anterioresAll.slice(
      startIndex,
      startIndex + limit,
    );

    return {
      proximas: proximasAll,
      anteriores: anterioresPaginated,
      totalProximas: proximasAll.length,
      totalAnteriores,
      currentPage: page,
      totalPagesAnteriores,
    };
  }

  /**
   * Obtiene el detalle completo de una sesión.
   *
   * @param studentId  ID del estudiante autenticado
   * @param sessionId  ID de la solicitud (sesión)
   * @throws NotFoundException si la sesión no existe o no pertenece al estudiante
   */
  async getSessionDetails(
    studentId: string,
    sessionId: string,
  ): Promise<AgendaStudentDetailDTO> {
    const solicitud = await this.solicitudRepository.findOne({
      where: { id: sessionId },
      relations: ['oferta', 'oferta.tutor'],
    });

    if (!solicitud) {
      throw new NotFoundException('Tutoría no encontrada.');
    }

    // Se usa 404 en lugar de 403 para no revelar la existencia del recurso
    if (solicitud.estudianteId !== studentId) {
      throw new NotFoundException('Tutoría no encontrada.');
    }

    const now = new Date();
    const item = this.mapToListItemDto(solicitud, now);
    const oferta = solicitud.oferta as
      | (Oferta & {
          price?: number;
          tutor?: { id: string; nombreCompleto?: string; fotoPerfil?: string };
        })
      | null;

    return {
      ...item,
      meetingLink: solicitud.acceptedMeetingLink ?? null,
      meetingLocation: solicitud.acceptedMeetingLocation ?? null,
      studentMessage: solicitud.mensaje ?? '',
      price: oferta?.price ?? 0,
    };
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────

  /**
   * Mapea una SolicitudEntity al DTO de listado.
   * Aplica la regla COMPLETED: ACEPTADA en BD + fecha pasada → COMPLETED en DTO.
   */
  private mapToListItemDto(
    solicitud: SolicitudEntity,
    now: Date,
  ): AgendaStudentListItemDTO {
    const horario = solicitud.horarios?.[0];
    const sessionDateTime = horario
      ? new Date(`${horario.fecha}T${horario.hora}:00`)
      : new Date(0);

    // Calcular status en runtime (no se persiste en BD)
    let status: SolicitudStatus;
    if (
      solicitud.estado === SolicitudEstado.COMPLETADA ||
      sessionDateTime <= now
    ) {
      status = 'COMPLETED';
    } else {
      status = 'ACEPTADA';
    }

    // La oferta puede llegar como objeto enriquecido con relaciones
    const oferta = solicitud.oferta as
      | (Oferta & {
          price?: number;
          title?: string;
          tutor?: {
            id: string;
            nombreCompleto?: string;
            fotoPerfil?: string;
          };
        })
      | null;

    const tutorName = oferta?.tutor?.nombreCompleto ?? '';
    const tutorAvatarUrl = oferta?.tutor?.fotoPerfil ?? null;
    const subjectName =
      (oferta as { titulo?: string; title?: string } | null)?.titulo ??
      oferta?.title ??
      '';

    return {
      id: solicitud.id,
      tutorName,
      tutorAvatarUrl,
      subjectName,
      date: horario ? `${horario.fecha}T${horario.hora}:00.000Z` : '',
      time: horario?.hora ?? '',
      modality: solicitud.modalidad ?? '',
      status,
    };
  }
}
