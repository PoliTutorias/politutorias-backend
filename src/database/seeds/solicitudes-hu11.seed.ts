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
 * Seed de Solicitudes para HU-11: Ver tutorías agendadas del estudiante.
 *
 * Crea solicitudes con estado ACEPTADA/COMPLETADA para el endpoint
 * GET /api/estudiante/agenda del estudiante autenticado.
 *
 * Estudiante principal: 'estudiante-hu11-001'
 *
 * Sesiones del estudiante principal:
 *   - 3 ACEPTADA (futuras → proximas)
 *   - 2 COMPLETADA (pasadas → anteriores)
 *   - 1 ACEPTADA con fecha pasada (anteriores, status=COMPLETED en DTO)
 *
 * Sesiones de otro estudiante (aislamiento):
 *   - 2 ACEPTADA para 'estudiante-hu11-999' (no deben aparecer)
 *
 * DEBE ejecutarse DESPUÉS de seedSolicitudHU15.
 */
export async function seedSolicitudHU11(dataSource: DataSource): Promise<void> {
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
        `⚠️  HU-11 seed: no se encontró oferta con título "${item.titulo}". Se omitirá.`,
      );
      continue;
    }

    ofertaIdByLabel.set(item.key, oferta.id);
  }

  const getOfertaId = (key: string): string => {
    return ofertaIdByLabel.get(key) ?? 'b2c3d4e5-f6a7-4890-b234-567890abcdef';
  };

  const solicitudes: Partial<SolicitudEntity>[] = [
    // ─────────────────────────────────────────────────────────────
    // SESIONES FUTURAS (ACEPTADA) → "proximas"
    // ─────────────────────────────────────────────────────────────

    // S1 — Futura Virtual — Cálculo — 27 marzo 2026 — 10:00
    {
      estudianteId: 'estudiante-hu11-001',
      ofertaId: getOfertaId('oferta-calc'),
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'María García',
      mensaje:
        'Necesito ayuda con límites y derivadas para el examen del próximo mes.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2026-03-27', hora: '10:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: 'https://zoom.us/j/poli-calc-hu11-001',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2026-03-22T08:00:00.000Z'),
    },

    // S2 — Futura Presencial — Álgebra — 15 agosto 2099 — 09:00
    {
      estudianteId: 'estudiante-hu11-001',
      ofertaId: getOfertaId('oferta-algebra'),
      tutorId: TUTOR_001,
      nombreEstudiante: 'María García',
      mensaje: 'Quiero repasar vectores propios antes del parcial.',
      modalidad: 'Presencial',
      horarios: [{ fecha: '2099-08-15', hora: '09:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: null,
      acceptedMeetingLocation: 'Biblioteca Central, Piso 2',
      acceptedAt: new Date('2099-08-10T08:00:00.000Z'),
    },

    // S3 — Futura Virtual — Python — 1 septiembre 2099 — 14:00
    {
      estudianteId: 'estudiante-hu11-001',
      ofertaId: getOfertaId('oferta-python'),
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'María García',
      mensaje: 'Quiero aprender pandas y matplotlib para mi proyecto de datos.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2099-09-01', hora: '14:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: 'https://meet.google.com/poli-python-hu11-003',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2099-08-25T10:00:00.000Z'),
    },

    // ─────────────────────────────────────────────────────────────
    // SESIONES COMPLETADAS EN BD → "anteriores" (status=COMPLETED)
    // ─────────────────────────────────────────────────────────────

    // S4 — COMPLETADA Virtual — Cálculo — 10 enero 2020 — 09:00
    {
      estudianteId: 'estudiante-hu11-001',
      ofertaId: getOfertaId('oferta-calc'),
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'María García',
      mensaje: 'Sesión de repaso de límites ya completada.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2020-01-10', hora: '09:00' }],
      estado: SolicitudEstado.COMPLETADA,
      acceptedMeetingLink: 'https://meet.google.com/poli-calc-hu11-004',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2020-01-05T08:00:00.000Z'),
      completedAt: new Date('2020-01-10T10:00:00.000Z'),
    },

    // S5 — COMPLETADA Presencial — BD — 5 marzo 2021 — 11:00
    {
      estudianteId: 'estudiante-hu11-001',
      ofertaId: getOfertaId('oferta-bd'),
      tutorId: TUTOR_001,
      nombreEstudiante: 'María García',
      mensaje: 'Tutoría de SQL avanzado y JOINs complejos.',
      modalidad: 'Presencial',
      horarios: [{ fecha: '2021-03-05', hora: '11:00' }],
      estado: SolicitudEstado.COMPLETADA,
      acceptedMeetingLink: null,
      acceptedMeetingLocation: 'Sala de reuniones, Edificio Sistemas',
      acceptedAt: new Date('2021-03-01T08:00:00.000Z'),
      completedAt: new Date('2021-03-05T12:00:00.000Z'),
    },

    // S6 — ACEPTADA en BD pero PASADA → "anteriores" con status=COMPLETED en DTO
    {
      estudianteId: 'estudiante-hu11-001',
      ofertaId: getOfertaId('oferta-web'),
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'María García',
      mensaje: 'Sesión de React ya pasada pero ACEPTADA en BD.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2022-06-15', hora: '16:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: 'https://zoom.us/j/poli-web-hu11-006',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2022-06-10T08:00:00.000Z'),
    },

    // ─────────────────────────────────────────────────────────────
    // SESIONES DE OTRO ESTUDIANTE (aislamiento)
    // ─────────────────────────────────────────────────────────────

    // S7 — ACEPTADA — otro estudiante — no debe aparecer en agenda de estudiante-hu11-001
    {
      estudianteId: 'estudiante-hu11-999',
      ofertaId: getOfertaId('oferta-calc'),
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'Otro Estudiante',
      mensaje: 'Sesión de otro estudiante para probar aislamiento.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2099-10-01', hora: '10:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: 'https://zoom.us/j/poli-other-001',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2099-09-25T08:00:00.000Z'),
    },
  ];

  console.log('🌱 Insertando solicitudes HU-11 (agenda del estudiante)...');
  for (const s of solicitudes) {
    const entity = solicitudRepository.create(s);
    await solicitudRepository.save(entity);
  }
  console.log(`✅ ${solicitudes.length} solicitudes HU-11 insertadas`);
  console.log(
    `   → estudiante-hu11-001 tiene 3 ACEPTADAS futuras + 2 COMPLETADAS + 1 ACEPTADA pasada`,
  );
  console.log(`   → estudiante-hu11-999 tiene 1 sesión (aislamiento)`);
}
