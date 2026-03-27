import { DataSource } from 'typeorm';
import { AvailabilityEntity } from '../../disponibilidad/entities/availability.entity';
import { ZERO_TUTOR_ID } from './tutors.seed';

/**
 * Seed de disponibilidad para HU41.
 * Crea bloques horarios de disponibilidad para tutores.
 * Debe ejecutarse DESPUÉS del seed de tutores (FK constraint).
 * Nota: Se eliminan duplicados y se garantiza unicidad de (tutorId, day, hour).
 */
export async function seedDisponibilidad(
  dataSource: DataSource,
): Promise<void> {
  const availabilityRepository = dataSource.getRepository(AvailabilityEntity);

  // Bloques de disponibilidad para los tutores de prueba
  // Nota: Se eliminan duplicados y se garantiza unicidad de (tutorId, day, hour).

  // Días y horas disponibles en el sistema
  const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const HOURS = [
    '07:00',
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
  ];

  // Generar todos los bloques para el tutor daniel.v (ZERO_TUTOR_ID) — facilita pruebas
  const zeroBloques: Partial<AvailabilityEntity>[] = DAYS.flatMap((day) =>
    HOURS.map((hour) => ({ tutorId: ZERO_TUTOR_ID, day, hour })),
  );

  const availabilityBlocks: Partial<AvailabilityEntity>[] = [
    // ── Tutor "en cero" daniel.v@epn.edu.ec — TODAS las horas habilitadas ────
    ...zeroBloques,

    // ── Juan Carlos Pérez (550e8400-e29b-41d4-a716-446655440001) ──────────────
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440001',
      day: 'Lun',
      hour: '08:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440001',
      day: 'Lun',
      hour: '09:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440001',
      day: 'Mar',
      hour: '16:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440001',
      day: 'Jue',
      hour: '10:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440001',
      day: 'Vie',
      hour: '14:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440001',
      day: 'Vie',
      hour: '15:00',
    },

    // ── María Fernanda González (550e8400-e29b-41d4-a716-446655440002) ────────
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440002',
      day: 'Lun',
      hour: '17:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440002',
      day: 'Lun',
      hour: '18:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440002',
      day: 'Mié',
      hour: '15:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440002',
      day: 'Mié',
      hour: '16:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440002',
      day: 'Sáb',
      hour: '10:00',
    },

    // ── Carlos Alberto Rodríguez (550e8400-e29b-41d4-a716-446655440003) ──────
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440003',
      day: 'Mar',
      hour: '09:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440003',
      day: 'Mié',
      hour: '11:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440003',
      day: 'Mié',
      hour: '12:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440003',
      day: 'Jue',
      hour: '14:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440003',
      day: 'Vie',
      hour: '10:00',
    },

    // ── Ana Lucía Martínez (550e8400-e29b-41d4-a716-446655440004) ───────────
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440004',
      day: 'Lun',
      hour: '13:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440004',
      day: 'Mar',
      hour: '14:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440004',
      day: 'Mié',
      hour: '09:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440004',
      day: 'Jue',
      hour: '15:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440004',
      day: 'Vie',
      hour: '11:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440004',
      day: 'Sáb',
      hour: '14:00',
    },

    // ── Roberto Alejandro Silva (550e8400-e29b-41d4-a716-446655440005) ──────
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440005',
      day: 'Lun',
      hour: '19:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440005',
      day: 'Mar',
      hour: '17:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440005',
      day: 'Mié',
      hour: '18:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440005',
      day: 'Sáb',
      hour: '11:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440005',
      day: 'Dom',
      hour: '15:00',
    },

    // ── Lucía María Fernández López (550e8400-e29b-41d4-a716-446655440006) ──
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440006',
      day: 'Lun',
      hour: '15:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440006',
      day: 'Mar',
      hour: '10:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440006',
      day: 'Jue',
      hour: '16:00',
    },
    {
      tutorId: '550e8400-e29b-41d4-a716-446655440006',
      day: 'Vie',
      hour: '09:00',
    },
  ];

  console.log('⏰ Insertando bloques de disponibilidad...');

  // Filtrar duplicados (tutorId, day, hour) antes de insertar
  const uniqueBlocks = Array.from(
    new Map(
      availabilityBlocks.map((block) => [
        `${block.tutorId}-${block.day}-${block.hour}`,
        block,
      ]),
    ).values(),
  );

  for (const blockData of uniqueBlocks) {
    const block = availabilityRepository.create(blockData);
    await availabilityRepository.save(block);
  }

  console.log(
    `✅ ${uniqueBlocks.length} bloques de disponibilidad insertados exitosamente`,
  );
}
