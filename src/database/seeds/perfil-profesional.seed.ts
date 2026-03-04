import { DataSource } from 'typeorm';
import { PerfilProfesionalEntity } from '../../perfil/entities/perfil-profesional.entity';

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
 * Seed de perfiles profesionales — HU42
 *
 * Crea un perfil profesional por tutor con las materias que domina.
 * IMPORTANTE: Ejecutar DESPUÉS de seedTutors (FK constraint tutorId).
 */
export async function seedPerfilesProfesionales(
  dataSource: DataSource,
): Promise<void> {
  const repo = dataSource.getRepository(PerfilProfesionalEntity);

  const perfiles: Partial<PerfilProfesionalEntity>[] = [
    // Juan Carlos Pérez — matemáticas y programación
    {
      tutorId: TUTOR_IDS[0],
      materias: [
        'Cálculo Diferencial',
        'Cálculo Integral',
        'Álgebra Lineal',
        'Programación Orientada a Objetos',
      ],
    },
    // María Fernanda González — Python y estructuras de datos
    {
      tutorId: TUTOR_IDS[1],
      materias: [
        'Programación en Python',
        'Estructuras de Datos',
        'Algoritmia',
        'Análisis de Datos',
      ],
    },
    // Carlos Alberto Rodríguez — álgebra y machine learning
    {
      tutorId: TUTOR_IDS[2],
      materias: [
        'Álgebra Lineal',
        'Estadística y Probabilidad',
        'Fundamentos de Machine Learning',
        'Cálculo Multivariable',
      ],
    },
    // Ana Lucía Martínez — bases de datos y algoritmos
    {
      tutorId: TUTOR_IDS[3],
      materias: [
        'Bases de Datos I',
        'Bases de Datos II',
        'Estructuras de Datos',
        'Algoritmos y Complejidad',
      ],
    },
    // Roberto Alejandro Silva — circuitos y SQL
    {
      tutorId: TUTOR_IDS[4],
      materias: [
        'Circuitos Eléctricos I',
        'Circuitos Eléctricos II',
        'SQL Avanzado',
        'Sistemas Embebidos',
      ],
    },
    // Laura Daniela Torres — inglés y comunicación
    {
      tutorId: TUTOR_IDS[5],
      materias: [
        'Inglés Técnico I',
        'Inglés Técnico II',
        'Comunicación Académica',
        'Redacción de Informes',
      ],
    },
    // Andrés Felipe Moreno — bioquímica y biología
    {
      tutorId: TUTOR_IDS[6],
      materias: [
        'Bioquímica General',
        'Microbiología',
        'Análisis de Datos Biológicos',
        'Laboratorio de Ciencias',
      ],
    },
  ];

  console.log('🎓 Insertando perfiles profesionales...');

  for (const perfilData of perfiles) {
    const perfil = repo.create(perfilData);
    await repo.save(perfil);
  }

  console.log(
    `✅ ${perfiles.length} perfiles profesionales insertados exitosamente`,
  );
}
