import { ApiProperty } from '@nestjs/swagger';

export class HistorySummaryDto {
  @ApiProperty({
    description: 'Total de tutorías completadas',
    example: 25,
  })
  totalCompleted: number;

  @ApiProperty({
    description: 'Total de materias impartidas',
    example: 4,
  })
  totalSubjects: number;

  @ApiProperty({
    description: 'Total de estudiantes únicos',
    example: 18,
  })
  totalStudents: number;
}
