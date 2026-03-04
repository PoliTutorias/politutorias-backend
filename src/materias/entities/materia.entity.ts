import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Entidad MateriaEntity — HU42
 *
 * Representa una materia asociada a un tutor con restricción de unicidad.
 */
@Entity('tutor_materias')
@Index(['tutorId', 'nombre'], { unique: true })
export class MateriaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  tutorId: string;

  @Column({ length: 100, nullable: false })
  nombre: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
