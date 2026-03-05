import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Tutor } from '../../tutors/entities/tutor.entity';

/**
 * Enum de modalidad para HU26.
 * Los valores coinciden con los acordados en el contrato HTTP.
 */
export enum OfferModality {
  PRESENCIAL = 'PRESENCIAL',
  VIRTUAL = 'VIRTUAL',
  AMBOS = 'VIRTUAL/PRESENCIAL',
}

/**
 * OfertaEntity — HU26
 *
 * Entidad con campo `modalidad` en español (enum PRESENCIAL/VIRTUAL/AMBOS)
 * y `fechaCreacion` para soportar el filtrado y ordenamiento del nuevo contrato.
 *
 * NOTE: Esta entidad coexiste con la entidad `Oferta` (campos en inglés) durante
 * la fase de transición. Una migración de base de datos consolidará ambas.
 */
@Entity('ofertas', { synchronize: false })
export class OfertaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** nullable para coexistir con registros Oferta (HU03/HU17/HU27) que usan campos en inglés */
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

  /** nullable para coexistir con registros Oferta (HU03/HU17/HU27) que usan campos en inglés */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  precioHora: number | null;

  @Column({ length: 100, nullable: true })
  areaConocimiento: string;

  @Column({ length: 50, nullable: true })
  nivel: string;

  @ManyToOne(() => Tutor, { eager: true, nullable: true })
  @JoinColumn({ name: 'tutorId' })
  tutor: Tutor;

  @CreateDateColumn()
  fechaCreacion: Date;
}
