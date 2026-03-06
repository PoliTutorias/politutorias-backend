import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('availability')
@Index(['tutorId', 'day', 'hour'], { unique: true })
export class AvailabilityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255, nullable: true })
  tutorId: string;

  @Column('varchar', { length: 3 })
  day: string;

  @Column('varchar', { length: 5 })
  hour: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
