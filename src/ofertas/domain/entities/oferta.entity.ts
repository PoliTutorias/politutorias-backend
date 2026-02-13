import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { CreateOfertaDto } from '../../dto/create-oferta.dto';

@Entity('ofertas')
@Unique(['tutorId', 'title'])
export class Oferta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80 })
  title: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 50 })
  modality: string;

  @Column('simple-array')
  categories: string[];

  @Column({ type: 'varchar', length: 250 })
  description: string;

  @Column({ type: 'uuid' })
  tutorId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Factory method to create an Oferta instance from DTO and tutorId.
   * Improves encapsulation and reduces coupling in use cases.
   */
  static createFromDto(dto: CreateOfertaDto, tutorId: string): Oferta {
    const oferta = new Oferta();
    oferta.title = dto.title;
    oferta.price = dto.price;
    oferta.modality = dto.modality;
    oferta.categories = dto.categories;
    oferta.description = dto.description;
    oferta.tutorId = tutorId;
    return oferta;
  }
}
