import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvailabilityEntity } from '../../../disponibilidad/entities/availability.entity';
import { ExperienciaEntity } from '../../../experiencias/entities/experiencia.entity';
import { MateriaEntity } from '../../../materias/entities/materia.entity';
import { Tutor } from '../../../tutors/entities/tutor.entity';
import { Oferta } from '../../domain/entities/oferta.entity';
import {
  DisponibilidadItemDto,
  ExperienciaTutorDto,
  MateriaTutorDto,
  OfertaDetalleResponseDto,
  TutorDetalleDto,
} from '../../dto/oferta-detalle-response.dto';

/**
 * Use case HU-32: Obtener el detalle completo de una oferta de tutoría.
 *
 * Retorna los datos de la oferta junto con los datos del tutor asociado,
 * su disponibilidad semanal, experiencias y materias dominadas.
 *
 * Reglas de negocio aplicadas:
 * - RN-02: Lanza NotFoundException si el ID no corresponde a ninguna oferta.
 * - RN-03: No requiere autenticación (responsabilidad del controller).
 * - RN-04: Retorna datos del tutor aunque el frontend los descarte en la vista.
 * - RN-05: price se retorna como number con 2 decimales.
 * - RN-06: Horarios en formato HH:MM (ya almacenados así en la BD).
 */
@Injectable()
export class GetOfertaByIdUseCase {
  constructor(
    @InjectRepository(Oferta)
    private readonly ofertaRepository: Repository<Oferta>,

    @InjectRepository(Tutor)
    private readonly tutorRepository: Repository<Tutor>,

    @InjectRepository(AvailabilityEntity)
    private readonly availabilityRepository: Repository<AvailabilityEntity>,

    @InjectRepository(ExperienciaEntity)
    private readonly experienciaRepository: Repository<ExperienciaEntity>,

    @InjectRepository(MateriaEntity)
    private readonly materiaRepository: Repository<MateriaEntity>,
  ) {}

  /**
   * Ejecuta el caso de uso.
   *
   * @param id - UUID de la oferta a consultar.
   * @returns OfertaDetalleResponseDto con todos los datos del detalle.
   * @throws NotFoundException si la oferta no existe (RN-02).
   */
  async execute(id: string): Promise<OfertaDetalleResponseDto> {
    // 1. Obtener la oferta por ID
    const oferta = await this.ofertaRepository.findOne({ where: { id } });

    if (!oferta) {
      throw new NotFoundException(`Oferta con id ${id} no encontrada`);
    }

    const tutorId = oferta.tutorId;

    // 2. Cargar datos relacionados en paralelo (RN-04: datos del tutor siempre incluidos)
    const [tutor, availability, experiencias, materias] = await Promise.all([
      tutorId
        ? this.tutorRepository.findOne({ where: { id: tutorId } })
        : Promise.resolve(null),
      tutorId
        ? this.availabilityRepository.find({
            where: { tutorId },
            order: { day: 'ASC', hour: 'ASC' },
          })
        : Promise.resolve([]),
      tutorId
        ? this.experienciaRepository.find({ where: { tutorId } })
        : Promise.resolve([]),
      tutorId
        ? this.materiaRepository.find({ where: { tutorId } })
        : Promise.resolve([]),
    ]);

    // 3. Mapear a DTO de respuesta
    return this.mapToDto(oferta, tutor, availability, experiencias, materias);
  }

  /**
   * Mapea las entidades al DTO de respuesta.
   * Aplica conversiones de tipo (DECIMAL→number) y formatos requeridos.
   */
  private mapToDto(
    oferta: Oferta,
    tutor: Tutor | null,
    availability: AvailabilityEntity[],
    experiencias: ExperienciaEntity[],
    materias: MateriaEntity[],
  ): OfertaDetalleResponseDto {
    const mappedAvailability: DisponibilidadItemDto[] = availability.map(
      (a) => ({
        day: a.day,
        hour: a.hour,
      }),
    );

    const mappedExperiencias: ExperienciaTutorDto[] = experiencias.map((e) => ({
      id: e.id,
      puesto: e.puesto,
      institucion: e.institucion,
      fechaInicio: e.fechaInicio,
      fechaFin: e.fechaFin ?? null,
    }));

    const mappedMaterias: MateriaTutorDto[] = materias.map((m) => ({
      id: m.id,
      nombre: m.nombre,
    }));

    const mappedTutor: TutorDetalleDto | null = tutor
      ? {
          id: tutor.id,
          nombreCompleto: tutor.nombreCompleto,
          fotoPerfil: tutor.fotoPerfil,
          semestreActual: tutor.semestreActual,
          calificacionPromedio: tutor.calificacionPromedio ?? 0,
          numResenas: tutor.numResenas ?? 0,
          biografiaCorta: tutor.biografiaCorta,
          numeroWhatsapp: tutor.numeroWhatsapp,
          experiencias: mappedExperiencias,
          materias: mappedMaterias,
        }
      : null;

    return {
      id: oferta.id,
      title: oferta.title,
      modality: oferta.modality,
      description: oferta.description,
      categories: oferta.categories,
      // RN-05: TypeORM retorna DECIMAL como string en PostgreSQL
      price: parseFloat(Number(oferta.price).toFixed(2)),
      rating: parseFloat(Number(oferta.rating).toFixed(2)),
      reviewsCount: oferta.reviewsCount,
      availability: mappedAvailability,
      tutor: mappedTutor,
    };
  }
}
