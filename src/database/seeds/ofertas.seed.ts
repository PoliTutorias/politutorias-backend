import { DataSource } from 'typeorm';
import { Oferta } from '../../ofertas/domain/entities/oferta.entity';

/**
 * Seed de Ofertas para HU03, HU17 y HU27.
 *
 * ── HU03: GET /api/offers ────────────────────────────────────────────────────
 * 13 ofertas diseñadas para cubrir todos los escenarios de la HU03:
 *   - Paginación (10 en página 1, 3 en página 2)
 *   - Filtro por modalidad: Virtual, Presencial, Virtual/Presencial, Híbrida
 *   - Filtro por áreas de conocimiento (tags), incluyendo AND lógico
 *   - Filtro por rango de precios (8–25 USD)
 *   - Ordenamiento por precio, rating y createdAt
 *
 * ── HU17: GET /api/ofertas/search ───────────────────────────────────────────
 * Las mismas 13 ofertas (asociadas a tutores con nombres reales) más 3 adicionales
 * con títulos explícitos para cubrir los escenarios de búsqueda de HU17:
 *   - Búsqueda por título: "matemáticas", "cálculo", "programación"
 *   - Búsqueda por nombre de tutor: "Juan", "María", "Carlos"
 *   - Paginación: > 10 resultados para verificar totalPages > 1
 *   - Sin término: retorna todas las ofertas paginadas
 *
 * ── HU27: GET /api/ofertas?minPrice=&maxPrice= ───────────────────────────────
 * 6 ofertas adicionales con precios de borde definidos para validar los tres
 * escenarios de filtrado por precio del endpoint HU27:
 *   Zona baja  (< 10 USD): 5.00, 7.00
 *   Zona media (10–20 USD): 10.00, 15.00, 20.00
 *   Zona alta  (> 20 USD): 30.00
 *
 * Casos de prueba habilitados con estos precios:
 *   GET /api/ofertas?maxPrice=9          → devuelve las 2 de zona baja
 *   GET /api/ofertas?minPrice=10         → devuelve las de zona media y alta
 *   GET /api/ofertas?minPrice=10&maxPrice=20 → devuelve solo las 3 de zona media
 *   GET /api/ofertas?minPrice=25         → devuelve solo la de 30.00
 */
