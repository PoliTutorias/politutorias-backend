import { DataSource } from 'typeorm';
import {
  SolicitudEntity,
  SolicitudEstado,
} from '../../solicitudes/entities/solicitud.entity';
import { Oferta } from '../../ofertas/domain/entities/oferta.entity';
import { ReviewEntity } from '../../tutorias/entities/review.entity';

/**
 * UUIDs sincronizados con tutors.seed.ts
 *
 * TUTOR_001  = Juan Carlos Pérez   (550e8400-e29b-41d4-a716-446655440001)
 * TUTOR_003  = Carlos Alberto Rodríguez (550e8400-e29b-41d4-a716-446655440003)
 * TUTOR_005  = Roberto Alejandro Silva  (550e8400-e29b-41d4-a716-446655440005)
 *
 * IDs de solicitudes: UUIDs fijos v4 (no strings libres) para que PostgreSQL
 * los acepte como tipo uuid en la columna PrimaryGeneratedColumn('uuid').
 *
 * Estudiante principal: 'estudiante-hu40-001'
 *  (varchar libre — la columna estudianteId no es FK hacia users)
 *
 * Ofertas: se resuelven por título dinámicamente en ejecución,
 * igual que el patrón de HU-11 / HU-15.
 */

const TUTOR_001 = '550e8400-e29b-41d4-a716-446655440001'; // Juan Carlos Pérez
const TUTOR_002 = '550e8400-e29b-41d4-a716-446655440002'; // María Fernanda González
const TUTOR_003 = '550e8400-e29b-41d4-a716-446655440003'; // Carlos Alberto Rodríguez
const TUTOR_004 = '550e8400-e29b-41d4-a716-446655440004'; // Ana Lucía Martínez
const TUTOR_005 = '550e8400-e29b-41d4-a716-446655440005'; // Roberto Alejandro Silva
const TUTOR_006 = '550e8400-e29b-41d4-a716-446655440006'; // Laura Daniela Torres

/**
 * ID del estudiante de prueba para HU-40.
 * DEBE coincidir con req.user.id del JWT (= UserEntity.id de users.seed.ts).
 * Patricio Chancusig → SEED_USER_STUDENT_ID = '00000000-0000-4000-a000-000000000002'
 */
export const ESTUDIANTE_HU40_ID = '00000000-0000-4000-a000-000000000002';

/**
 * UUIDs fijos de las solicitudes HU-40.
 * Deben ser UUIDs v4 válidos para que PostgreSQL los acepte en columnas tipo uuid.
 */
const UUID_COMP_001 = 'a1b2c3d4-0001-4000-8001-aa0000000001';
const UUID_COMP_002 = 'a1b2c3d4-0002-4000-8002-aa0000000002';
const UUID_COMP_003 = 'a1b2c3d4-0003-4000-8003-aa0000000003';
const UUID_COMP_004 = 'a1b2c3d4-0004-4000-8004-aa0000000004';
const UUID_NS_001 = 'a1b2c3d4-0005-4000-8005-aa0000000005';
const UUID_NS_002 = 'a1b2c3d4-0006-4000-8006-aa0000000006';
const UUID_ACC_001 = 'a1b2c3d4-0007-4000-8007-aa0000000007';
const UUID_OTHER = 'a1b2c3d4-0099-4000-8099-aa0000000099';

// ── HU-22: Solicitudes extra para paginación de reseñas ──────────────────────
// 7 solicitudes adicionales por tutor → cada tutor queda con ≥8 reseñas,
// suficiente para probar el botón "Ver más reseñas" (paginación de 5).
// Estudiantes ficticios S010–S016 (no son users reales, estudianteId es varchar libre).
const UUID_HU22_T1_001 = 'a1b2c3d4-0030-4000-8030-aa0000000030';
const UUID_HU22_T1_002 = 'a1b2c3d4-0031-4000-8031-aa0000000031';
const UUID_HU22_T1_003 = 'a1b2c3d4-0032-4000-8032-aa0000000032';
const UUID_HU22_T1_004 = 'a1b2c3d4-0033-4000-8033-aa0000000033';
const UUID_HU22_T1_005 = 'a1b2c3d4-0034-4000-8034-aa0000000034';
const UUID_HU22_T1_006 = 'a1b2c3d4-0035-4000-8035-aa0000000035';
const UUID_HU22_T1_007 = 'a1b2c3d4-0036-4000-8036-aa0000000036';
const UUID_HU22_T3_001 = 'a1b2c3d4-0040-4000-8040-aa0000000040';
const UUID_HU22_T3_002 = 'a1b2c3d4-0041-4000-8041-aa0000000041';
const UUID_HU22_T3_003 = 'a1b2c3d4-0042-4000-8042-aa0000000042';
const UUID_HU22_T3_004 = 'a1b2c3d4-0043-4000-8043-aa0000000043';
const UUID_HU22_T3_005 = 'a1b2c3d4-0044-4000-8044-aa0000000044';
const UUID_HU22_T3_006 = 'a1b2c3d4-0045-4000-8045-aa0000000045';
const UUID_HU22_T3_007 = 'a1b2c3d4-0046-4000-8046-aa0000000046';
const UUID_HU22_T5_001 = 'a1b2c3d4-0050-4000-8050-aa0000000050';
const UUID_HU22_T5_002 = 'a1b2c3d4-0051-4000-8051-aa0000000051';
const UUID_HU22_T5_003 = 'a1b2c3d4-0052-4000-8052-aa0000000052';
const UUID_HU22_T5_004 = 'a1b2c3d4-0053-4000-8053-aa0000000053';
const UUID_HU22_T5_005 = 'a1b2c3d4-0054-4000-8054-aa0000000054';
const UUID_HU22_T5_006 = 'a1b2c3d4-0055-4000-8055-aa0000000055';
const UUID_HU22_T5_007 = 'a1b2c3d4-0056-4000-8056-aa0000000056';

