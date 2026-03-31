import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SolicitudEntity } from '../../solicitudes/entities/solicitud.entity';

/**
 * Entidad Review — HU-40 / HU-10
 *
 * Representa la reseña que un estudiante deja sobre una tutoría completada.
 * Relación OneToOne con SolicitudEntity (una reseña por solicitud).
 */
@Entity('reviews')
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  solicitudId: string;

  @OneToOne(() => SolicitudEntity, { eager: false })
  @JoinColumn({ name: 'solicitudId' })
  solicitud: SolicitudEntity;

  @Column({ type: 'varchar' })
  estudianteId: string;

  @Column({ type: 'uuid' })
  tutorId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'varchar', length: 300, nullable: true })
  comment: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