export async function seedOfertas(dataSource: DataSource): Promise<void> {
  const ofertaRepository = dataSource.getRepository(Oferta);

  const ofertas = [
    // 1 ─ Virtual / Matemáticas + Cálculo / precio medio
    {
      title: 'Cálculo Diferencial e Integral',
      price: 12.5,
      modality: 'Virtual',
      categories: ['Matemáticas', 'Cálculo'],
      description:
        'Tutorías especializadas en límites, derivadas, integrales y aplicaciones. Incluye ejercicios prácticos y resolución de exámenes anteriores.',
      rating: 4.8,
      reviewsCount: 24,
      tutorId: '550e8400-e29b-41d4-a716-446655440001',
    },
    // 2 ─ Virtual/Presencial / Matemáticas + Física / precio bajo
    {
      title: 'Física Mecánica - Dinámica y Estática',
      price: 10.0,
      modality: 'Virtual/Presencial',
      categories: ['Física', 'Matemáticas', 'Ingeniería'],
      description:
        'Fuerzas, movimiento, energía y momento. Resolución de problemas con enfoque práctico para ingeniería civil y mecánica.',
      rating: 4.6,
      reviewsCount: 18,
      tutorId: '550e8400-e29b-41d4-a716-446655440001',
    },
    // 3 ─ Virtual / Programación
    {
      title: 'Programación en Python - Desde Cero',
      price: 18.0,
      modality: 'Virtual',
      categories: ['Programación', 'Informática', 'Python'],
      description:
        'Python completo: sintaxis, estructuras de datos, POO, manejo de archivos y librerías NumPy y Pandas. Enfoque en ciencia de datos.',
      rating: 4.9,
      reviewsCount: 42,
      tutorId: '550e8400-e29b-41d4-a716-446655440002',
    },
    // 4 ─ Híbrida / Química
    {
      title: 'Química Orgánica - Reacciones y Mecanismos',
      price: 20.0,
      modality: 'Híbrida',
      categories: ['Química', 'Ciencias'],
      description:
        'Reacciones orgánicas, mecanismos, estereoquímica y nomenclatura IUPAC. Resolución guiada de problemas de examen.',
      rating: 4.3,
      reviewsCount: 11,
      tutorId: '550e8400-e29b-41d4-a716-446655440002',
    },
    // 5 ─ Virtual / Matemáticas + Álgebra
    {
      title: 'Álgebra Lineal y Matrices',
      price: 14.0,
      modality: 'Virtual',
      categories: ['Matemáticas', 'Álgebra'],
      description:
        'Espacios vectoriales, transformaciones lineales, diagonalización y valores propios. Aplicaciones en machine learning e ingeniería.',
      rating: 4.7,
      reviewsCount: 30,
      tutorId: '550e8400-e29b-41d4-a716-446655440003',
    },
    // 6 ─ Presencial / Idiomas
    {
      title: 'Inglés Técnico para Ingeniería',
      price: 8.0,
      modality: 'Presencial',
      categories: ['Idiomas', 'Inglés', 'Ingeniería'],
      description:
        'Comprensión de textos técnicos en inglés, redacción de papers y preparación de presentaciones académicas y profesionales.',
      rating: 4.0,
      reviewsCount: 9,
      tutorId: '550e8400-e29b-41d4-a716-446655440003',
    },
    // 7 ─ Virtual / Programación + Algoritmos
    {
      title: 'Estructuras de Datos y Algoritmos',
      price: 22.0,
      modality: 'Virtual',
      categories: ['Programación', 'Algoritmos', 'Informática'],
      description:
        'Listas, árboles, grafos, ordenamiento y búsqueda. Análisis de complejidad temporal y espacial (Big O) con ejemplos reales.',
      rating: 4.9,
      reviewsCount: 37,
      tutorId: '550e8400-e29b-41d4-a716-446655440004',
    },
    // 8 ─ Híbrida / Economía
    {
      title: 'Microeconomía - Teoría del Consumidor',
      price: 16.0,
      modality: 'Híbrida',
      categories: ['Economía', 'Finanzas'],
      description:
        'Elasticidad, utilidad, curvas de indiferencia y equilibrio de mercado. Teoría de juegos con casos prácticos y resolución de parciales.',
      rating: 3.8,
      reviewsCount: 7,
      tutorId: '550e8400-e29b-41d4-a716-446655440004',
    },
    // 9 ─ Presencial / Física + Ingeniería
    {
      title: 'Circuitos Eléctricos - Análisis AC/DC',
      price: 17.5,
      modality: 'Presencial',
      categories: ['Ingeniería', 'Eléctrica', 'Física'],
      description:
        'Leyes de Kirchhoff, análisis nodal y de mallas, teoremas de Thevenin y Norton, régimen sinusoidal y circuitos trifásicos.',
      rating: 4.5,
      reviewsCount: 22,
      tutorId: '550e8400-e29b-41d4-a716-446655440005',
    },
    // 10 ─ Virtual / Programación
    {
      title: 'Base de Datos y SQL Avanzado',
      price: 19.0,
      modality: 'Virtual',
      categories: ['Programación', 'Bases de Datos', 'SQL'],
      description:
        'Normalización, índices, transacciones, optimización de queries, stored procedures y triggers en PostgreSQL y MySQL.',
      rating: 4.6,
      reviewsCount: 28,
      tutorId: '550e8400-e29b-41d4-a716-446655440005',
    },
    // 11 ─ Virtual/Presencial / Matemáticas (precio en rango 10–20)
    {
      title: 'Cálculo Vectorial y Multivariable',
      price: 13.0,
      modality: 'Virtual/Presencial',
      categories: ['Matemáticas', 'Cálculo', 'Ingeniería'],
      description:
        'Integrales de línea y superficie, gradiente, divergencia y rotacional. Teoremas de Green, Stokes y Gauss con aplicaciones reales.',
      rating: 4.8,
      reviewsCount: 19,
      tutorId: '550e8400-e29b-41d4-a716-446655440001',
    },
    // 12 ─ Presencial / Economía (precio bajo)
    {
      title: 'Macroeconomía - PIB y Política Fiscal',
      price: 9.0,
      modality: 'Presencial',
      categories: ['Economía', 'Ciencias Sociales'],
      description:
        'Indicadores macroeconómicos, política monetaria y fiscal, modelos IS-LM y análisis de coyuntura económica nacional.',
      rating: 3.6,
      reviewsCount: 5,
      tutorId: '550e8400-e29b-41d4-a716-446655440004',
    },
    // 13 ─ Virtual / Programación + precio alto (>20)
    {
      title: 'Desarrollo Web con React y Node.js',
      price: 25.0,
      modality: 'Virtual',
      categories: ['Programación', 'Desarrollo Web', 'JavaScript'],
      description:
        'Construye aplicaciones web full-stack: React para el frontend, Node.js + Express para el backend, y PostgreSQL como base de datos.',
      rating: 4.9,
      reviewsCount: 53,
      tutorId: '550e8400-e29b-41d4-a716-446655440002',
    },

    // ─── HU17: Entradas adicionales para escenarios de búsqueda ─────────────
    // Estas ofertas amplían la cobertura del endpoint GET /api/ofertas/search:
    //   - Búsqueda por título con acento: "matemáticas"
    //   - Búsqueda por nombre de tutor: "Roberto"
    //   - Resultado vacío: término inexistente como "Astronomía" no coincide

    // 14 ─ HU17: búsqueda por título "Estadística" (tutor Roberto)
    {
      title: 'Estadística y Probabilidad Aplicada',
      price: 15.0,
      modality: 'Virtual',
      categories: ['Matemáticas', 'Estadística'],
      description:
        'Distribuciones de probabilidad, intervalos de confianza, pruebas de hipótesis y regresión lineal con aplicaciones en ingeniería.',
      rating: 4.4,
      reviewsCount: 14,
      tutorId: '550e8400-e29b-41d4-a716-446655440005',
    },
    // 15 ─ HU17: búsqueda por nombre de tutor "Ana Lucía"
    {
      title: 'Fundamentos de Algoritmos y Complejidad',
      price: 21.0,
      modality: 'Virtual',
      categories: ['Programación', 'Algoritmos', 'Informática'],
      description:
        'Análisis de complejidad, recursión, paradigmas de diseño (Divide & Conquer, Greedy, DP) y resolución de problemas de competencia.',
      rating: 4.8,
      reviewsCount: 20,
      tutorId: '550e8400-e29b-41d4-a716-446655440004',
    },
    // 16 ─ HU17: paginación — lleva el total a 16 para verificar totalPages=2 con limit=10
    {
      title: 'Termodinámica e Ingeniería Química',
      price: 18.5,
      modality: 'Presencial',
      categories: ['Química', 'Ingeniería', 'Física'],
      description:
        'Primera y segunda ley de la termodinámica, ciclos de potencia, transferencia de calor y diagramas de fase para procesos industriales.',
      rating: 4.2,
      reviewsCount: 8,
      tutorId: '550e8400-e29b-41d4-a716-446655440003',
    },

    // ─── HU27: Entradas con precios de borde para filtrado GET /api/ofertas ──
    // Zona baja (< 10 USD): valida maxPrice=9 y ausencia con minPrice=10
    // 17 ─ HU27: precio mínimo de catálogo (5 USD)
    {
      title: 'Introducción a la Lógica de Programación',
      price: 5.0,
      modality: 'Virtual',
      categories: ['Programación', 'Informática'],
      description:
        'Fundamentos de lógica computacional, diagramas de flujo y pseudocódigo. Ideal para estudiantes que inician su formación en programación.',
      rating: 4.1,
      reviewsCount: 6,
      tutorId: '550e8400-e29b-41d4-a716-446655440002',
    },
    // 18 ─ HU27: precio bajo (7 USD)
    {
      title: 'Nivelación de Matemáticas Básicas',
      price: 7.0,
      modality: 'Presencial',
      categories: ['Matemáticas', 'Nivelación'],
      description:
        'Repaso de aritmética, fracciones, ecuaciones lineales y geometría básica. Preparación para materias de primer ciclo universitario.',
      rating: 3.9,
      reviewsCount: 4,
      tutorId: '550e8400-e29b-41d4-a716-446655440001',
    },
    // Zona media (10–20 USD): valida minPrice=10&maxPrice=20
    // 19 ─ HU27: precio exacto 10 USD (borde inferior del rango medio)
    {
      title: 'Cálculo de una Variable - Nivel Básico',
      price: 10.0,
      modality: 'Virtual/Presencial',
      categories: ['Matemáticas', 'Cálculo'],
      description:
        'Funciones, límites y derivadas básicas con ejercicios resueltos. Orientado a estudiantes de primer ciclo de ingeniería y ciencias.',
      rating: 4.3,
      reviewsCount: 12,
      tutorId: '550e8400-e29b-41d4-a716-446655440001',
    },
    // 20 ─ HU27: precio medio exacto (15 USD)
    {
      title: 'Probabilidad y Estadística para Ingeniería',
      price: 15.0,
      modality: 'Virtual',
      categories: ['Matemáticas', 'Estadística', 'Ingeniería'],
      description:
        'Variables aleatorias, distribuciones de probabilidad, estimación de parámetros y pruebas de hipótesis con aplicaciones en procesos industriales.',
      rating: 4.5,
      reviewsCount: 17,
      tutorId: '550e8400-e29b-41d4-a716-446655440005',
    },
    // 21 ─ HU27: precio exacto 20 USD (borde superior del rango medio)
    {
      title: 'Diseño Orientado a Objetos con UML',
      price: 20.0,
      modality: 'Híbrida',
      categories: ['Programación', 'Software', 'Diseño'],
      description:
        'Principios SOLID, patrones de diseño GoF, diagramas UML de clases, secuencia y estado. Aplicaciones con Java y TypeScript.',
      rating: 4.7,
      reviewsCount: 21,
      tutorId: '550e8400-e29b-41d4-a716-446655440002',
    },
    // Zona alta (> 20 USD): valida minPrice=25
    // 22 ─ HU27: precio alto (30 USD) — borde superior del catálogo
    {
      title: 'Inteligencia Artificial y Machine Learning',
      price: 30.0,
      modality: 'Virtual',
      categories: ['Programación', 'IA', 'Machine Learning', 'Python'],
      description:
        'Algoritmos de aprendizaje supervisado y no supervisado, redes neuronales, árboles de decisión y evaluación de modelos con scikit-learn y TensorFlow.',
      rating: 5.0,
      reviewsCount: 61,
      tutorId: '550e8400-e29b-41d4-a716-446655440002',
    },
  ];

  console.log('📚 Insertando ofertas (HU03 + HU17 + HU27)...');

  for (const ofertaData of ofertas) {
    const oferta = ofertaRepository.create(ofertaData);
    await ofertaRepository.save(oferta);
  }

  console.log(
    `✅ ${ofertas.length} ofertas insertadas exitosamente (13 HU03 + 3 HU17 + 6 HU27)`,
  );
}
