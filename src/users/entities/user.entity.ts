import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entidad User — Autenticación
 *
 * Representa un usuario registrado en el sistema.
 * Según USER-01: Un mismo usuario puede ser Estudiante y Tutor simultáneamente.
 * La diferencia es que un Tutor tiene un perfil en la tabla `tutors`.
 */
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, nullable: false })
  name: string;

  @Column({ length: 150, nullable: false, unique: true })
  email: string;

  @Column({ type: 'text', nullable: false })
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
