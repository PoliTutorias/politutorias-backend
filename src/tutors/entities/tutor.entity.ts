import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Oferta } from '../../ofertas/domain/entities/oferta.entity';

/**
 * Entidad Tutor
 *
 * Representa un tutor en el sistema que puede ofrecer múltiples tutorías.
 */
@Entity('tutors')
export class Tutor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @OneToMany(() => Oferta, (oferta) => oferta.tutor)
  ofertas: Oferta[];
}
