import { DataSource } from 'typeorm';
import { Tutor } from '../../tutors/entities/tutor.entity';

/**
 * UUID del tutor "en cero" - sin ofertas iniciales.
 * Este tutor se usa para crear nuevas ofertas desde la API.
 * IMPORTANTE: Mantener sincronizado con ofertas.controller.ts
 */
export const ZERO_TUTOR_ID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Seed de tutores para HU02 y HU17.
 *
 * Crea los tutores necesarios antes de insertar las ofertas.
 */
export async function seedTutors(dataSource: DataSource): Promise<void> {
  const tutorRepository = dataSource.getRepository(Tutor);

  // Nota: La limpieza se maneja en seed.ts principal por orden de FK

  const tutors = [
    // Tutor "en cero" - sin ofertas iniciales, usado para crear nuevas ofertas desde la API
    {
      id: ZERO_TUTOR_ID,
      name: 'Tutor de Pruebas',
      email: 'tutor.pruebas@poli.edu.ec',
      photoUrl: 'https://randomuser.me/api/portraits/lego/1.jpg',
      bio: 'Tutor de pruebas para desarrollo. Las ofertas creadas desde la API se asocian a este tutor.',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Juan Carlos Pérez',
      email: 'jcperez@poli.edu.ec',
      photoUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
      bio: 'Ingeniero Civil con 5 años de experiencia en tutorías de matemáticas y física. Especializado en cálculo diferencial e integral.',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'María Fernanda González',
      email: 'mfgonzalez@poli.edu.ec',
      photoUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
      bio: 'Ingeniera en Sistemas y científica de datos. Experta en Python, programación y análisis de datos con más de 100 estudiantes capacitados.',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Carlos Alberto Rodríguez',
      email: 'carodriguez@poli.edu.ec',
      photoUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
      bio: 'Matemático con maestría en álgebra. Bilingüe español-inglés. Tutor certificado con enfoque en álgebra lineal y machine learning.',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      name: 'Ana Lucía Martínez',
      email: 'almartinez@poli.edu.ec',
      photoUrl: 'https://randomuser.me/api/portraits/women/4.jpg',
      bio: 'Ingeniera en Software y economista. Especialista en estructuras de datos, algoritmos y microeconomía aplicada.',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      name: 'Roberto Alejandro Silva',
      email: 'rasilva@poli.edu.ec',
      photoUrl: 'https://randomuser.me/api/portraits/men/5.jpg',
      bio: 'Ingeniero Eléctrico y administrador de bases de datos. Experto en circuitos eléctricos, SQL avanzado y optimización de sistemas.',
    },
  ];

  console.log('📚 Insertando tutores...');

  for (const tutorData of tutors) {
    const tutor = tutorRepository.create(tutorData);
    await tutorRepository.save(tutor);
  }

  console.log(`✅ ${tutors.length} tutores insertados exitosamente`);
}
