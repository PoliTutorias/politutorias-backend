import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SolicitudEntity,
  SolicitudEstado,
  RejectionReason,
} from './entities/solicitud.entity';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { VerificarPreviaDto } from './dto/verificar-previa.dto';
import { SolicitudResponseDto } from './dto/solicitud-response.dto';
import { VerificarPreviaResponseDto } from './dto/verificar-previa-response.dto';
import { GlobalCountsDto } from './dto/global-counts.dto';
import { FilterParamsDto } from './dto/filter-params.dto';
import { SolicitudDetailsResponseDto } from './dto/solicitud-details-response.dto';
import { PaginatedSolicitudesDto } from './dto/paginated-solicitudes.dto';
import { StudentFilterParamsDto } from './dto/student-filter-params.dto';
import { StudentSolicitudListItemDto } from './dto/student-solicitud-list-item.dto';
import { StudentSolicitudDetailDto } from './dto/student-solicitud-detail.dto';
import { PaginatedStudentSolicitudesDto } from './dto/paginated-student-solicitudes.dto';
import { RejectSolicitudDto } from './dto/reject-solicitud.dto';
import { AcceptSolicitudDto } from './dto/accept-solicitud.dto';

/** Valor de la columna `modality` que indica oferta dual */
const MODALITY_DUAL = 'VIRTUAL/PRESENCIAL';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(SolicitudEntity)
    private readonly solicitudRepository: Repository<SolicitudEntity>,
    @InjectRepository(Oferta)
    private readonly ofertaRepository: Repository<Oferta>,
  ) {}

  /**
   * Verifica si el estudiante ya tiene una solicitud PENDIENTE que solape
   * alguno de los horarios enviados para la misma oferta.
   */
  async verificarSolicitudPrevia(
    estudianteId: string,
    dto: VerificarPreviaDto,
  ): Promise<VerificarPreviaResponseDto> {
    // Buscar TODAS las solicitudes pendientes del estudiante para esta oferta
    const solicitudesExistentes = await this.solicitudRepository.find({
      where: {
        estudianteId,
        ofertaId: dto.ofertaId,
        estado: SolicitudEstado.PENDIENTE,
      },
    });

    // Verificar solapamiento contra TODAS las solicitudes existentes
    for (const solicitud of solicitudesExistentes) {
      const hayColision = dto.horarios.some((h) =>
        solicitud.horarios.some(
          (he) => he.fecha === h.fecha && he.hora === h.hora,
        ),
      );

      if (hayColision) {
        return {
          existe: true,
          mensaje:
            'Horario ya solicitado. Ya tienes una solicitud activa para este bloque.',
        };
      }
    }

    return { existe: false, mensaje: null };
  }

  /**
   * Crea una nueva solicitud de tutoría.
   *
   * Reglas de negocio:
   * 1. La oferta debe existir.
   * 2. Si la oferta es dual (VIRTUAL/PRESENCIAL), el DTO debe incluir modalidad.
   * 3. Si la oferta es única, la modalidad se asigna automáticamente desde la oferta.
   * 4. No puede haber ya una solicitud PENDIENTE del mismo estudiante para la misma oferta con el mismo horario.
   */
  async create(
    estudianteId: string,
    dto: CreateSolicitudDto,
    nombreEstudiante?: string,
  ): Promise<SolicitudResponseDto> {
    // 1. Verificar que la oferta existe
    const oferta = await this.ofertaRepository.findOne({
      where: { id: dto.ofertaId },
    });

    if (!oferta) {
      throw new NotFoundException(
        `Oferta con id '${dto.ofertaId}' no encontrada`,
      );
    }

    // 2. Resolver modalidad
    const ofertaModality = String(oferta.modalidad || oferta.modality || '');
    const isDual = ofertaModality === MODALITY_DUAL;
    let modalidadFinal: string;

    if (isDual) {
      if (!dto.modalidad) {
        throw new BadRequestException(
          'La oferta tiene modalidad dual. Debes seleccionar una modalidad (Virtual o Presencial).',
        );
      }
      modalidadFinal = dto.modalidad;
    } else {
      // Modalidad única: asignar automáticamente desde la oferta
      modalidadFinal = ofertaModality;
    }

    // 3. Verificar duplicados PENDIENTES con horario solapado — buscar TODAS
    const solicitudesDuplicadas = await this.solicitudRepository.find({
      where: {
        estudianteId,
        ofertaId: dto.ofertaId,
        estado: SolicitudEstado.PENDIENTE,
      },
    });

    for (const solicitud of solicitudesDuplicadas) {
      const hayColision = dto.horarios.some((h) =>
        solicitud.horarios.some(
          (he) => he.fecha === h.fecha && he.hora === h.hora,
        ),
      );
      if (hayColision) {
        throw new BadRequestException(
          'Ya tienes una solicitud pendiente con ese horario para esta oferta.',
        );
      }
    }

    // 4. Crear y persistir la solicitud
    const nuevaSolicitud = this.solicitudRepository.create({
      estudianteId,
      ofertaId: dto.ofertaId,
      tutorId: oferta.tutorId,
      nombreEstudiante: nombreEstudiante || null,
      mensaje: dto.mensaje,
      modalidad: modalidadFinal,
      horarios: dto.horarios,
      estado: SolicitudEstado.PENDIENTE,
    });

    const saved = await this.solicitudRepository.save(nuevaSolicitud);

    return {
      id: saved.id,
      estudianteId: saved.estudianteId,
      ofertaId: saved.ofertaId,
      tutorId: saved.tutorId,
      mensaje: saved.mensaje,
      modalidad: saved.modalidad,
      horarios: saved.horarios,
      estado: saved.estado,
      createdAt: saved.createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  /**
   * HU09 — Retorna los conteos de solicitudes por estado para un tutor.
   */
  async getCountsByStatus(tutorId: string): Promise<GlobalCountsDto> {
    const [pending, expired, aceptada, rechazada] = await Promise.all([
      this.solicitudRepository.count({
        where: { tutorId, estado: SolicitudEstado.PENDIENTE },
      }),
      this.solicitudRepository.count({
        where: { tutorId, estado: SolicitudEstado.EXPIRADA },
      }),
      this.solicitudRepository.count({
        where: { tutorId, estado: SolicitudEstado.ACEPTADA },
      }),
      this.solicitudRepository.count({
        where: { tutorId, estado: SolicitudEstado.RECHAZADA },
      }),
    ]);
    return { pending, expired, responded: aceptada + rechazada };
  }

  /**
   * HU09 — Retorna la lista paginada de solicitudes recibidas por un tutor,
   * con filtros opcionales por estado.
   */
  async getFiltered(
    tutorId: string,
    params: FilterParamsDto,
  ): Promise<PaginatedSolicitudesDto> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.solicitudRepository
      .createQueryBuilder('solicitud')
      .leftJoinAndSelect('solicitud.oferta', 'oferta')
      .where('solicitud.tutorId = :tutorId', { tutorId })
      .orderBy('solicitud.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (params.status) {
      if (params.status === 'RESPONDIDA') {
        qb.andWhere('solicitud.estado IN (:...estados)', {
          estados: [SolicitudEstado.ACEPTADA, SolicitudEstado.RECHAZADA],
        });
      } else {
        qb.andWhere('solicitud.estado = :estado', { estado: params.status });
      }
    }

    const [entities, total] = await qb.getManyAndCount();

    const data: SolicitudDetailsResponseDto[] = entities.map((s) => {
      const oferta = (s as SolicitudEntity & { oferta?: Oferta }).oferta;
      const precio = Number(oferta?.price ?? oferta?.precioHora ?? 0);
      const materia = oferta?.titulo ?? oferta?.title ?? '';
      return {
        id: s.id,
        nombreEstudiante: s.nombreEstudiante ?? '',
        materia,
        fechaHora: s.createdAt
          ? s.createdAt.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
        mensajeResumen:
          s.mensaje.length > 50
            ? s.mensaje.substring(0, 50) + '...'
            : s.mensaje,
        estado: s.estado,
        modalidad: s.modalidad ?? '',
        precioHora: precio,
        mensajeCompleto: s.mensaje,
      };
    });

    return {
      data,
      total,
      currentPage: page,
      itemsPerPage: limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  /**
   * HU-33: Lista solicitudes enviadas por el estudiante (Student Perspective)
   * Retorna solicitudes filtradas por estudianteId con información del tutor
   */
  async findAllForStudent(
    estudianteId: string,
    params: StudentFilterParamsDto,
  ): Promise<PaginatedStudentSolicitudesDto> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 5; // Default 5 para estudiantes (PRD)
    const skip = (page - 1) * limit;

    const qb = this.solicitudRepository
      .createQueryBuilder('solicitud')
      .leftJoinAndSelect('solicitud.oferta', 'oferta')
      .leftJoinAndSelect('oferta.tutor', 'tutor')
      .where('solicitud.estudianteId = :estudianteId', { estudianteId })
      .orderBy('solicitud.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Filtro de estado
    if (params.status === 'RESPONDIDA') {
      // RESPONDIDA = ACEPTADA + RECHAZADA (out of scope for HU-33, will return empty)
      qb.andWhere('solicitud.estado IN (:...estados)', {
        estados: [SolicitudEstado.ACEPTADA, SolicitudEstado.RECHAZADA],
      });
    } else if (params.status && params.status !== 'TODAS') {
      // PENDIENTE, EXPIRADA, etc.
      qb.andWhere('solicitud.estado = :estado', { estado: params.status });
    }
    // If status=TODAS, no filter applied

    const [entities, total] = await qb.getManyAndCount();

    const data: StudentSolicitudListItemDto[] = entities.map((s) => {
      const oferta = (s as SolicitudEntity & { oferta?: Oferta }).oferta;
      const tutor = oferta?.tutor;
      const precio = Number(oferta?.price ?? oferta?.precioHora ?? 0);

      return {
        id: s.id,
        tutorName: tutor?.nombreCompleto ?? 'N/A',
        tutorAvatarUrl: tutor?.fotoPerfil ?? null,
        subject: oferta?.titulo ?? oferta?.title ?? '',
        date: s.createdAt
          ? s.createdAt.toISOString()
          : new Date().toISOString(),
        modality: s.modalidad ?? '',
        pricePerHour: precio,
        status: s.estado,
      };
    });

    return {
      data,
      total,
      currentPage: page,
      itemsPerPage: limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  /**
   * HU-33: Obtiene detalle de una solicitud para el estudiante
   * Valida que la solicitud pertenezca al estudiante autenticado
   */
  async findByIdForStudent(
    estudianteId: string,
    solicitudId: string,
  ): Promise<StudentSolicitudDetailDto> {
    const qb = this.solicitudRepository
      .createQueryBuilder('solicitud')
      .leftJoinAndSelect('solicitud.oferta', 'oferta')
      .leftJoinAndSelect('oferta.tutor', 'tutor')
      .where('solicitud.id = :solicitudId', { solicitudId });

    const solicitud = await qb.getOne();

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    // Authorization check
    if (solicitud.estudianteId !== estudianteId) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    const oferta = (solicitud as SolicitudEntity & { oferta?: Oferta }).oferta;
    const tutor = oferta?.tutor;
    const precio = Number(oferta?.price ?? oferta?.precioHora ?? 0);

    return {
      id: solicitud.id,
      tutorName: tutor?.nombreCompleto ?? 'N/A',
      tutorAvatarUrl: tutor?.fotoPerfil ?? null,
      subject: oferta?.titulo ?? oferta?.title ?? '',
      date: solicitud.createdAt
        ? solicitud.createdAt.toISOString()
        : new Date().toISOString(),
      modality: solicitud.modalidad ?? '',
      pricePerHour: precio,
      status: solicitud.estado,
      mensaje: solicitud.mensaje,
      horarios: solicitud.horarios,
      // NOTE: Conditional fields (acceptedMeetingLink, rejectionReason) removed - out of scope for HU-33
    };
  }

  /**
   * HU-23: Rechazar solicitud de tutoría.
   *
   * Reglas de negocio:
   * 1. La solicitud debe existir.
   * 2. Solo el tutor propietario puede rechazarla.
   * 3. Solo solicitudes en estado PENDIENTE pueden ser rechazadas.
   * 4. Si el motivo NO es OTRO, el comentario se fuerza a null.
   */
  async rejectSolicitud(
    solicitudId: string,
    dto: RejectSolicitudDto,
    tutorId: string,
  ): Promise<SolicitudEntity> {
    // 1. Buscar solicitud
    const solicitud = await this.solicitudRepository.findOne({
      where: { id: solicitudId },
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    // 2. Validar propiedad
    if (solicitud.tutorId !== tutorId) {
      throw new ForbiddenException(
        'No tienes permiso para rechazar esta solicitud',
      );
    }

    // 3. Validar estado
    if (solicitud.estado !== SolicitudEstado.PENDIENTE) {
      throw new BadRequestException(
        'Solo se pueden rechazar solicitudes en estado PENDIENTE',
      );
    }

    // 4. Lógica de comentario: solo guardar si reason === OTRO
    const finalComment =
      dto.reason === RejectionReason.OTRO ? dto.comment : null;

    // 5. Actualizar solicitud
    solicitud.estado = SolicitudEstado.RECHAZADA;
    solicitud.rejectionReason = dto.reason;
    solicitud.rejectionComment = finalComment ?? null;
    solicitud.respondedAt = new Date();

    return this.solicitudRepository.save(solicitud);
  }

  /**
   * HU-08: Aceptar solicitud de tutoría.
   *
   * Reglas de negocio:
   * 1. La solicitud debe existir (NotFoundException)
   * 2. Solo el tutor propietario puede aceptarla (ForbiddenException)
   * 3. Solo solicitudes en estado PENDIENTE pueden aceptarse (BadRequestException)
   * 4. Modalidad debe coincidir con la solicitada por el estudiante (BadRequestException)
   * 5. Link/location se setea según modalidad y el otro campo se limpia (null)
   */
  async acceptSolicitud(
    solicitudId: string,
    dto: AcceptSolicitudDto,
    tutorId: string,
  ): Promise<SolicitudEntity> {
    // 1. Buscar solicitud
    const solicitud = await this.solicitudRepository.findOne({
      where: { id: solicitudId },
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    // 2. Validar propiedad
    if (solicitud.tutorId !== tutorId) {
      throw new ForbiddenException(
        'No tienes permiso para aceptar esta solicitud',
      );
    }

    // 3. Validar estado
    if (solicitud.estado !== SolicitudEstado.PENDIENTE) {
      throw new BadRequestException(
        'Solo se pueden aceptar solicitudes en estado PENDIENTE',
      );
    }

    // 4. Validar modalidad coincide
    if (solicitud.modalidad && dto.modalidad !== solicitud.modalidad) {
      throw new BadRequestException(
        `La modalidad debe ser '${solicitud.modalidad}'. La solicitud fue para '${dto.modalidad}'.`,
      );
    }

    // 5. Actualizar solicitud
    solicitud.estado = SolicitudEstado.ACEPTADA;
    solicitud.acceptedAt = new Date();

    // Setear campos según modalidad y limpiar el otro
    const modalidadStr = String(dto.modalidad);
    const isVirtual = modalidadStr === 'Virtual';
    if (isVirtual) {
      solicitud.acceptedMeetingLink = dto.acceptedMeetingLink ?? null;
      solicitud.acceptedMeetingLocation = null;
    } else {
      solicitud.acceptedMeetingLocation = dto.acceptedMeetingLocation ?? null;
      solicitud.acceptedMeetingLink = null;
    }

    return this.solicitudRepository.save(solicitud);
  }
}
