import { DataSource } from 'typeorm';
import { ExperienciaEntity } from '../../experiencias/entities/experiencia.entity';

/** UUIDs de tutores reales definidos en tutors.seed.ts */
const TUTOR_IDS = [
  '550e8400-e29b-41d4-a716-446655440001', // Juan Carlos Pérez
  '550e8400-e29b-41d4-a716-446655440002', // María Fernanda González
  '550e8400-e29b-41d4-a716-446655440003', // Carlos Alberto Rodríguez
  '550e8400-e29b-41d4-a716-446655440004', // Ana Lucía Martínez
  '550e8400-e29b-41d4-a716-446655440005', // Roberto Alejandro Silva
  '550e8400-e29b-41d4-a716-446655440006', // Laura Daniela Torres
  '550e8400-e29b-41d4-a716-446655440007', // Andrés Felipe Moreno
];

/**
 * Seed de experiencias laborales/docentes — HU42
 *
 * Cada tutor recibe entre 2 y 3 experiencias representativas
 * de su área de conocimiento.
 */
export async function seedExperiencias(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(ExperienciaEntity);

  const experiencias: Partial<ExperienciaEntity>[] = [
    // ── Juan Carlos Pérez (tutorías de matemáticas y programación) ─────────
    {
      tutorId: TUTOR_IDS[0],
      puesto: 'Monitor de Cálculo Diferencial',
      institucion: 'Universidad Politécnico Gran Colombiano',
      fechaInicio: '02/2022',
      fechaFin: '11/2022',
    },
    {
      tutorId: TUTOR_IDS[0],
      puesto: 'Tutor de Programación Orientada a Objetos',
      institucion: 'Academia de Tecnología ProCode',
      fechaInicio: '01/2023',
      fechaFin: 'Presente',
    },
    {
      tutorId: TUTOR_IDS[0],
      puesto: 'Auxiliar Docente de Álgebra Lineal',
      institucion: 'Universidad Politécnico Gran Colombiano',
      fechaInicio: '07/2021',
      fechaFin: '12/2021',
    },

    // ── María Fernanda González (Python, algoritmia, estructuras de datos) ─
    {
      tutorId: TUTOR_IDS[1],
      puesto: 'Instructora de Python para Data Science',
      institucion: 'DataSkills Bootcamp',
      fechaInicio: '03/2022',
      fechaFin: 'Presente',
    },
    {
      tutorId: TUTOR_IDS[1],
      puesto: 'Monitora de Estructuras de Datos',
      institucion: 'Universidad Politécnico Gran Colombiano',
      fechaInicio: '01/2021',
      fechaFin: '12/2021',
    },

    // ── Carlos Alberto Rodríguez (álgebra, machine learning) ──────────────
    {
      tutorId: TUTOR_IDS[2],
      puesto: 'Tutor de Álgebra Lineal y Estadística',
      institucion: 'Centro de Tutorías Virtuales EduMath',
      fechaInicio: '06/2021',
      fechaFin: '05/2023',
    },
    {
      tutorId: TUTOR_IDS[2],
      puesto: 'Asistente de Investigación en ML',
      institucion: 'Universidad Politécnico Gran Colombiano',
      fechaInicio: '02/2023',
      fechaFin: 'Presente',
    },
    {
      tutorId: TUTOR_IDS[2],
      puesto: 'Profesor Auxiliar de Fundamentos Matemáticos',
      institucion: 'Instituto Técnico CESDE',
      fechaInicio: '08/2020',
      fechaFin: '12/2020',
    },

    // ── Ana Lucía Martínez (bases de datos, algoritmos) ───────────────────
    {
      tutorId: TUTOR_IDS[3],
      puesto: 'Monitora de Bases de Datos SQL',
      institucion: 'Universidad Politécnico Gran Colombiano',
      fechaInicio: '01/2023',
      fechaFin: 'Presente',
    },
    {
      tutorId: TUTOR_IDS[3],
      puesto: 'Tutora de Algoritmos y Complejidad',
      institucion: 'TechTutores Colombia',
      fechaInicio: '05/2022',
      fechaFin: '12/2022',
    },

    // ── Roberto Alejandro Silva (circuitos, SQL avanzado) ─────────────────
    {
      tutorId: TUTOR_IDS[4],
      puesto: 'Auxiliar Docente de Circuitos Eléctricos',
      institucion: 'Universidad Politécnico Gran Colombiano',
      fechaInicio: '08/2021',
      fechaFin: '06/2022',
    },
    {
      tutorId: TUTOR_IDS[4],
      puesto: 'Instructor de SQL Avanzado y Optimización',
      institucion: 'DataBase Masters S.A.S.',
      fechaInicio: '09/2022',
      fechaFin: 'Presente',
    },

    // ── Laura Daniela Torres (inglés técnico, comunicación) ───────────────
    {
      tutorId: TUTOR_IDS[5],
      puesto: 'Tutora de Inglés Técnico para Ingeniería',
      institucion: 'Language Bridge Institute',
      fechaInicio: '03/2021',
      fechaFin: 'Presente',
    },
    {
      tutorId: TUTOR_IDS[5],
      puesto: 'Monitora de Comunicación Académica',
      institucion: 'Universidad Politécnico Gran Colombiano',
      fechaInicio: '07/2022',
      fechaFin: '12/2022',
    },

    // ── Andrés Felipe Moreno (bioquímica, laboratorio) ────────────────────
    {
      tutorId: TUTOR_IDS[6],
      puesto: 'Monitor de Bioquímica General',
      institucion: 'Universidad Politécnico Gran Colombiano',
      fechaInicio: '01/2022',
      fechaFin: '06/2022',
    },
    {
      tutorId: TUTOR_IDS[6],
      puesto: 'Tutor de Laboratorio de Microbiología',
      institucion: 'CientíLab S.A.S.',
      fechaInicio: '08/2022',
      fechaFin: 'Presente',
    },
    {
      tutorId: TUTOR_IDS[6],
      puesto: 'Auxiliar de Análisis de Datos Biológicos',
      institucion: 'BioData Research Group',
      fechaInicio: '02/2023',
      fechaFin: '12/2023',
    },
  ];

  console.log('💼 Insertando experiencias...');

  for (const expData of experiencias) {
    const exp = repo.create(expData);
    await repo.save(exp);
  }

  console.log(`✅ ${experiencias.length} experiencias insertadas exitosamente`);
}
