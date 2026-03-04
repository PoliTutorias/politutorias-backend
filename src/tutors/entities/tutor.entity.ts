import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Oferta } from '../../ofertas/domain/entities/oferta.entity';
import { Facultades, Semestres } from '../dto/registrar-datos-basicos.dto';

/**
 * Entidad Tutor — HU34
 *
 * Representa el perfil de un tutor registrado en el sistema.
 * Un userId solo puede tener un perfil (unique).
 */
@Entity('tutors')
@Unique(['userId'])
@Unique(['numeroWhatsapp'])
export class Tutor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  userId: string;

  @Column({ length: 60, nullable: false })
  nombreCompleto: string;

  @Column({ length: 13, nullable: false })
  numeroWhatsapp: string;

  @Column({ type: 'enum', enum: Facultades, nullable: false })
  facultad: Facultades;

  @Column({ type: 'enum', enum: Semestres, nullable: false })
  semestreActual: Semestres;

  @Column({ type: 'text', nullable: false })
  biografiaCorta: string;

  @Column({ type: 'text', nullable: true })
  fotoPerfil: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Oferta, (oferta) => oferta.tutor)
  ofertas: Oferta[];
}
