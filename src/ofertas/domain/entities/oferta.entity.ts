import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Tutor } from '../../../tutors/entities/tutor.entity';
import { CreateOfertaDto } from '../../dto/create-oferta.dto';

/**
 * Enum de modalidad unificado.
 * Valores: PRESENCIAL, VIRTUAL, VIRTUAL/PRESENCIAL (ambos).
 */
export enum OfferModality {
  PRESENCIAL = 'PRESENCIAL',
  VIRTUAL = 'VIRTUAL',
  AMBOS = 'VIRTUAL/PRESENCIAL',
}

/**
 * Entidad Oferta — Unificada
 *
 * Consolidación de la entidad original (campos en inglés) y OfertaEntity HU26
 * (campos en español) en una sola entidad con columnas en español como primarias.
 *
 * Las columnas en inglés (title, price, modality, categories, description)
 * se mantienen temporalmente como nullable para backward compatibility,
 * y se sincronizan en el factory method `createFromDto`.
 */
@Entity('ofertas')
@Unique(['tutorId', 'titulo'])
@Index(['tutorId'])
export class Oferta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ─── Columnas principales (español, HU26) ───────────────────────────────

  @Column({ type: 'varchar', length: 255, nullable: true })
  titulo: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({
    type: 'enum',
    enum: OfferModality,
    default: OfferModality.VIRTUAL,
  })
  modalidad: OfferModality;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  precioHora: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  areaConocimiento: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nivel: string | null;

  // ─── Columnas legacy (inglés) — mantenidas para backward compatibility ──

  @Column({ type: 'varchar', length: 80, nullable: true })
  title: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  modality: string | null;

  @Column('simple-array', { nullable: true })
  categories: string[] | null;

  @Column({ type: 'varchar', length: 250, nullable: true })
  description: string | null;

  @Column({ type: 'float', default: 0.0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewsCount: number;

  // ─── Relaciones ─────────────────────────────────────────────────────────

  @Column({ type: 'uuid', nullable: true })
  tutorId: string;

  @ManyToOne(() => Tutor, (tutor) => tutor.ofertas, {
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'tutorId' })
  tutor: Tutor;

  // ─── Timestamps ─────────────────────────────────────────────────────────

  @Column({ type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  fechaCreacion: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ─── Factory Methods ────────────────────────────────────────────────────

  /**
   * Factory method to create an Oferta instance from DTO and tutorId.
   * Populates both Spanish and English columns for backward compatibility.
   */
  static createFromDto(dto: CreateOfertaDto, tutorId: string): Oferta {
    const oferta = new Oferta();

    // Columnas principales (español)
    oferta.titulo = dto.title;
    oferta.descripcion = dto.description;
    oferta.precioHora = dto.price;
    oferta.modalidad = Oferta.toOfferModality(dto.modality);
    oferta.areaConocimiento = dto.categories?.[0] ?? null;
    oferta.tutorId = tutorId;

    // Columnas legacy (inglés) — sincronizadas
    oferta.title = dto.title;
    oferta.price = dto.price;
    oferta.modality = dto.modality;
    oferta.categories = dto.categories;
    oferta.description = dto.description;

    return oferta;
  }

  /**
   * Convierte una cadena de modalidad a OfferModality enum.
   */
  static toOfferModality(modality: string): OfferModality {
    const lower = (modality ?? '').toLowerCase();
    if (lower === 'presencial') return OfferModality.PRESENCIAL;
    if (lower === 'virtual') return OfferModality.VIRTUAL;
    if (
      lower === 'virtual/presencial' ||
      lower === 'ambos' ||
      lower === 'virtual y presencial'
    )
      return OfferModality.AMBOS;
    return OfferModality.VIRTUAL;
  }
}
