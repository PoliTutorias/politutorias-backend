import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entidad ExperienciaEntity — HU42
 *
 * Representa una experiencia académica/profesional de un tutor.
 */
@Entity('tutor_experiencias')
export class ExperienciaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  tutorId: string;

  @Column({ length: 100, nullable: false })
  puesto: string;

  @Column({ length: 150, nullable: false })
  institucion: string;

  @Column({ length: 7, nullable: false })
  fechaInicio: string;

  @Column({ length: 8, nullable: true })
  fechaFin?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
