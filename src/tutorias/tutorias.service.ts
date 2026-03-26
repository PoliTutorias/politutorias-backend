import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  SolicitudEntity,
  SolicitudEstado,
} from '../solicitudes/entities/solicitud.entity';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { HistoryQueryParamsDto } from './dto/history-query-params.dto';
import { HistoryResponseDto } from './dto/history-response.dto';
import { HistorySummaryDto } from './dto/history-summary.dto';
import { TutorialDetailDto } from './dto/tutorial-detail.dto';
import { HistoryItemDto } from './dto/history-item.dto';

@Injectable()
export class TutoriasService {
  constructor(
    @InjectRepository(SolicitudEntity)
    private readonly solicitudRepository: Repository<SolicitudEntity>,
    @InjectRepository(Oferta)
    private readonly ofertaRepository: Repository<Oferta>,
  ) {}

  /**
   * Obtiene el resumen de métricas del tutor
   */
  async getSummary(tutorId: string): Promise<HistorySummaryDto> {
    // Total de tutorías completadas o aceptadas
    const totalCompleted = await this.solicitudRepository.count({
      where: {
        tutorId,
        estado: In([SolicitudEstado.COMPLETADA, SolicitudEstado.ACEPTADA]),
      },
    });

    // Total de materias únicas (DISTINCT oferta.titulo)
    const materias = await this.solicitudRepository
      .createQueryBuilder('s')
      .leftJoin('s.oferta', 'oferta')
      .select('DISTINCT oferta.titulo', 'materia')
      .where('s.tutorId = :tutorId', { tutorId })
      .andWhere('s.estado IN (:...estados)', {
        estados: [SolicitudEstado.COMPLETADA, SolicitudEstado.ACEPTADA],
      })
      .getRawMany();

    // Total de estudiantes únicos (DISTINCT estudianteId)
    const estudiantes = await this.solicitudRepository
      .createQueryBuilder('s')
      .select('DISTINCT s.estudianteId')
      .where('s.tutorId = :tutorId', { tutorId })
      .andWhere('s.estado IN (:...estados)', {
        estados: [SolicitudEstado.COMPLETADA, SolicitudEstado.ACEPTADA],
      })
      .getRawMany();

    return {
      totalCompleted,
      totalSubjects: materias.length,
      totalStudents: estudiantes.length,
    };
  }

  /**
   * Obtiene el historial paginado de tutorías impartidas
   */
  async getHistorial(
    tutorId: string,
    params: HistoryQueryParamsDto,
  ): Promise<HistoryResponseDto> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 5;
    const skip = (page - 1) * limit;

    // Obtener summary
    const summary = await this.getSummary(tutorId);

    // Filtrar solo tutorías completadas o aceptadas
    const where = {
      tutorId,
      estado: In([SolicitudEstado.COMPLETADA, SolicitudEstado.ACEPTADA]),
    };

    // Contar total
    const total = await this.solicitudRepository.count({ where });

    // Obtener solicitudes paginadas con relación a oferta
    const solicitudes = await this.solicitudRepository.find({
      where,
      relations: ['oferta'],
      order: {
        completedAt: 'DESC',
        acceptedAt: 'DESC',
      },
      skip,
      take: limit,
    });

    // Mapear a HistoryItemDto
    const items: HistoryItemDto[] = solicitudes.map((sol) => {
      // Extraer la primera fecha de horarios
      const primeraFecha = sol.horarios?.[0]?.fecha ?? '';

      return {
        id: sol.id,
        studentName: sol.nombreEstudiante ?? 'Estudiante',
        subjectName: sol.oferta?.titulo ?? 'Materia',
        date: primeraFecha,
        status:
          sol.estado === SolicitudEstado.COMPLETADA ? 'Completada' : 'Aceptada',
        pricePerHour: `$${sol.oferta?.precioHora ?? 0}/h`,
      };
    });

    // Calcular lastPage
    const lastPage = Math.ceil(total / limit);

    return {
      summary,
      paginatedData: {
        items,
        total,
        page,
        lastPage,
      },
    };
  }

  /**
   * Obtiene el detalle de una tutoría específica
   */
  async getDetalle(tutorId: string, id: string): Promise<TutorialDetailDto> {
    // Buscar la solicitud con relación a oferta
    const solicitud = await this.solicitudRepository.findOne({
      where: { id },
      relations: ['oferta'],
    });

    // Validar que existe
    if (!solicitud) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    // Validar ownership
    if (solicitud.tutorId !== tutorId) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    // Formatear fecha (ejemplo: "20 de mayo, 2024")
    const primeraFecha = solicitud.horarios?.[0]?.fecha ?? '';
    const formattedDate = this.formatDate(primeraFecha);

    // Formatear hora (ejemplo: "14:00 - 15:00")
    const primeraHora = solicitud.horarios?.[0]?.hora ?? '';
    const formattedTime = this.formatTime(primeraHora);

    return {
      id: solicitud.id,
      student: {
        name: solicitud.nombreEstudiante ?? 'Estudiante',
        avatar: null, // Por ahora null, requeriría JOIN con UserEntity
      },
      subject: solicitud.oferta?.titulo ?? 'Materia',
      date: formattedDate,
      time: formattedTime,
      modality: solicitud.modalidad ?? 'Virtual',
      meetingLink:
        solicitud.modalidad === 'Virtual'
          ? solicitud.acceptedMeetingLink
          : null,
      location:
        solicitud.modalidad === 'Presencial'
          ? solicitud.acceptedMeetingLocation
          : null,
      pricePerHour: `$${solicitud.oferta?.precioHora ?? 0}/h`,
      studentMessage: solicitud.mensaje,
    };
  }

  /**
   * Formatea una fecha en formato ISO a texto legible
   * Ejemplo: "2024-05-20" → "20 de mayo, 2024"
   */
  private formatDate(isoDate: string): string {
    if (!isoDate) return '';

    const meses = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];

    const [year, month, day] = isoDate.split('-');
    const monthIndex = parseInt(month, 10) - 1;

    return `${parseInt(day, 10)} de ${meses[monthIndex]}, ${year}`;
  }

  /**
   * Formatea una hora asumiendo 1 hora de duración
   * Ejemplo: "14:00" → "14:00 - 15:00"
   */
  private formatTime(hora: string): string {
    if (!hora) return '';

    const [hours, minutes] = hora.split(':');
    const startHour = parseInt(hours, 10);
    const endHour = startHour + 1;

    return `${hora} - ${endHour.toString().padStart(2, '0')}:${minutes}`;
  }
}
