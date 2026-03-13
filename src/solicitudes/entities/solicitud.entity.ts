import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SolicitudEstado {
  PENDIENTE = 'PENDIENTE',
  ACEPTADA = 'ACEPTADA',
  RECHAZADA = 'RECHAZADA',
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

  @Column({ type: 'uuid' })
  tutorId: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
