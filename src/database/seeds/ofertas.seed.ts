import { DataSource } from 'typeorm';
import { Oferta } from '../../ofertas/domain/entities/oferta.entity';

export async function seedOfertas(dataSource: DataSource): Promise<void> {
  const ofertaRepository = dataSource.getRepository(Oferta);

  // Limpiar tabla antes de insertar (opcional)
  await ofertaRepository.clear();

  const ofertas = [
    {
      title: 'Cálculo Diferencial e Integral',
      price: 12.50,
      modality: 'Virtual',
      categories: ['Matemáticas', 'Cálculo'],
      description: 'Tutorías especializadas en límites, derivadas, integrales y aplicaciones. Incluye ejercicios prácticos y resolución de exámenes.',
      tutorId: '550e8400-e29b-41d4-a716-446655440001',
    },
    {
      title: 'Física Mecánica - Dinámica y Estática',
      price: 15.00,
      modality: 'Presencial',
      categories: ['Física', 'Ingeniería'],
      description: 'Aprende conceptos de fuerzas, movimiento, energía y momento. Resolución de problemas con enfoque práctico para ingeniería.',
      tutorId: '550e8400-e29b-41d4-a716-446655440001',
    },
    {
      title: 'Programación en Python - Desde Cero',
      price: 18.00,
      modality: 'Virtual',
      categories: ['Programación', 'Informática', 'Python'],
      description: 'Curso completo de Python: sintaxis, estructuras de datos, POO, manejo de archivos, y librerías como NumPy y Pandas.',
      tutorId: '550e8400-e29b-41d4-a716-446655440002',
    },
    {
      title: 'Química Orgánica - Reacciones y Mecanismos',
      price: 20.00,
      modality: 'Híbrida',
      categories: ['Química', 'Ciencias'],
      description: 'Domina las reacciones orgánicas, mecanismos de reacción, estereoquímica y nomenclatura IUPAC con ejercicios guiados.',
      tutorId: '550e8400-e29b-41d4-a716-446655440002',
    },
    {
      title: 'Álgebra Lineal y Matrices',
      price: 14.00,
      modality: 'Virtual',
      categories: ['Matemáticas', 'Álgebra'],
      description: 'Espacios vectoriales, transformaciones lineales, diagonalización, valores propios. Aplicaciones en machine learning.',
      tutorId: '550e8400-e29b-41d4-a716-446655440003',
    },
    {
      title: 'Inglés Técnico para Ingeniería',
      price: 10.00,
      modality: 'Presencial',
      categories: ['Idiomas', 'Inglés', 'Ingeniería'],
      description: 'Mejora tu comprensión de textos técnicos en inglés, redacción de papers y presentaciones académicas.',
      tutorId: '550e8400-e29b-41d4-a716-446655440003',
    },
    {
      title: 'Estructuras de Datos y Algoritmos',
      price: 22.00,
      modality: 'Virtual',
      categories: ['Programación', 'Algoritmos', 'Informática'],
      description: 'Aprende listas, árboles, grafos, ordenamiento y búsqueda. Análisis de complejidad temporal y espacial (Big O).',
      tutorId: '550e8400-e29b-41d4-a716-446655440004',
    },
    {
      title: 'Microeconomía - Teoría del Consumidor',
      price: 16.00,
      modality: 'Híbrida',
      categories: ['Economía', 'Finanzas'],
      description: 'Elasticidad, utilidad, curvas de indiferencia, teoría de juegos y equilibrio de mercado con casos prácticos.',
      tutorId: '550e8400-e29b-41d4-a716-446655440004',
    },
    {
      title: 'Circuitos Eléctricos - Análisis AC/DC',
      price: 17.50,
      modality: 'Presencial',
      categories: ['Ingeniería', 'Eléctrica', 'Física'],
      description: 'Leyes de Kirchhoff, análisis nodal y de mallas, teoremas de Thevenin y Norton, circuitos trifásicos.',
      tutorId: '550e8400-e29b-41d4-a716-446655440005',
    },
    {
      title: 'Base de Datos y SQL Avanzado',
      price: 19.00,
      modality: 'Virtual',
      categories: ['Programación', 'Bases de Datos', 'SQL'],
      description: 'Normalización, índices, transacciones, optimización de queries, stored procedures y triggers en PostgreSQL/MySQL.',
      tutorId: '550e8400-e29b-41d4-a716-446655440005',
    },
  ];

  // Insertar ofertas en la base de datos
  for (const ofertaData of ofertas) {
    const oferta = ofertaRepository.create(ofertaData);
    await ofertaRepository.save(oferta);
  }

  console.log('✅ Seed completado: 10 ofertas insertadas exitosamente');
}
