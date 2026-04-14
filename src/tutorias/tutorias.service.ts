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
import { Tutor } from '../tutors/entities/tutor.entity';
import { ReviewEntity } from './entities/review.entity';
import { HistoryQueryParamsDto } from './dto/history-query-params.dto';
import { HistoryResponseDto } from './dto/history-response.dto';
import { HistorySummaryDto } from './dto/history-summary.dto';
import { TutorialDetailDto } from './dto/tutorial-detail.dto';
import { HistoryItemDto } from './dto/history-item.dto';
import { HistorialEstudianteQueryDto } from './dto/historial-estudiante-query.dto';
import { HistorialEstudianteResponseDto } from './dto/historial-estudiante-response.dto';
import { HistorialEstudianteItemDto } from './dto/historial-estudiante-item.dto';
import { TutoriaDetalleEstudianteDto } from './dto/tutoria-detalle-estudiante.dto';

@Injectable()
export class TutoriasService {
  constructor(
    @InjectRepository(SolicitudEntity)
    private readonly solicitudRepository: Repository<SolicitudEntity>,
    @InjectRepository(Oferta)
    private readonly ofertaRepository: Repository<Oferta>,
    @InjectRepository(Tutor)
    private readonly tutorRepository: Repository<Tutor>,
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
  ) {}

  /**
   * Determina si una solicitud ACEPTADA ya finalizó su hora reservada
   * (fecha + hora + 1h <= ahora). Reutiliza getEndDateTimeFromBlock.
   */
  private isTutoriaFinalizada(solicitud: SolicitudEntity): boolean {
    const bloque = solicitud.horarios?.[0];
    if (!bloque?.fecha || !bloque?.hora) return false;
    const endDateTime = this.getEndDateTimeFromBlock(bloque.fecha, bloque.hora);
    if (Number.isNaN(endDateTime.getTime())) return false;
    return new Date().getTime() >= endDateTime.getTime();
  }

