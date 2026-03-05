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

@Entity('ofertas')
@Unique(['tutorId', 'title'])
@Index(['tutorId'])
export class Oferta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80 })
  title: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 50 })
  modality: string;

  @Column('simple-array')
  categories: string[];

  @Column({ type: 'varchar', length: 250 })
  description: string;

  @Column({ type: 'float', default: 0.0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewsCount: number;

  @Column({ type: 'uuid', nullable: true })
  tutorId: string;

  @ManyToOne(() => Tutor, (tutor) => tutor.ofertas, {
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'tutorId' })
  tutor: Tutor;

  // ─── Columnas HU26 (nullable para coexistir con registros legacy) ───────────

  @Column({ type: 'varchar', length: 255, nullable: true })
  titulo?: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion?: string | null;

  @Column({
    type: 'enum',
    enum: ['PRESENCIAL', 'VIRTUAL', 'AMBOS'],
    nullable: true,
  })
  modalidad?: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  precioHora?: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  areaConocimiento?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nivel?: string | null;

  @CreateDateColumn()
  fechaCreacion?: Date;

  // ────────────────────────────────────────────────────────────────────────────

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Factory method to create an Oferta instance from DTO and tutorId.
   * Improves encapsulation and reduces coupling in use cases.
   */
  static createFromDto(dto: CreateOfertaDto, tutorId: string): Oferta {
    const oferta = new Oferta();
    oferta.title = dto.title;
    oferta.price = dto.price;
    oferta.modality = dto.modality;
    oferta.categories = dto.categories;
    oferta.description = dto.description;
    oferta.tutorId = tutorId;
    return oferta;
  }
}
