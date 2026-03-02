import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvailabilityEntity } from '../../entities/availability.entity';
import type { IAvailabilityRepository } from '../../application/ports/availability.repository.interface';

@Injectable()
export class TypeORMAvailabilityRepository implements IAvailabilityRepository {
  constructor(
    @InjectRepository(AvailabilityEntity)
    private availabilityRepository: Repository<AvailabilityEntity>,
  ) {}

  async deleteByTutorId(tutorId: string): Promise<void> {
    await this.availabilityRepository.delete({ tutorId });
  }

  create(block: {
    tutorId: string;
    day: string;
    hour: string;
  }): AvailabilityEntity {
    return this.availabilityRepository.create({
      tutorId: block.tutorId,
      day: block.day,
      hour: block.hour,
    });
  }

  async saveAll(blocks: AvailabilityEntity[]): Promise<AvailabilityEntity[]> {
    return this.availabilityRepository.save(blocks);
  }
}
