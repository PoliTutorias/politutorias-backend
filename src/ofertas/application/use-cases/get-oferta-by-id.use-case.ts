import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AvailabilityEntity } from '../../../disponibilidad/entities/availability.entity';
import { ExperienciaEntity } from '../../../experiencias/entities/experiencia.entity';
import { MateriaEntity } from '../../../materias/entities/materia.entity';
import { PerfilProfesionalEntity } from '../../../perfil/entities/perfil-profesional.entity';
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

    @InjectRepository(PerfilProfesionalEntity)
    private readonly perfilRepository: Repository<PerfilProfesionalEntity>,
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

    // 2. Buscar el tutor primero para obtener userId
    const tutor = tutorId
      ? await this.tutorRepository.findOne({ where: { id: tutorId } })
      : null;

    // Construir lista de IDs de búsqueda: UUID del tutor + userId (JWT sub)
    // Esto cubre tanto datos de seed (guardados con UUID) como datos de
    // registro (guardados con userId del JWT por los controladores protegidos)
    const lookupIds: string[] = [];
    if (tutorId) lookupIds.push(tutorId);
    if (tutor?.userId && tutor.userId !== tutorId) {
      lookupIds.push(tutor.userId);
    }

    // 3. Cargar datos relacionados en paralelo usando ambos IDs
    const [availability, experiencias, materiasFromTable, perfilProfesional] =
      lookupIds.length > 0
        ? await Promise.all([
            this.availabilityRepository.find({
              where: { tutorId: In(lookupIds) },
              order: { day: 'ASC', hour: 'ASC' },
            }),
            this.experienciaRepository.find({
              where: { tutorId: In(lookupIds) },
            }),
            this.materiaRepository.find({
              where: { tutorId: In(lookupIds) },
            }),
            this.perfilRepository.findOne({
              where: { tutorId: In(lookupIds) },
            }),
          ])
        : [[], [], [], null];

    // 4. Combinar materias de ambas fuentes (tabla tutor_materias + perfil profesional)
    const materias = this.combineMaterias(materiasFromTable, perfilProfesional);

    // 5. Mapear a DTO de respuesta
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

  /**
   * Combina materias de la tabla tutor_materias (seed) con las del
   * perfil profesional (registro HU42). Elimina duplicados por nombre.
   */
  private combineMaterias(
    materiasFromTable: MateriaEntity[],
    perfilProfesional: PerfilProfesionalEntity | null,
  ): MateriaEntity[] {
    if (!perfilProfesional?.materias?.length) {
      return materiasFromTable;
    }

    const existingNames = new Set(
      materiasFromTable.map((m) => m.nombre.toLowerCase()),
    );

    const fromPerfil: MateriaEntity[] = perfilProfesional.materias
      .filter((nombre) => !existingNames.has(nombre.toLowerCase()))
      .map((nombre) => {
        const m = new MateriaEntity();
        m.id = `perfil-${nombre}`;
        m.tutorId = perfilProfesional.tutorId;
        m.nombre = nombre;
        return m;
      });

    return [...materiasFromTable, ...fromPerfil];
  }
}