  /**
   * Obtiene el resumen de métricas del tutor
   * Para ACEPTADAS, solo cuenta las que ya finalizaron su hora reservada.
   */
  async getSummary(tutorId: string): Promise<HistorySummaryDto> {
    // Total de tutorías COMPLETADA y NO_SHOW (ya confirmadas)
    const confirmedCount = await this.solicitudRepository.count({
      where: {
        tutorId,
        estado: In([
          SolicitudEstado.COMPLETADA,
          SolicitudEstado.NO_SHOW,
        ]),
      },
    });

    // Para ACEPTADAS, necesitamos filtrar en memoria las que ya finalizaron
    const aceptadas = await this.solicitudRepository.find({
      where: { tutorId, estado: SolicitudEstado.ACEPTADA },
    });
    const aceptadasFinalizadas = aceptadas.filter((s) =>
      this.isTutoriaFinalizada(s),
    );

    const totalCompleted = confirmedCount + aceptadasFinalizadas.length;

    // Total de materias únicas (DISTINCT oferta.titulo)
    // Incluir COMPLETADA, NO_SHOW, y ACEPTADAS finalizadas
    const allCompletedAndNoShow = await this.solicitudRepository
      .createQueryBuilder('s')
      .leftJoin('s.oferta', 'oferta')
      .select('DISTINCT oferta.titulo', 'materia')
      .where('s.tutorId = :tutorId', { tutorId })
      .andWhere('s.estado IN (:...estados)', {
        estados: [
          SolicitudEstado.COMPLETADA,
          SolicitudEstado.NO_SHOW,
        ],
      })
      .getRawMany();

    // Agregar materias de aceptadas finalizadas (sin duplicar)
    const materiasSet = new Set<string>(
      allCompletedAndNoShow.map((r) => r.materia).filter(Boolean),
    );
    for (const sol of aceptadasFinalizadas) {
      const oferta = await this.ofertaRepository.findOne({
        where: { id: sol.ofertaId },
      });
      if (oferta?.titulo) materiasSet.add(oferta.titulo);
    }

    // Total de estudiantes únicos (DISTINCT estudianteId)
    const estudiantesConfirmed = await this.solicitudRepository
      .createQueryBuilder('s')
      .select('DISTINCT s.estudianteId', 'estudianteId')
      .where('s.tutorId = :tutorId', { tutorId })
      .andWhere('s.estado IN (:...estados)', {
        estados: [
          SolicitudEstado.COMPLETADA,
          SolicitudEstado.NO_SHOW,
        ],
      })
      .getRawMany();

    const estudiantesSet = new Set<string>(
      estudiantesConfirmed.map((r) => r.estudianteId).filter(Boolean),
    );
    for (const sol of aceptadasFinalizadas) {
      if (sol.estudianteId) estudiantesSet.add(sol.estudianteId);
    }

    return {
      totalCompleted,
      totalSubjects: materiasSet.size,
      totalStudents: estudiantesSet.size,
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

    // Obtener summary
    const summary = await this.getSummary(tutorId);

    // Obtener TODAS las solicitudes COMPLETADA, ACEPTADA y NO_SHOW
    // Luego filtraremos las ACEPTADAS que aún no han finalizado
    const allSolicitudes = await this.solicitudRepository
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
      .addOrderBy('s.completedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('s.noShowAt', 'DESC', 'NULLS LAST')
      .addOrderBy('s.acceptedAt', 'DESC', 'NULLS LAST')
      .getMany();

    // Filtrar: para ACEPTADAS, solo incluir las que ya finalizaron su hora
    const filtered = allSolicitudes.filter((sol) => {
      if (sol.estado === SolicitudEstado.ACEPTADA) {
        return this.isTutoriaFinalizada(sol);
      }
      return true; // COMPLETADA y NO_SHOW siempre se muestran
    });

    const total = filtered.length;

    // Paginar manualmente
    const skip = (page - 1) * limit;
    const solicitudes = filtered.slice(skip, skip + limit);

    // Mapear a HistoryItemDto (con comparación case-insensitive de modalidad)
    const items: HistoryItemDto[] = solicitudes.map((sol) => {
      const primeraFecha = sol.horarios?.[0]?.fecha ?? '';
      const primeraHora = sol.horarios?.[0]?.hora ?? '';
      const modalidadUpper = (sol.modalidad ?? '').toUpperCase();

      return {
        id: sol.id,
        studentName: sol.nombreEstudiante ?? 'Estudiante',
        subjectName: sol.oferta?.titulo ?? 'Materia',
        date: primeraFecha,
        time: primeraHora,
        status: this.mapEstadoToDto(sol.estado),
        pricePerHour: `$${sol.oferta?.precioHora ?? 0}/h`,
        location:
          modalidadUpper === 'PRESENCIAL'
            ? sol.acceptedMeetingLocation
            : null,
      };
    });

    const lastPage = Math.ceil(total / limit) || 1;

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

    // Comparación case-insensitive de modalidad (Fix: #2)
    const modalidadUpper = (solicitud.modalidad ?? '').toUpperCase();

    // Cargar review si existe (Fix: #3 - Reseña del estudiante)
    const review = await this.reviewRepository.findOne({
      where: { solicitudId: id },
    });

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
        modalidadUpper === 'VIRTUAL'
          ? solicitud.acceptedMeetingLink
          : null,
      location:
        modalidadUpper === 'PRESENCIAL'
          ? solicitud.acceptedMeetingLocation
          : null,
      pricePerHour: `$${solicitud.oferta?.precioHora ?? 0}/h`,
      studentMessage: solicitud.mensaje,
      status: this.mapEstadoToDto(solicitud.estado),
      calificacionEstudiante: review ? review.rating : null,
      comentarioEstudiante: review ? review.comment : null,
      resenaFecha: review ? review.createdAt.toISOString() : null,
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

    this.validarTutoriaFinalizada(
      solicitud,
      'Solo se puede reportar inasistencia cuando haya finalizado la hora reservada.',
    );

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

    this.validarTutoriaFinalizada(
      solicitud,
      'Solo se puede marcar como completada cuando haya finalizado la hora reservada.',
    );

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

  private validarTutoriaFinalizada(
    solicitud: SolicitudEntity,
    errorMessage: string,
  ): void {
    const bloque = solicitud.horarios?.[0];

    if (!bloque?.fecha || !bloque?.hora) {
      throw new BadRequestException(
        'La tutoría no tiene un horario válido para registrar esta acción.',
      );
    }

    const endDateTime = this.getEndDateTimeFromBlock(bloque.fecha, bloque.hora);

    if (Number.isNaN(endDateTime.getTime())) {
      throw new BadRequestException(
        'La tutoría no tiene un horario válido para registrar esta acción.',
      );
    }

    if (new Date().getTime() < endDateTime.getTime()) {
      throw new BadRequestException(errorMessage);
    }
  }

  private getEndDateTimeFromBlock(fecha: string, hora: string): Date {
    const [year, month, day] = fecha
      .split('-')
      .map((value) => parseInt(value, 10));
    const [hours, minutes] = hora
      .split(':')
      .map((value) => parseInt(value, 10));

    if (
      [year, month, day, hours, minutes].some((value) => Number.isNaN(value))
    ) {
      return new Date(Number.NaN);
    }

    return new Date(year, month - 1, day, hours + 1, minutes, 0, 0);
  }

  /**
   * HU-40: Obtiene el historial paginado del estudiante
   * Solo muestra tutorías COMPLETADA y NO_SHOW
   */
  async findHistorialByStudent(
    studentId: string,
    params: HistorialEstudianteQueryDto,
  ): Promise<HistorialEstudianteResponseDto> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 5;
    const skip = (page - 1) * limit;

    const estados = [SolicitudEstado.COMPLETADA, SolicitudEstado.NO_SHOW];

    // Contar total
    const total = await this.solicitudRepository.count({
      where: { estudianteId: studentId, estado: In(estados) },
    });

    // QueryBuilder con join a oferta y oferta.tutor
    const solicitudes = await this.solicitudRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.oferta', 'oferta')
      .leftJoinAndSelect('oferta.tutor', 'tutor')
      .where('s.estudianteId = :studentId', { studentId })
      .andWhere('s.estado IN (:...estados)', { estados })
      .addOrderBy('s.completedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('s.noShowAt', 'DESC', 'NULLS LAST')
      .skip(skip)
      .take(limit)
      .getMany();

    const items: HistorialEstudianteItemDto[] = solicitudes.map((sol) => {
      const primeraFecha = sol.horarios?.[0]?.fecha ?? '';
      const primeraHora = sol.horarios?.[0]?.hora ?? '';
      const modalidadUpper = (sol.modalidad ?? '').toUpperCase();

      return {
        id: sol.id,
        tutorName: sol.oferta?.tutor?.nombreCompleto ?? 'Tutor',
        subjectName: sol.oferta?.titulo ?? 'Materia',
        date: primeraFecha,
        time: primeraHora,
        status: this.mapEstadoToDto(sol.estado),
        pricePerHour: `$${sol.oferta?.precioHora ?? 0}/h`,
        location:
          modalidadUpper === 'PRESENCIAL' ? sol.acceptedMeetingLocation : null,
        resena: null,
      };
    });

    // Batch-load reviews for all solicitudes in one query
    const solicitudIds = solicitudes.map((s) => s.id);
    if (solicitudIds.length > 0) {
      const reviews = await this.reviewRepository.find({
        where: { solicitudId: In(solicitudIds) },
      });
      const reviewBySolicitudId = new Map(
        reviews.map((r) => [r.solicitudId, r]),
      );
      items.forEach((item) => {
        const review = reviewBySolicitudId.get(item.id);
        if (review) {
          item.resena = {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt.toISOString(),
          };
        }
      });
    }

    const lastPage = Math.ceil(total / limit) || 1;

    return {
      paginatedData: { items, total, page, lastPage },
    };
  }

  /**
   * HU-40: Detalle de una tutoría para el estudiante
   * Carga relaciones Review, Tutor y valida propiedad
   */
  async findOneTutoriaDetalle(
    studentId: string,
    id: string,
  ): Promise<TutoriaDetalleEstudianteDto> {
    const solicitud = await this.solicitudRepository.findOne({
      where: { id },
      relations: ['oferta', 'oferta.tutor'],
    });

    if (!solicitud) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    if (solicitud.estudianteId !== studentId) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    // Cargar review si existe
    const review = await this.reviewRepository.findOne({
      where: { solicitudId: id },
    });

    const tutorName = solicitud.oferta?.tutor?.nombreCompleto ?? 'Tutor';
    const tutorAvatar = this.generateAvatarUrl(tutorName);

    const primeraFecha = solicitud.horarios?.[0]?.fecha ?? '';
    const formattedDate = this.formatDate(primeraFecha);
    const primeraHora = solicitud.horarios?.[0]?.hora ?? '';
    const formattedTime = this.formatTime(primeraHora);

    return {
      id: solicitud.id,
      tutor: { name: tutorName, avatar: tutorAvatar },
      subject: solicitud.oferta?.titulo ?? 'Materia',
      date: formattedDate,
      time: formattedTime,
      modality: solicitud.modalidad ?? 'Virtual',
      meetingLink:
        (solicitud.modalidad ?? '').toUpperCase() === 'VIRTUAL'
          ? solicitud.acceptedMeetingLink
          : null,
      location:
        (solicitud.modalidad ?? '').toUpperCase() === 'PRESENCIAL'
          ? solicitud.acceptedMeetingLocation
          : null,
      pricePerHour: `$${solicitud.oferta?.precioHora ?? 0}/h`,
      studentMessage: solicitud.mensaje,
      status: this.mapEstadoToDto(solicitud.estado),
      resena: review
        ? {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt.toISOString(),
          }
        : null,
    };
  }

  async findOneForReview(id: string): Promise<SolicitudEntity | null> {
    return this.solicitudRepository.findOne({ where: { id } });
  }

  async linkReviewToTutorial(id: string, reviewId: string): Promise<void> {
    await this.solicitudRepository.update({ id }, { reviewId });
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
