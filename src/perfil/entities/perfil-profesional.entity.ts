import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

/**
 * Entidad PerfilProfesionalEntity — HU42
 *
 * Representa el perfil profesional de un tutor (único por tutorId).
 */
@Entity('tutor_perfiles_profesionales')
@Unique(['tutorId'])
export class PerfilProfesionalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  tutorId: string;

  @Column('simple-array', { nullable: true })
  materias: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
