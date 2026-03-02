import { AvailabilityEntity } from '../../entities/availability.entity';

export const AVAILABILITY_REPOSITORY_TOKEN = 'IAvailabilityRepository';

export interface IAvailabilityRepository {
  deleteByTutorId(tutorId: string): Promise<void>;
  create(block: {
    tutorId: string;
    day: string;
    hour: string;
  }): AvailabilityEntity;
  saveAll(blocks: AvailabilityEntity[]): Promise<AvailabilityEntity[]>;
}
