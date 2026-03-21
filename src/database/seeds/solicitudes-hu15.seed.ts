import { DataSource } from 'typeorm';
import {
  SolicitudEntity,
  SolicitudEstado,
} from '../../solicitudes/entities/solicitud.entity';
import { Oferta } from '../../ofertas/domain/entities/oferta.entity';

/**
 * UUIDs sincronizados con tutors.seed.ts
 * ZERO_TUTOR_ID = tutor Daniel Valdiviezo (userId = '00000000-0000-4000-a000-000000000001')
 */
const ZERO_TUTOR_ID = '550e8400-e29b-41d4-a716-446655440000';
const TUTOR_001 = '550e8400-e29b-41d4-a716-446655440001'; // Juan Carlos Pérez

/**
 * Seed de Solicitudes para HU-15: Ver tutorías agendadas del tutor.
 *
 * Crea solicitudes con estado ACEPTADA/COMPLETADA en fechas del mes ACTUAL
 * (marzo 2026) y el mes siguiente (abril 2026) para que los endpoints de
 * la agenda devuelvan datos reales.
 *
 * GET /api/tutor/agenda/2026/3  → debe retornar sesiones de marzo 2026
 * GET /api/tutor/agenda/2026/4  → debe retornar sesiones de abril 2026
 *
 * Sesiones del ZERO_TUTOR_ID (Daniel Valdiviezo — tutor autenticado principal):
 *   - 4 ACEPTADA en marzo 2026 (virtual y presencial, distintos días)
 *   - 2 COMPLETADA en marzo 2026 (pasadas, status=COMPLETED en respuesta)
 *   - 3 ACEPTADA en abril 2026 (futuras, status=PENDING en respuesta)
 *
 * Sesiones del TUTOR_001 (Juan Carlos Pérez):
 *   - 2 ACEPTADA en marzo 2026 para probar aislamiento por tutorId
 *
 * DEBE ejecutarse DESPUÉS de seedSolicitudHU08.
 */