// ── HU-10: 5 tutorías COMPLETADAS adicionales SIN reseña ─────────────────────
// Permiten probar el botón "Calificar" desde el historial del estudiante.
const UUID_COMP_CAL_001 = 'a1b2c3d4-0010-4000-8010-aa0000000010';
const UUID_COMP_CAL_002 = 'a1b2c3d4-0011-4000-8011-aa0000000011';
const UUID_COMP_CAL_003 = 'a1b2c3d4-0012-4000-8012-aa0000000012';
const UUID_COMP_CAL_004 = 'a1b2c3d4-0013-4000-8013-aa0000000013';
const UUID_COMP_CAL_005 = 'a1b2c3d4-0014-4000-8014-aa0000000014';

// ── HU-11: 3 tutorías ACEPTADAS futuras ──────────────────────────────────────
// Permiten probar la sección "Próximas" de la agenda del estudiante.
// Fechas en 2099 para garantizar que siempre sean futuras independientemente
// de cuándo se ejecute el seed.
const UUID_ACE_PROX_001 = 'a1b2c3d4-0020-4000-8020-aa0000000020';
const UUID_ACE_PROX_002 = 'a1b2c3d4-0021-4000-8021-aa0000000021';
const UUID_ACE_PROX_003 = 'a1b2c3d4-0022-4000-8022-aa0000000022';

// Escenarios HU-10 para pruebas manuales/e2e del endpoint POST /api/reviews.
export const HU10_SCENARIOS = {
  // Exito: tutoría completada del estudiante autenticado y sin reseña previa.
  SUCCESS_TUTORIA_ID: UUID_COMP_003,
  // Error 400: tutoría no completada.
  NOT_COMPLETED_TUTORIA_ID: UUID_ACC_001,
  // Error 400: tutoría ya calificada.
  DUPLICATE_TUTORIA_ID: UUID_COMP_001,
  // Error 404: tutoría de otro estudiante.
  NOT_OWNER_TUTORIA_ID: UUID_OTHER,
} as const;

/**
 * Seed de Solicitudes y Reseñas para HU-40 / HU-10 / HU-11 — Historial y Agenda del estudiante.
 *
 * Crea solicitudes en distintos estados para el estudiante Patricio Chancusig.
 *
 * Sesiones del estudiante (Patricio Chancusig — ESTUDIANTE_HU40_ID):
 *   HU-40 / HU-10 (Historial):
 *   - 9 COMPLETADAS (3 con reseña calificada, 6 sin reseña → botón "Calificar")
 *   - 2 NO_SHOW (inasistencias reportadas por el tutor)
 *   - 1 ACEPTADA con fecha pasada (escenario HU-10: no calificable por estado)
 *
 *   HU-11 (Agenda — sección "Próximas"):
 *   - 3 ACEPTADAS con fechas en 2099 (siempre futuras)
 *
 * Sesiones de otro estudiante (aislamiento):
 *   - 1 COMPLETADA para 'estudiante-hu40-999' (no aparece en historial)
 *
 * DEBE ejecutarse DESPUÉS de seedSolicitudHU11 (última en la cadena).
 */
