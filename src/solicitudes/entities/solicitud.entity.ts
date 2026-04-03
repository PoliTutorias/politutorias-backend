import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Oferta } from '../../ofertas/domain/entities/oferta.entity';

export enum SolicitudEstado {
  PENDIENTE = 'PENDIENTE',
  ACEPTADA = 'ACEPTADA',
  RECHAZADA = 'RECHAZADA',
  EXPIRADA = 'EXPIRADA',
  COMPLETADA = 'COMPLETADA',
  NO_SHOW = 'NO_SHOW',
}

export enum RejectionReason {
  CONFLICTO_HORARIOS = 'Conflicto de horarios con otra tutoría',
  ENFERMEDAD = 'Enfermedad',
  NO_DISPONIBLE = 'No disponible en esa fecha',
  IMPREVISTO_PERSONAL = 'Imprevisto personal',
  OTRO = 'Otro',
}

@Entity('solicitudes')
@Index(['estudianteId', 'ofertaId'])
export class SolicitudEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  estudianteId: string;

  @Column({ type: 'uuid' })
  ofertaId: string;

  @ManyToOne(() => Oferta, { eager: false, nullable: true })
  @JoinColumn({ name: 'ofertaId' })
  oferta: Oferta | null;

  @Column({ type: 'uuid' })
  tutorId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nombreEstudiante: string | null;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ type: 'varchar', nullable: true })
  modalidad: string | null;

  @Column({ type: 'jsonb' })
  horarios: { fecha: string; hora: string }[];

  @Column({
    type: 'enum',
    enum: SolicitudEstado,
    default: SolicitudEstado.PENDIENTE,
  })
  estado: SolicitudEstado;

  @Column({ type: 'enum', enum: RejectionReason, nullable: true })
  rejectionReason: RejectionReason | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  rejectionComment: string | null;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  acceptedMeetingLink: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  acceptedMeetingLocation: string | null;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  noShowAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  reviewId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
