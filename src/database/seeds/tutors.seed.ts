import { DataSource } from 'typeorm';
import {
  Facultades,
  Semestres,
} from '../../tutors/dto/registrar-datos-basicos.dto';
import { Tutor } from '../../tutors/entities/tutor.entity';

/**
 * UUID del tutor "en cero" — usado para crear nuevas ofertas desde la API.
 * IMPORTANTE: Mantener sincronizado con ofertas.controller.ts
 */
export const ZERO_TUTOR_ID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Seed de tutores para HU02, HU17 y HU34.
 * Crea los tutores necesarios ANTES de insertar las ofertas (FK constraint).
 * Los campos reflejan la nueva entidad Tutor (HU34).
 */
export async function seedTutors(dataSource: DataSource): Promise<void> {
  const tutorRepository = dataSource.getRepository(Tutor);

  const tutors: Partial<Tutor>[] = [
    // ── Tutor "en cero" — sólo para asociar ofertas creadas desde la API ──
    {
      id: ZERO_TUTOR_ID,
      userId: 'test-user-123',
      nombreCompleto: 'Tutor de Pruebas',
      numeroWhatsapp: '0000000000',
      facultad: Facultades.FIS_SISTEMAS,
      semestreActual: Semestres.DECIMO,
      biografiaCorta:
        'Tutor de pruebas para desarrollo. Las ofertas creadas desde la API se asocian a este perfil.',
      calificacionPromedio: 0,
      numResenas: 0,
    },
    // ── Tutores reales ─────────────────────────────────────────────────────
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      userId: 'seed-user-001',
      nombreCompleto: 'Juan Carlos Pérez',
      numeroWhatsapp: '3001234001',
      facultad: Facultades.FIS_SISTEMAS,
      semestreActual: Semestres.OCTAVO,
      biografiaCorta:
        'Ingeniero en Sistemas con cinco años de experiencia en tutorías de matemáticas y programación. Especializado en cálculo diferencial e integral.',
      calificacionPromedio: 4.8,
      numResenas: 52,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      userId: 'seed-user-002',
      nombreCompleto: 'María Fernanda González',
      numeroWhatsapp: '3001234002',
      facultad: Facultades.FIS_SISTEMAS,
      semestreActual: Semestres.NOVENO,
      biografiaCorta:
        'Experta en Python, programación orientada a objetos y análisis de datos. Más de cien estudiantes capacitados en algoritmia y estructuras de datos.',
      calificacionPromedio: 4.9,
      numResenas: 78,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      userId: 'seed-user-003',
      nombreCompleto: 'Carlos Alberto Rodríguez',
      numeroWhatsapp: '3001234003',
      facultad: Facultades.FCEC,
      semestreActual: Semestres.DECIMO,
      biografiaCorta:
        'Matemático con enfoque en álgebra lineal y fundamentos de machine learning. Bilingüe español-inglés con enfoque en resolución de ejercicios prácticos.',
      calificacionPromedio: 4.7,
      numResenas: 45,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      userId: 'seed-user-004',
      nombreCompleto: 'Ana Lucía Martínez',
      numeroWhatsapp: '3001234004',
      facultad: Facultades.FIS_SISTEMAS,
      semestreActual: Semestres.SEPTIMO,
      biografiaCorta:
        'Especialista en estructuras de datos, algoritmos y bases de datos. Tutora comprometida con métodos didácticos claros para estudiantes de todos los niveles.',
      calificacionPromedio: 4.5,
      numResenas: 33,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      userId: 'seed-user-005',
      nombreCompleto: 'Roberto Alejandro Silva',
      numeroWhatsapp: '3001234005',
      facultad: Facultades.FCEC,
      semestreActual: Semestres.DECIMO,
      biografiaCorta:
        'Ingeniero eléctrico con experiencia en circuitos, SQL avanzado y optimización de sistemas embebidos. Tutoría presencial y virtual disponible.',
      calificacionPromedio: 4.3,
      numResenas: 21,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440006',
      userId: 'seed-user-006',
      nombreCompleto: 'Laura Daniela Torres',
      numeroWhatsapp: '3001234006',
      facultad: Facultades.FIAL,
      semestreActual: Semestres.SEXTO,
      biografiaCorta:
        'Tutora de inglés técnico y comunicación académica. Metodología basada en casos reales de ingeniería. Ayudo a preparar presentaciones y redacción de informes.',
      calificacionPromedio: 4.6,
      numResenas: 38,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440007',
      userId: 'seed-user-007',
      nombreCompleto: 'Andrés Felipe Moreno',
      numeroWhatsapp: '3001234007',
      facultad: Facultades.FCBT,
      semestreActual: Semestres.OCTAVO,
      biografiaCorta:
        'Biólogo especializado en bioquímica y microbiología. Experiencia en tutorías de laboratorio, análisis de datos biológicos y preparación de exámenes de ciencias.',
      calificacionPromedio: 4.4,
      numResenas: 17,
    },
  ];

  console.log('📚 Insertando tutores...');

  for (const tutorData of tutors) {
    const tutor = tutorRepository.create(tutorData);
    await tutorRepository.save(tutor);
  }

  console.log(`✅ ${tutors.length} tutores insertados exitosamente`);
}