export async function seedSolicitudHU15(dataSource: DataSource): Promise<void> {
  const solicitudRepository = dataSource.getRepository(SolicitudEntity);
  const ofertaRepository = dataSource.getRepository(Oferta);

  // Buscar ofertas por título para obtener sus IDs reales
  const ofertaLabels = [
    { key: 'oferta-calc', titulo: 'Cálculo Diferencial e Integral' },
    { key: 'oferta-python', titulo: 'Programación en Python - Desde Cero' },
    { key: 'oferta-algebra', titulo: 'Álgebra Lineal y Matrices' },
    { key: 'oferta-web', titulo: 'Desarrollo Web con React y Node.js' },
    { key: 'oferta-bd', titulo: 'Base de Datos y SQL Avanzado' },
  ] as const;

  const ofertaIdByLabel = new Map<string, string>();
  for (const item of ofertaLabels) {
    const oferta = await ofertaRepository.findOne({
      where: { titulo: item.titulo },
      select: { id: true },
    });

    if (!oferta) {
      console.warn(
        `⚠️  HU-15 seed: no se encontró oferta con título "${item.titulo}". Se omitirá.`,
      );
      continue;
    }

    ofertaIdByLabel.set(item.key, oferta.id);
  }

  /**
   * Helper para generar un ofertaId válido o el ID de HU32 como fallback.
   * Esto previene errores FK si algún título no coincide exactamente.
   */
  const getOfertaId = (key: string): string => {
    return (
      ofertaIdByLabel.get(key) ?? 'b2c3d4e5-f6a7-4890-b234-567890abcdef' // HU32_OFERTA_DETALLE_ID
    );
  };

  const solicitudes: Partial<SolicitudEntity>[] = [
    // ─────────────────────────────────────────────────────────────
    // MARZO 2026 — ACEPTADAS (status=PENDING porque están en el futuro)
    // ─────────────────────────────────────────────────────────────

    // S1 — Tutoría Virtual — Cálculo — Lunes 23 marzo 2026 — 14:00
    {
      estudianteId: 'estudiante-hu15-001',
      ofertaId: getOfertaId('oferta-calc'),
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'Valeria Sánchez',
      mensaje:
        'Necesito repasar integrales dobles y triples para el examen final del martes. Me cuesta mucho visualizar los cambios de variable.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2026-03-23', hora: '14:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: 'https://meet.google.com/poli-calc-001',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-03-20T10:00:00.000Z'),
    },

    // S2 — Tutoría Presencial — Python — Martes 24 marzo 2026 — 10:00
    {
      estudianteId: 'estudiante-hu15-002',
      ofertaId: getOfertaId('oferta-python'),
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'Andrés Mora',
      mensaje:
        'Quiero aprender a trabajar con pandas y matplotlib para mi proyecto de análisis de datos. Tengo el dataset listo.',
      modalidad: 'Presencial',
      horarios: [{ fecha: '2026-03-24', hora: '10:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: null,
      acceptedMeetingLocation:
        'Edificio Informática, Laboratorio Python, Piso 2',
      acceptedAt: new Date('2026-03-20T11:30:00.000Z'),
    },

    // S3 — Tutoría Virtual — React+Node — Jueves 26 marzo 2026 — 16:00
    {
      estudianteId: 'estudiante-hu15-003',
      ofertaId: getOfertaId('oferta-web'),
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'Camila Torres',
      mensaje:
        'Tengo problemas con el manejo de autenticación JWT en mi app de React. Mi backend está en NestJS y no sé cómo integrarlo correctamente.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2026-03-26', hora: '16:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: 'https://zoom.us/j/poli-web-003',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-03-20T14:00:00.000Z'),
    },

    // S4 — Tutoría Presencial — Álgebra — Viernes 27 marzo 2026 — 09:00
    {
      estudianteId: 'estudiante-hu15-004',
      ofertaId: getOfertaId('oferta-algebra'),
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'Felipe Ortiz',
      mensaje:
        'Necesito ayuda con valores y vectores propios (eigenvalores y eigenvectores). Tengo parcial el próximo lunes.',
      modalidad: 'Presencial',
      horarios: [{ fecha: '2026-03-27', hora: '09:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: null,
      acceptedMeetingLocation: 'Biblioteca Central EPN, Sala Grupal 4',
      acceptedAt: new Date('2026-03-20T16:00:00.000Z'),
    },

    // ─────────────────────────────────────────────────────────────
    // MARZO 2026 — COMPLETADAS (sesiones pasadas → status=COMPLETED)
    // ─────────────────────────────────────────────────────────────

    // S5 — COMPLETADA — Cálculo — Lunes 16 marzo 2026 — 10:00
    {
      estudianteId: 'estudiante-hu15-005',
      ofertaId: getOfertaId('oferta-calc'),
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'Gabriela Reyes',
      mensaje:
        'Quedé con muchas dudas sobre la regla de la cadena en funciones compuestas. ¿Podemos repasar los ejercicios del libro?',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2026-03-16', hora: '10:00' }],
      estado: SolicitudEstado.COMPLETADA,
      acceptedMeetingLink: 'https://meet.google.com/poli-calc-005',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-03-13T09:00:00.000Z'),
      completedAt: new Date('2026-03-16T11:00:00.000Z'),
    },

    // S6 — COMPLETADA — BD — Miércoles 18 marzo 2026 — 15:00
    {
      estudianteId: 'estudiante-hu15-006',
      ofertaId: getOfertaId('oferta-bd'),
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'Luis Naranjo',
      mensaje:
        'Tengo problemas optimizando queries con JOINs complejos en PostgreSQL. Mi consulta con 4 JOINs tarda más de 5 segundos.',
      modalidad: 'Presencial',
      horarios: [{ fecha: '2026-03-18', hora: '15:00' }],
      estado: SolicitudEstado.COMPLETADA,
      acceptedMeetingLink: null,
      acceptedMeetingLocation: 'Lab Bases de Datos, Edificio Sistemas, Piso 3',
      acceptedAt: new Date('2026-03-15T10:00:00.000Z'),
      completedAt: new Date('2026-03-18T16:30:00.000Z'),
    },

    // ─────────────────────────────────────────────────────────────
    // ABRIL 2026 — ACEPTADAS (futuras → status=PENDING)
    // ─────────────────────────────────────────────────────────────

    // S7 — ACEPTADA Virtual — Python — Miércoles 1 abril 2026 — 11:00
    {
      estudianteId: 'estudiante-hu15-007',
      ofertaId: getOfertaId('oferta-python'),
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'Sofía Guerrero',
      mensaje:
        'Estoy aprendiendo machine learning con scikit-learn y necesito entender cómo funciona la cross-validation y el GridSearchCV.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2026-04-01', hora: '11:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: 'https://teams.microsoft.com/poli-python-007',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-03-19T08:00:00.000Z'),
    },

    // S8 — ACEPTADA Presencial — Web — Viernes 3 abril 2026 — 14:00
    {
      estudianteId: 'estudiante-hu15-008',
      ofertaId: getOfertaId('oferta-web'),
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'Mateo Ríos',
      mensaje:
        'Quiero aprender a deployar una app Next.js en Vercel con variables de entorno y conexión a Supabase. ¿Podemos hacer un ejemplo completo?',
      modalidad: 'Presencial',
      horarios: [{ fecha: '2026-04-03', hora: '14:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: null,
      acceptedMeetingLocation:
        'Cafetería EPN, Mesa al fondo junto a las ventanas',
      acceptedAt: new Date('2026-03-19T14:00:00.000Z'),
    },

    // S9 — ACEPTADA Virtual — Álgebra — Lunes 7 abril 2026 — 17:00
    {
      estudianteId: 'estudiante-hu15-009',
      ofertaId: getOfertaId('oferta-algebra'),
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'Daniela Castro',
      mensaje:
        'Tengo dudas sobre la descomposición LU y la factorización de Cholesky. Necesito aplicarlos en mi tarea de métodos numéricos.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2026-04-07', hora: '17:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: 'https://meet.google.com/poli-algebra-009',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-03-20T09:00:00.000Z'),
    },

    // ─────────────────────────────────────────────────────────────
    // SESIONES DE TUTOR_001 — para probar aislamiento (no deben
    // aparecer en la agenda del tutor ZERO_TUTOR_ID)
    // ─────────────────────────────────────────────────────────────

    // S10 — TUTOR_001 — no debe aparecer en agenda de ZERO_TUTOR_ID
    {
      estudianteId: 'estudiante-hu15-010',
      ofertaId: getOfertaId('oferta-calc'),
      tutorId: TUTOR_001,
      nombreEstudiante: 'Diego Vásquez',
      mensaje: 'Repaso de derivadas e integrales para el examen.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2026-03-25', hora: '11:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: 'https://meet.google.com/tutor001-session',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-03-20T08:00:00.000Z'),
    },
  ];

  console.log('🌱 Insertando solicitudes HU-15 (agenda del tutor)...');
  for (const s of solicitudes) {
    const entity = solicitudRepository.create(s);
    await solicitudRepository.save(entity);
  }
  console.log(`✅ ${solicitudes.length} solicitudes HU-15 insertadas`);
  console.log(
    `   → ${ZERO_TUTOR_ID} tiene 4 ACEPTADAS + 2 COMPLETADAS en marzo 2026`,
  );
  console.log(`   → ${ZERO_TUTOR_ID} tiene 3 ACEPTADAS en abril 2026`);
}
