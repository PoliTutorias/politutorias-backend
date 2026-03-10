import { DataSource } from 'typeorm';
import { MateriaEntity } from '../../materias/entities/materia.entity';

/** UUIDs de tutores reales definidos en tutors.seed.ts */
const TUTOR_IDS = {
  JUAN: '550e8400-e29b-41d4-a716-446655440001', // Juan Carlos Pérez
  MARIA: '550e8400-e29b-41d4-a716-446655440002', // María Fernanda González
  CARLOS: '550e8400-e29b-41d4-a716-446655440003', // Carlos Alberto Rodríguez
  ANA: '550e8400-e29b-41d4-a716-446655440004', // Ana Lucía Martínez
  ROBERTO: '550e8400-e29b-41d4-a716-446655440005', // Roberto Alejandro Silva
  LAURA: '550e8400-e29b-41d4-a716-446655440006', // Laura Daniela Torres
  ANDRES: '550e8400-e29b-41d4-a716-446655440007', // Andrés Felipe Moreno
};

/**
 * Seed de materias dominadas por tutor — HU-32 (tabla tutor_materias).
 *
 * Cada MateriaEntity representa una materia que el tutor domina y que
 * se muestra en el detalle de la oferta (GET /api/ofertas/:id).
 *
 * Restricción de unicidad: (tutorId, nombre) — no se insertan duplicados.
 * Debe ejecutarse DESPUÉS de seedTutors (FK constraint tutorId).
 */
export async function seedMaterias(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(MateriaEntity);

  const materias: Partial<MateriaEntity>[] = [
    // ── Juan Carlos Pérez — matemáticas y programación ───────────────────────
    { tutorId: TUTOR_IDS.JUAN, nombre: 'Cálculo Diferencial' },
    { tutorId: TUTOR_IDS.JUAN, nombre: 'Cálculo Integral' },
    { tutorId: TUTOR_IDS.JUAN, nombre: 'Álgebra Lineal' },
    { tutorId: TUTOR_IDS.JUAN, nombre: 'Programación Orientada a Objetos' },

    // ── María Fernanda González — Python y estructuras de datos ──────────────
    { tutorId: TUTOR_IDS.MARIA, nombre: 'Programación en Python' },
    { tutorId: TUTOR_IDS.MARIA, nombre: 'Estructuras de Datos' },
    { tutorId: TUTOR_IDS.MARIA, nombre: 'Algoritmia' },
    { tutorId: TUTOR_IDS.MARIA, nombre: 'Análisis de Datos' },

    // ── Carlos Alberto Rodríguez — álgebra y machine learning ────────────────
    { tutorId: TUTOR_IDS.CARLOS, nombre: 'Álgebra Lineal' },
    { tutorId: TUTOR_IDS.CARLOS, nombre: 'Estadística y Probabilidad' },
    { tutorId: TUTOR_IDS.CARLOS, nombre: 'Fundamentos de Machine Learning' },
    { tutorId: TUTOR_IDS.CARLOS, nombre: 'Cálculo Multivariable' },

    // ── Ana Lucía Martínez — bases de datos y algoritmos ────────────────────
    { tutorId: TUTOR_IDS.ANA, nombre: 'Bases de Datos I' },
    { tutorId: TUTOR_IDS.ANA, nombre: 'Bases de Datos II' },
    { tutorId: TUTOR_IDS.ANA, nombre: 'Estructuras de Datos' },
    { tutorId: TUTOR_IDS.ANA, nombre: 'Algoritmos y Complejidad' },

    // ── Roberto Alejandro Silva — circuitos y SQL ────────────────────────────
    { tutorId: TUTOR_IDS.ROBERTO, nombre: 'Circuitos Eléctricos I' },
    { tutorId: TUTOR_IDS.ROBERTO, nombre: 'Circuitos Eléctricos II' },
    { tutorId: TUTOR_IDS.ROBERTO, nombre: 'SQL Avanzado' },
    { tutorId: TUTOR_IDS.ROBERTO, nombre: 'Sistemas Embebidos' },

    // ── Laura Daniela Torres — inglés técnico y comunicación ─────────────────
    { tutorId: TUTOR_IDS.LAURA, nombre: 'Inglés Técnico I' },
    { tutorId: TUTOR_IDS.LAURA, nombre: 'Inglés Técnico II' },
    { tutorId: TUTOR_IDS.LAURA, nombre: 'Comunicación Académica' },
    { tutorId: TUTOR_IDS.LAURA, nombre: 'Redacción de Informes' },

    // ── Andrés Felipe Moreno — bioquímica y biología ─────────────────────────
    { tutorId: TUTOR_IDS.ANDRES, nombre: 'Bioquímica General' },
    { tutorId: TUTOR_IDS.ANDRES, nombre: 'Microbiología' },
    { tutorId: TUTOR_IDS.ANDRES, nombre: 'Análisis de Datos Biológicos' },
    { tutorId: TUTOR_IDS.ANDRES, nombre: 'Laboratorio de Ciencias' },
  ];

  console.log('📖 Insertando materias (HU-32)...');

  for (const materiaData of materias) {
    const materia = repo.create(materiaData);
    await repo.save(materia);
  }

  console.log(`✅ ${materias.length} materias insertadas exitosamente`);
}
