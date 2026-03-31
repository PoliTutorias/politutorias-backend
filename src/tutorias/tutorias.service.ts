import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
    // Total de tutorías completadas, aceptadas o con inasistencia
    const totalCompleted = await this.solicitudRepository.count({
      where: {
        tutorId,
        estado: In([
          SolicitudEstado.COMPLETADA,
          SolicitudEstado.ACEPTADA,
          SolicitudEstado.NO_SHOW,
        ]),
      },
    });

    // Total de materias únicas (DISTINCT oferta.titulo)
    const materias = await this.solicitudRepository
      .createQueryBuilder('s')
      .leftJoin('s.oferta', 'oferta')
      .select('DISTINCT oferta.titulo', 'materia')
      .where('s.tutorId = :tutorId', { tutorId })
      .andWhere('s.estado IN (:...estados)', {
        estados: [
          SolicitudEstado.COMPLETADA,
          SolicitudEstado.ACEPTADA,
          SolicitudEstado.NO_SHOW,
        ],
      })
      .getRawMany();

    // Total de estudiantes únicos (DISTINCT estudianteId)
    const estudiantes = await this.solicitudRepository
      .createQueryBuilder('s')
      .select('DISTINCT s.estudianteId')
      .where('s.tutorId = :tutorId', { tutorId })
      .andWhere('s.estado IN (:...estados)', {
        estados: [
          SolicitudEstado.COMPLETADA,
          SolicitudEstado.ACEPTADA,
          SolicitudEstado.NO_SHOW,
        ],
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

    // Filtrar solo tutorías completadas, aceptadas o con inasistencia
    const where = {
      tutorId,
      estado: In([
        SolicitudEstado.COMPLETADA,
        SolicitudEstado.ACEPTADA,
        SolicitudEstado.NO_SHOW,
      ]),
    };

    // Contar total
    const total = await this.solicitudRepository.count({ where });

    // Obtener solicitudes paginadas con relación a oferta
    // Ordenar por el timestamp más reciente (completedAt, noShowAt, o acceptedAt)
    const solicitudes = await this.solicitudRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.oferta', 'oferta')
      .where('s.tutorId = :tutorId', { tutorId })
      .andWhere('s.estado IN (:...estados)', {
        estados: [
          SolicitudEstado.COMPLETADA,
          SolicitudEstado.ACEPTADA,
          SolicitudEstado.NO_SHOW,
        ],
      })
      .addOrderBy(
        'COALESCE(s."completedAt", s."noShowAt", s."acceptedAt")',
        'DESC',
      )
      .skip(skip)
      .take(limit)
      .getMany();

    // Mapear a HistoryItemDto
    const items: HistoryItemDto[] = solicitudes.map((sol) => {
      // Extraer la primera fecha y hora de horarios
      const primeraFecha = sol.horarios?.[0]?.fecha ?? '';
      const primeraHora = sol.horarios?.[0]?.hora ?? '';

      return {
        id: sol.id,
        studentName: sol.nombreEstudiante ?? 'Estudiante',
        subjectName: sol.oferta?.titulo ?? 'Materia',
        date: primeraFecha,
        time: primeraHora,
        status: this.mapEstadoToDto(sol.estado),
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

    const studentName = solicitud.nombreEstudiante ?? 'Estudiante';
    const studentAvatar = this.generateAvatarUrl(studentName);

    return {
      id: solicitud.id,
      student: {
        name: studentName,
        avatar: studentAvatar,
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
   * Reporta la inasistencia de un estudiante a una tutoría programada
   * Solo puede reportarse inasistencia para tutorías en estado ACEPTADA
   */
  async reportarInasistencia(
    tutoriaId: string,
    tutorId: string,
  ): Promise<SolicitudEntity> {
    // 1-3. Validar existencia y ownership
    const solicitud = await this.validarYObtenerSolicitud(tutoriaId, tutorId);

    // 4. Validar estado (solo ACEPTADA puede marcarse como NO_SHOW)
    if (solicitud.estado !== SolicitudEstado.ACEPTADA) {
      throw new BadRequestException(
        'Solo se puede reportar inasistencia para tutorías sin confirmar (ACEPTADA).',
      );
    }

    // 5. Actualizar estado y timestamp
    solicitud.estado = SolicitudEstado.NO_SHOW;
    solicitud.noShowAt = new Date();

    // 6. Persistir cambios
    return this.solicitudRepository.save(solicitud);
  }

  /**
   * Marca una tutoría como completada (HU-43)
   * Solo válido para tutorías en estado ACEPTADA
   */
  async marcarCompletada(
    id: string,
    tutorId: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: { id: string; status: string; updatedAt: string };
  }> {
    // 1-3. Validar existencia y ownership
    const solicitud = await this.validarYObtenerSolicitud(id, tutorId);

    // 4. Validar estado permitido
    if (solicitud.estado !== SolicitudEstado.ACEPTADA) {
      throw new BadRequestException(
        'Solo se pueden completar tutorías programadas',
      );
    }

    // 5. Actualizar estado y timestamp
    solicitud.estado = SolicitudEstado.COMPLETADA;
    solicitud.completedAt = new Date();

    // 6. Persistir
    const solicitudActualizada = await this.solicitudRepository.save(solicitud);

    // 7. Retornar con formato consistente
    return {
      success: true,
      message: 'Tutoría marcada como completada',
      data: {
        id: solicitudActualizada.id,
        status: 'completed',
        updatedAt: solicitudActualizada.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Valida la existencia de una solicitud y ownership del tutor
   * Helper privado para eliminar duplicación entre métodos
   */
  private async validarYObtenerSolicitud(
    id: string,
    tutorId: string,
  ): Promise<SolicitudEntity> {
    const solicitud = await this.solicitudRepository.findOne({
      where: { id },
      relations: ['oferta'],
    });

    if (!solicitud) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    if (solicitud.tutorId !== tutorId) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    return solicitud;
  }

  /**
   * Mapea el estado de la base de datos al formato esperado por el DTO
   */
  private mapEstadoToDto(estado: SolicitudEstado): string {
    switch (estado) {
      case SolicitudEstado.NO_SHOW:
        return 'INASISTENCIA';
      case SolicitudEstado.ACEPTADA:
        return 'SIN_CONFIRMAR';
      case SolicitudEstado.COMPLETADA:
        return 'Completada';
      default:
        return estado;
    }
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

  /**
   * Genera una URL de avatar usando UI Avatars (servicio público gratuito)
   * Crea avatares con las iniciales del nombre del estudiante
   *
   * @param name - Nombre completo del estudiante
   * @returns URL del avatar generado
   *
   * Ejemplo: "Juan Pérez" → https://ui-avatars.com/api/?name=Juan+Pérez&background=0D8ABC&color=fff&size=128
   *
   * UI Avatars: https://ui-avatars.com/
   * - background: Color de fondo (azul institucional)
   * - color: Color del texto (blanco)
   * - size: Tamaño en píxeles (128x128)
   * - bold: Texto en negrita
   * - rounded: Bordes redondeados
   */
  private generateAvatarUrl(name: string): string {
    if (!name || name === 'Estudiante') {
      // Avatar por defecto para nombres vacíos o genéricos
      return 'https://ui-avatars.com/api/?name=E&background=6c757d&color=fff&size=128&bold=true&rounded=true';
    }

    // Codificar el nombre para URL (espacios → +)
    const encodedName = encodeURIComponent(name).replace(/%20/g, '+');

    // UI Avatars automáticamente extrae las iniciales (ej: "Juan Pérez" → "JP")
    return `https://ui-avatars.com/api/?name=${encodedName}&background=0D8ABC&color=fff&size=128&bold=true&rounded=true`;
  }
}
