import { AvailabilityBlockResponseDto } from './availability-block-response.dto';

export class SaveAvailabilityResponseDto {
  message: string;
  tutorId: string;
  blocks: AvailabilityBlockResponseDto[];

  constructor(
    message: string,
    tutorId: string,
    blocks: AvailabilityBlockResponseDto[],
  ) {
    this.message = message;
    this.tutorId = tutorId;
    this.blocks = blocks;
  }
}