export async function seedHistorialEstudiante(
  dataSource: DataSource,
): Promise<void> {
  const solicitudRepository = dataSource.getRepository(SolicitudEntity);
  const reviewRepository = dataSource.getRepository(ReviewEntity);
  const ofertaRepository = dataSource.getRepository(Oferta);

  // ── Resolución dinámica de ofertaIds por título ────────────────────────────
  // Mismo patrón que HU-15 y HU-11: buscar por título para tolerar IDs
  // auto-generados por la BD (sin UUID fijo en seedOfertas).
  const ofertaLabels = [
    { key: 'oferta-algebra', titulo: 'Álgebra Lineal y Matrices' },
    { key: 'oferta-fisica', titulo: 'Física Mecánica - Dinámica y Estática' },
    { key: 'oferta-calc', titulo: 'Cálculo Diferencial e Integral' },
    {
      key: 'oferta-circuitos',
      titulo: 'Circuitos Eléctricos - Análisis AC/DC',
    },
    { key: 'oferta-python', titulo: 'Programación en Python - Desde Cero' },
    { key: 'oferta-sql', titulo: 'Base de Datos y SQL Avanzado' },
    { key: 'oferta-algoritmos', titulo: 'Estructuras de Datos y Algoritmos' },
    { key: 'oferta-vectorial', titulo: 'Cálculo Vectorial y Multivariable' },
    { key: 'oferta-react', titulo: 'Desarrollo Web con React y Node.js' },
    { key: 'oferta-ingles', titulo: 'Inglés Técnico para Ingeniería' },
  ] as const;

  const ofertaIdByLabel = new Map<string, string>();
  for (const item of ofertaLabels) {
    const oferta = await ofertaRepository.findOne({
      where: { titulo: item.titulo },
      select: { id: true },
    });

    if (!oferta) {
      console.warn(
        `⚠️  HU-40 seed: no se encontró oferta con título "${item.titulo}". Se omitirá.`,
      );
      continue;
    }

    ofertaIdByLabel.set(item.key, oferta.id);
  }

  /** Devuelve el ofertaId real o el UUID fijo de HU-32 como fallback. */
  const getOfertaId = (key: string): string =>
    ofertaIdByLabel.get(key) ?? 'b2c3d4e5-f6a7-4890-b234-567890abcdef';

  // ── Definición de solicitudes ──────────────────────────────────────────────
  // Se usan UUIDs v4 válidos como IDs fijos para poder referenciarlos
  // en las reseñas (reviews) sin necesidad de un segundo query.
  const solicitudesData: (Partial<SolicitudEntity> & { id: string })[] = [
    // ─────────────────────────────────────────────────────────────────────────
    // TUTORÍAS COMPLETADAS
    // ─────────────────────────────────────────────────────────────────────────

    // C1 — Completada · Álgebra Lineal · Juan Carlos Pérez · Presencial
    //   → Equivalente tarjeta frontend: "Álgebra Lineal / Juan Pérez / Completada"
    //   → Tiene reseña (R1)
    {
      id: UUID_COMP_001,
      estudianteId: ESTUDIANTE_HU40_ID,
      ofertaId: getOfertaId('oferta-algebra'),
      tutorId: TUTOR_001,
      nombreEstudiante: 'María García',
      mensaje: 'Ayuda con matrices y espacios vectoriales.',
      modalidad: 'Presencial',
      horarios: [{ fecha: '2026-03-05', hora: '14:00' }],
      estado: SolicitudEstado.COMPLETADA,
      acceptedMeetingLink: null,
      acceptedMeetingLocation: 'Biblioteca Central, Sala 3',
      acceptedAt: new Date('2026-03-04T08:00:00.000Z'),
      completedAt: new Date('2026-03-05T15:00:00.000Z'),
      noShowAt: null,
    },

    // C2 — Completada · Física/Dinámica · Carlos Rodríguez · Virtual
    //   → Equivalente tarjeta frontend: "Dinámica / David Gómez / Completada" (1 marzo 2026, 10:00)
    //   → La materia "Dinámica" corresponde a "Física Mecánica - Dinámica y Estática"
    //   → Tiene reseña (R2)
    {
      id: UUID_COMP_002,
      estudianteId: ESTUDIANTE_HU40_ID,
      ofertaId: getOfertaId('oferta-fisica'),
      tutorId: TUTOR_003,
      nombreEstudiante: 'María García',
      mensaje: 'Repaso de cinemática de cuerpos rígidos.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2026-03-01', hora: '10:00' }],
      estado: SolicitudEstado.COMPLETADA,
      acceptedMeetingLink: 'https://meet.google.com/poli-fisica-hu40-002',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-02-28T10:00:00.000Z'),
      completedAt: new Date('2026-03-01T11:00:00.000Z'),
      noShowAt: null,
    },

    // C3 — Completada · Cálculo · Juan Carlos Pérez · Virtual
    //   → SIN reseña → frontend muestra botón "Calificar" habilitado
    {
      id: UUID_COMP_003,
      estudianteId: ESTUDIANTE_HU40_ID,
      ofertaId: getOfertaId('oferta-calc'),
      tutorId: TUTOR_001,
      nombreEstudiante: 'María García',
      mensaje: 'Necesito repasar límites y derivadas.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2026-03-10', hora: '16:00' }],
      estado: SolicitudEstado.COMPLETADA,
      acceptedMeetingLink: 'https://zoom.us/j/poli-calc-hu40-003',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-03-09T10:00:00.000Z'),
      completedAt: new Date('2026-03-10T17:00:00.000Z'),
      noShowAt: null,
    },

    // C4 — Completada · Circuitos · Roberto Silva · Presencial
    //   → Tiene reseña (R3)
    {
      id: UUID_COMP_004,
      estudianteId: ESTUDIANTE_HU40_ID,
      ofertaId: getOfertaId('oferta-circuitos'),
      tutorId: TUTOR_005,
      nombreEstudiante: 'María García',
      mensaje: 'Análisis de redes por mallas y nodos.',
      modalidad: 'Presencial',
      horarios: [{ fecha: '2026-02-20', hora: '09:00' }],
      estado: SolicitudEstado.COMPLETADA,
      acceptedMeetingLink: null,
      acceptedMeetingLocation: 'Lab Eléctrica, Edificio FIEE, Piso 1',
      acceptedAt: new Date('2026-02-19T08:00:00.000Z'),
      completedAt: new Date('2026-02-20T10:30:00.000Z'),
      noShowAt: null,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // TUTORÍAS NO_SHOW (Inasistencia)
    // ─────────────────────────────────────────────────────────────────────────

    // N1 — Inasistencia · Álgebra Lineal · Juan Carlos Pérez · Presencial
    //   → Equivalente tarjeta frontend: "Álgebra Lineal / Juan Pérez / Inasistencia"
    //     (20 enero 2026 a las 14:00, mensaje "Dudas sobre transformaciones lineales.")
    {
      id: UUID_NS_001,
      estudianteId: ESTUDIANTE_HU40_ID,
      ofertaId: getOfertaId('oferta-algebra'),
      tutorId: TUTOR_001,
      nombreEstudiante: 'María García',
      mensaje: 'Dudas sobre transformaciones lineales.',
      modalidad: 'Presencial',
      horarios: [{ fecha: '2026-01-20', hora: '14:00' }],
      estado: SolicitudEstado.NO_SHOW,
      acceptedMeetingLink: null,
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-01-18T10:00:00.000Z'),
      completedAt: null,
      noShowAt: new Date('2026-01-20T14:30:00.000Z'),
    },

    // N2 — Inasistencia · Python · Carlos Rodríguez · Virtual
    {
      id: UUID_NS_002,
      estudianteId: ESTUDIANTE_HU40_ID,
      ofertaId: getOfertaId('oferta-python'),
      tutorId: TUTOR_003,
      nombreEstudiante: 'María García',
      mensaje: 'Quiero aprender pandas y matplotlib para mi proyecto de datos.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2026-02-10', hora: '11:00' }],
      estado: SolicitudEstado.NO_SHOW,
      acceptedMeetingLink: 'https://meet.google.com/poli-python-hu40-ns',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-02-08T09:00:00.000Z'),
      completedAt: null,
      noShowAt: new Date('2026-02-10T11:30:00.000Z'),
    },

    // A1 — ACEPTADA · Física · Carlos Rodríguez · Virtual
    //   → Escenario HU-10: no permite crear reseña porque no está COMPLETADA.
    {
      id: UUID_ACC_001,
      estudianteId: ESTUDIANTE_HU40_ID,
      ofertaId: getOfertaId('oferta-fisica'),
      tutorId: TUTOR_003,
      nombreEstudiante: 'María García',
      mensaje: 'Pendiente para práctica de dinámica.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2026-03-30', hora: '10:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: 'https://zoom.us/j/poli-fisica-hu10-a1',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-03-28T09:00:00.000Z'),
      completedAt: null,
      noShowAt: null,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // HU-10: 5 TUTORÍAS COMPLETADAS ADICIONALES SIN RESEÑA
    // Permiten probar el botón "Calificar" (dejar reseña) desde el historial
    // ─────────────────────────────────────────────────────────────────────────

    // CAL1 — Completada · SQL Avanzado · Roberto Silva · Virtual
    //   → SIN reseña → botón "Calificar" habilitado
    {
      id: UUID_COMP_CAL_001,
      estudianteId: ESTUDIANTE_HU40_ID,
      ofertaId: getOfertaId('oferta-sql'),
      tutorId: TUTOR_005,
      nombreEstudiante: 'Patricio Chancusig',
      mensaje:
        'Necesito ayuda con queries avanzados y optimización en PostgreSQL.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2026-03-12', hora: '10:00' }],
      estado: SolicitudEstado.COMPLETADA,
      acceptedMeetingLink: 'https://zoom.us/j/poli-sql-hu10-cal1',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-03-11T08:00:00.000Z'),
      completedAt: new Date('2026-03-12T11:00:00.000Z'),
      noShowAt: null,
    },

    // CAL2 — Completada · Estructuras de Datos · Ana Lucía Martínez · Presencial
    //   → SIN reseña → botón "Calificar" habilitado
    {
      id: UUID_COMP_CAL_002,
      estudianteId: ESTUDIANTE_HU40_ID,
      ofertaId: getOfertaId('oferta-algoritmos'),
      tutorId: TUTOR_004,
      nombreEstudiante: 'Patricio Chancusig',
      mensaje: 'Repaso de árboles binarios y grafos para el examen final.',
      modalidad: 'Presencial',
      horarios: [{ fecha: '2026-03-14', hora: '15:00' }],
      estado: SolicitudEstado.COMPLETADA,
      acceptedMeetingLink: null,
      acceptedMeetingLocation: 'Aula 201, Edificio FIS, Piso 2',
      acceptedAt: new Date('2026-03-13T09:00:00.000Z'),
      completedAt: new Date('2026-03-14T16:00:00.000Z'),
      noShowAt: null,
    },

    // CAL3 — Completada · Cálculo Vectorial · Juan Carlos Pérez · Virtual
    //   → SIN reseña → botón "Calificar" habilitado
    {
      id: UUID_COMP_CAL_003,
      estudianteId: ESTUDIANTE_HU40_ID,
      ofertaId: getOfertaId('oferta-vectorial'),
      tutorId: TUTOR_001,
      nombreEstudiante: 'Patricio Chancusig',
      mensaje: 'Ayuda con integrales de línea y el teorema de Stokes.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2026-03-18', hora: '11:00' }],
      estado: SolicitudEstado.COMPLETADA,
      acceptedMeetingLink: 'https://meet.google.com/poli-vectorial-hu10',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-03-17T08:00:00.000Z'),
      completedAt: new Date('2026-03-18T12:00:00.000Z'),
      noShowAt: null,
    },

    // CAL4 — Completada · React y Node.js · María Fernanda González · Virtual
    //   → SIN reseña → botón "Calificar" habilitado
    {
      id: UUID_COMP_CAL_004,
      estudianteId: ESTUDIANTE_HU40_ID,
      ofertaId: getOfertaId('oferta-react'),
      tutorId: TUTOR_002,
      nombreEstudiante: 'Patricio Chancusig',
      mensaje: 'Necesito entender el patrón de Server Components en Next.js.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2026-03-20', hora: '14:00' }],
      estado: SolicitudEstado.COMPLETADA,
      acceptedMeetingLink: 'https://zoom.us/j/poli-react-hu10-cal4',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-03-19T10:00:00.000Z'),
      completedAt: new Date('2026-03-20T15:00:00.000Z'),
      noShowAt: null,
    },

    // CAL5 — Completada · Inglés Técnico · Laura Daniela Torres · Presencial
    //   → SIN reseña → botón "Calificar" habilitado
    {
      id: UUID_COMP_CAL_005,
      estudianteId: ESTUDIANTE_HU40_ID,
      ofertaId: getOfertaId('oferta-ingles'),
      tutorId: TUTOR_006,
      nombreEstudiante: 'Patricio Chancusig',
      mensaje: 'Preparación para presentación en inglés del proyecto de grado.',
      modalidad: 'Presencial',
      horarios: [{ fecha: '2026-03-22', hora: '09:00' }],
      estado: SolicitudEstado.COMPLETADA,
      acceptedMeetingLink: null,
      acceptedMeetingLocation: 'Sala de Idiomas, Edificio FCA, Piso 3',
      acceptedAt: new Date('2026-03-21T08:00:00.000Z'),
      completedAt: new Date('2026-03-22T10:00:00.000Z'),
      noShowAt: null,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // HU-11: TUTORÍAS ACEPTADAS FUTURAS (sección "Próximas" de la agenda)
    // Fechas en 2099 → siempre futuras, independiente de cuando ejecute el seed
    // ─────────────────────────────────────────────────────────────────────────

    // PROX1 — Aceptada · Cálculo Diferencial · Juan Carlos Pérez · Virtual
    //   Fecha: lunes 14 de abril 2026 — 10:00
    {
      id: UUID_ACE_PROX_001,
      estudianteId: ESTUDIANTE_HU40_ID,
      ofertaId: getOfertaId('oferta-calc'),
      tutorId: TUTOR_001,
      nombreEstudiante: 'Patricio Chancusig',
      mensaje: 'Repasar integrales y derivadas para el parcial final.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2026-04-14', hora: '10:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: 'https://zoom.us/j/poli-calc-prox-001',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-04-13T08:00:00.000Z'),
      completedAt: null,
      noShowAt: null,
    },

    // PROX2 — Aceptada · Python · María Fernanda González · Virtual
    //   Fecha: miércoles 16 de abril 2026 — 14:00
    {
      id: UUID_ACE_PROX_002,
      estudianteId: ESTUDIANTE_HU40_ID,
      ofertaId: getOfertaId('oferta-python'),
      tutorId: TUTOR_002,
      nombreEstudiante: 'Patricio Chancusig',
      mensaje:
        'Quiero aprender pandas y visualización de datos con matplotlib.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2026-04-16', hora: '14:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: 'https://meet.google.com/poli-python-prox-002',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-04-15T10:00:00.000Z'),
      completedAt: null,
      noShowAt: null,
    },

    // PROX3 — Aceptada · Álgebra Lineal · Carlos Rodríguez · Presencial
    //   Fecha: sábado 19 de abril 2026 — 09:00
    {
      id: UUID_ACE_PROX_003,
      estudianteId: ESTUDIANTE_HU40_ID,
      ofertaId: getOfertaId('oferta-algebra'),
      tutorId: TUTOR_003,
      nombreEstudiante: 'Patricio Chancusig',
      mensaje:
        'Necesito ayuda con vectores propios y diagonalización de matrices.',
      modalidad: 'Presencial',
      horarios: [{ fecha: '2026-04-19', hora: '09:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: null,
      acceptedMeetingLocation: 'Biblioteca Central, Piso 2, Sala 4',
      acceptedAt: new Date('2026-04-18T08:00:00.000Z'),
      completedAt: null,
      noShowAt: null,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SESIÓN DE OTRO ESTUDIANTE (aislamiento)
    // No debe aparecer en el historial de 'estudiante-hu40-001'
    // ─────────────────────────────────────────────────────────────────────────

    {
      id: UUID_OTHER,
      estudianteId: 'estudiante-hu40-999',
      ofertaId: getOfertaId('oferta-calc'),
      tutorId: TUTOR_001,
      nombreEstudiante: 'Otro Estudiante',
      mensaje: 'Sesión de otro estudiante para probar aislamiento HU-40.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2026-03-15', hora: '09:00' }],
      estado: SolicitudEstado.COMPLETADA,
      acceptedMeetingLink: 'https://zoom.us/j/poli-other-hu40',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-03-14T08:00:00.000Z'),
      completedAt: new Date('2026-03-15T10:00:00.000Z'),
      noShowAt: null,
    },
  ];

  console.log('🌱 Insertando solicitudes HU-40 (historial del estudiante)...');
  for (const s of solicitudesData) {
    const entity = solicitudRepository.create(s);
    await solicitudRepository.save(entity);
  }
  console.log(
    `✅ ${solicitudesData.length} solicitudes HU-40/HU-11 insertadas`,
  );
  console.log(
    `   → ${ESTUDIANTE_HU40_ID} tiene 9 COMPLETADAS (6 sin reseña → "Calificar") + 2 NO_SHOW + 1 ACEPTADA pasada + 3 ACEPTADAS futuras`,
  );
  console.log(`   → estudiante-hu40-999 tiene 1 sesión (aislamiento)`);
  // ── Reseñas (ReviewEntity) ─────────────────────────────────────────────────
  // Solo se crean reseñas para las solicitudes COMPLETADAS ya calificadas.
  // UUID_COMP_003 (Cálculo) queda sin reseña → frontend muestra botón "Calificar".
  const reviews: Partial<ReviewEntity>[] = [
    // R1 — Álgebra Lineal con Juan Carlos Pérez (C1)
    {
      solicitudId: UUID_COMP_001,
      estudianteId: ESTUDIANTE_HU40_ID,
      tutorId: TUTOR_001,
      rating: 5,
      comment:
        'Muy buena sesión de álgebra lineal. Explica con mucha claridad.',
    },

    // R2 — Física/Dinámica con Carlos Rodríguez (C2)
    //   → Corresponde a la tarjeta "Dinámica / David Gómez / Completada" del mockup
    {
      solicitudId: UUID_COMP_002,
      estudianteId: ESTUDIANTE_HU40_ID,
      tutorId: TUTOR_003,
      rating: 4,
      comment: 'Repaso de cinemática muy completo. Buen ritmo de clase.',
    },

    // R3 — Circuitos con Roberto Silva (C4)
    {
      solicitudId: UUID_COMP_004,
      estudianteId: ESTUDIANTE_HU40_ID,
      tutorId: TUTOR_005,
      rating: 4,
      comment: 'Buen dominio del tema. Me ayudó mucho con el análisis nodal.',
    },
  ];

  console.log('🌱 Insertando reseñas HU-40...');
  for (const r of reviews) {
    const entity = reviewRepository.create(r);
    const saved = await reviewRepository.save(entity);

    // Mantiene sincronizada la relación lógica 1:1 usada por HU-10
    // (evita doble reseña revisando solicitud.reviewId en el servicio).
    await solicitudRepository.update(
      { id: saved.solicitudId },
      { reviewId: saved.id },
    );
  }
  console.log(`✅ ${reviews.length} reseñas HU-40 insertadas`);
  console.log(
    `   → ${UUID_COMP_003} (Cálculo) queda sin reseña → botón "Calificar" visible`,
  );

  // ── HU-22: Solicitudes y reseñas extra para paginación ────────────────────
  // Garantiza ≥8 reseñas por tutor para probar el botón "Ver más reseñas".
  // Estudiantes ficticios: sus IDs son varchar, no requieren user real en BD.
  const S = {
    s010: '00000000-0000-4000-a000-000000000010',
    s011: '00000000-0000-4000-a000-000000000011',
    s012: '00000000-0000-4000-a000-000000000012',
    s013: '00000000-0000-4000-a000-000000000013',
    s014: '00000000-0000-4000-a000-000000000014',
    s015: '00000000-0000-4000-a000-000000000015',
    s016: '00000000-0000-4000-a000-000000000016',
  };

  type SolicitudRow = {
    id: string;
    estudianteId: string;
    nombreEstudiante: string;
    tutorId: string;
    ofertaKey: string;
    fecha: string;
    hora: string;
    rating: number;
    comment: string;
  };

  const extraRows: SolicitudRow[] = [
    // ── TUTOR_001 (Juan Carlos Pérez) — 7 reseñas extra → total 8 ────────────
    {
      id: UUID_HU22_T1_001,
      estudianteId: S.s010,
      nombreEstudiante: 'Sofía Ramírez',
      tutorId: TUTOR_001,
      ofertaKey: 'oferta-calc',
      fecha: '2026-02-03',
      hora: '09:00',
      rating: 5,
      comment: 'Explica muy bien los límites y derivadas.',
    },
    {
      id: UUID_HU22_T1_002,
      estudianteId: S.s011,
      nombreEstudiante: 'Diego Herrera',
      tutorId: TUTOR_001,
      ofertaKey: 'oferta-vectorial',
      fecha: '2026-02-05',
      hora: '10:00',
      rating: 4,
      comment: 'Buen manejo del teorema de Green.',
    },
    {
      id: UUID_HU22_T1_003,
      estudianteId: S.s012,
      nombreEstudiante: 'Valentina Mora',
      tutorId: TUTOR_001,
      ofertaKey: 'oferta-algebra',
      fecha: '2026-02-07',
      hora: '11:00',
      rating: 5,
      comment: 'Perfecta explicación de espacios vectoriales.',
    },
    {
      id: UUID_HU22_T1_004,
      estudianteId: S.s013,
      nombreEstudiante: 'Andrés Castillo',
      tutorId: TUTOR_001,
      ofertaKey: 'oferta-calc',
      fecha: '2026-02-10',
      hora: '14:00',
      rating: 5,
      comment: 'Muy paciente y claro con las integrales.',
    },
    {
      id: UUID_HU22_T1_005,
      estudianteId: S.s014,
      nombreEstudiante: 'Isabella Torres',
      tutorId: TUTOR_001,
      ofertaKey: 'oferta-vectorial',
      fecha: '2026-02-12',
      hora: '15:00',
      rating: 3,
      comment: 'Buena clase pero un poco rápida.',
    },
    {
      id: UUID_HU22_T1_006,
      estudianteId: S.s015,
      nombreEstudiante: 'Sebastian Ríos',
      tutorId: TUTOR_001,
      ofertaKey: 'oferta-algebra',
      fecha: '2026-02-15',
      hora: '09:00',
      rating: 5,
      comment: 'Excelente tutor, quedé con todo claro.',
    },
    {
      id: UUID_HU22_T1_007,
      estudianteId: S.s016,
      nombreEstudiante: 'Camila Vega',
      tutorId: TUTOR_001,
      ofertaKey: 'oferta-calc',
      fecha: '2026-02-18',
      hora: '10:00',
      rating: 4,
      comment: 'Muy buen repaso para el parcial.',
    },

    // ── TUTOR_003 (Carlos Alberto Rodríguez) — 7 reseñas extra → total 8 ────
    {
      id: UUID_HU22_T3_001,
      estudianteId: S.s010,
      nombreEstudiante: 'Sofía Ramírez',
      tutorId: TUTOR_003,
      ofertaKey: 'oferta-algebra',
      fecha: '2026-02-04',
      hora: '09:00',
      rating: 5,
      comment: 'El mejor tutor de álgebra lineal que he tenido.',
    },
    {
      id: UUID_HU22_T3_002,
      estudianteId: S.s011,
      nombreEstudiante: 'Diego Herrera',
      tutorId: TUTOR_003,
      ofertaKey: 'oferta-fisica',
      fecha: '2026-02-06',
      hora: '10:00',
      rating: 4,
      comment: 'Muy buen dominio de la cinemática.',
    },
    {
      id: UUID_HU22_T3_003,
      estudianteId: S.s012,
      nombreEstudiante: 'Valentina Mora',
      tutorId: TUTOR_003,
      ofertaKey: 'oferta-python',
      fecha: '2026-02-08',
      hora: '11:00',
      rating: 5,
      comment: 'Aprendí pandas en una sola sesión.',
    },
    {
      id: UUID_HU22_T3_004,
      estudianteId: S.s013,
      nombreEstudiante: 'Andrés Castillo',
      tutorId: TUTOR_003,
      ofertaKey: 'oferta-algebra',
      fecha: '2026-02-11',
      hora: '14:00',
      rating: 3,
      comment: 'Bien, aunque esperaba más ejercicios prácticos.',
    },
    {
      id: UUID_HU22_T3_005,
      estudianteId: S.s014,
      nombreEstudiante: 'Isabella Torres',
      tutorId: TUTOR_003,
      ofertaKey: 'oferta-fisica',
      fecha: '2026-02-13',
      hora: '15:00',
      rating: 5,
      comment: 'Explica con ejemplos muy claros y reales.',
    },
    {
      id: UUID_HU22_T3_006,
      estudianteId: S.s015,
      nombreEstudiante: 'Sebastian Ríos',
      tutorId: TUTOR_003,
      ofertaKey: 'oferta-python',
      fecha: '2026-02-16',
      hora: '09:00',
      rating: 4,
      comment: 'Buena introducción a estructuras de datos en Python.',
    },
    {
      id: UUID_HU22_T3_007,
      estudianteId: S.s016,
      nombreEstudiante: 'Camila Vega',
      tutorId: TUTOR_003,
      ofertaKey: 'oferta-algebra',
      fecha: '2026-02-19',
      hora: '10:00',
      rating: 5,
      comment: 'Domina el tema completamente. Muy recomendado.',
    },

    // ── TUTOR_005 (Roberto Alejandro Silva) — 7 reseñas extra → total 8 ─────
    {
      id: UUID_HU22_T5_001,
      estudianteId: S.s010,
      nombreEstudiante: 'Sofía Ramírez',
      tutorId: TUTOR_005,
      ofertaKey: 'oferta-circuitos',
      fecha: '2026-02-03',
      hora: '16:00',
      rating: 5,
      comment: 'Análisis de circuitos muy detallado.',
    },
    {
      id: UUID_HU22_T5_002,
      estudianteId: S.s011,
      nombreEstudiante: 'Diego Herrera',
      tutorId: TUTOR_005,
      ofertaKey: 'oferta-sql',
      fecha: '2026-02-05',
      hora: '17:00',
      rating: 4,
      comment: 'Buen repaso de queries con JOINs complejos.',
    },
    {
      id: UUID_HU22_T5_003,
      estudianteId: S.s012,
      nombreEstudiante: 'Valentina Mora',
      tutorId: TUTOR_005,
      ofertaKey: 'oferta-circuitos',
      fecha: '2026-02-07',
      hora: '09:00',
      rating: 5,
      comment: 'Explica muy bien la ley de Kirchhoff.',
    },
    {
      id: UUID_HU22_T5_004,
      estudianteId: S.s013,
      nombreEstudiante: 'Andrés Castillo',
      tutorId: TUTOR_005,
      ofertaKey: 'oferta-sql',
      fecha: '2026-02-09',
      hora: '10:00',
      rating: 4,
      comment: 'Aprendí índices y optimización de queries.',
    },
    {
      id: UUID_HU22_T5_005,
      estudianteId: S.s014,
      nombreEstudiante: 'Isabella Torres',
      tutorId: TUTOR_005,
      ofertaKey: 'oferta-circuitos',
      fecha: '2026-02-12',
      hora: '11:00',
      rating: 3,
      comment: 'Bien, aunque la sesión fue un poco corta.',
    },
    {
      id: UUID_HU22_T5_006,
      estudianteId: S.s015,
      nombreEstudiante: 'Sebastian Ríos',
      tutorId: TUTOR_005,
      ofertaKey: 'oferta-sql',
      fecha: '2026-02-14',
      hora: '14:00',
      rating: 5,
      comment: 'Excelente. Ahora entiendo las transacciones.',
    },
    {
      id: UUID_HU22_T5_007,
      estudianteId: S.s016,
      nombreEstudiante: 'Camila Vega',
      tutorId: TUTOR_005,
      ofertaKey: 'oferta-circuitos',
      fecha: '2026-02-17',
      hora: '15:00',
      rating: 5,
      comment: 'Perfecta explicación de circuitos en AC.',
    },
  ];

  console.log(
    '🌱 Insertando solicitudes y reseñas extra HU-22 (paginación)...',
  );
  for (const row of extraRows) {
    const ofertaId =
      ofertaIdByLabel.get(row.ofertaKey) ??
      'b2c3d4e5-f6a7-4890-b234-567890abcdef';

    const sol = solicitudRepository.create({
      id: row.id,
      estudianteId: row.estudianteId,
      ofertaId,
      tutorId: row.tutorId,
      nombreEstudiante: row.nombreEstudiante,
      mensaje: row.comment,
      modalidad: 'Virtual',
      horarios: [{ fecha: row.fecha, hora: row.hora }],
      estado: SolicitudEstado.COMPLETADA,
      acceptedMeetingLink: null,
      acceptedMeetingLocation: null,
      acceptedAt: new Date(`${row.fecha}T08:00:00.000Z`),
      completedAt: new Date(
        `${row.fecha}T${row.hora.replace(':', ':')}:00.000Z`,
      ),
      noShowAt: null,
    });
    await solicitudRepository.save(sol);

    const rev = reviewRepository.create({
      solicitudId: row.id,
      estudianteId: row.estudianteId,
      tutorId: row.tutorId,
      rating: row.rating,
      comment: row.comment,
    });
    const savedRev = await reviewRepository.save(rev);

    await solicitudRepository.update({ id: row.id }, { reviewId: savedRev.id });
  }
  console.log(
    `✅ ${extraRows.length} solicitudes+reseñas HU-22 extra insertadas`,
  );
  console.log(
    '   → TUTOR_001, TUTOR_003, TUTOR_005 tienen ahora ≥8 reseñas cada uno',
  );
}
