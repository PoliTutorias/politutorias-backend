export class AvailabilityBlockResponseDto {
  id: string;
  day: string;
  hour: string;

  constructor(id: string, day: string, hour: string) {
    this.id = id;
    this.day = day;
    this.hour = hour;
  }
}
