import { DataSource } from 'typeorm';
import {
  SolicitudEntity,
  SolicitudEstado,
} from '../../solicitudes/entities/solicitud.entity';

/**
 * UUIDs sincronizados con tutors.seed.ts y users.seed.ts
 */
const ZERO_TUTOR_ID = '550e8400-e29b-41d4-a716-446655440000';
const TUTOR_001 = '550e8400-e29b-41d4-a716-446655440001';
const TUTOR_002 = '550e8400-e29b-41d4-a716-446655440002';

/**
 * Seed de Solicitudes para HU-08: Aceptar solicitud de tutoría.
 *
 * Crea solicitudes ya aceptadas con los campos de reunión configurados:
 * - acceptedMeetingLink para modalidad Virtual
 * - acceptedMeetingLocation para modalidad Presencial
 * - acceptedAt con la fecha de aceptación
 *
 * Estas solicitudes permiten probar que:
 * - Los endpoints GET retornan los campos nuevos correctamente
 * - Los estudiantes pueden ver los detalles de la reunión aceptada
 * - Las validaciones de no-poder-aceptar-ya-aceptadas funcionan
 *
 * DEBE ejecutarse DESPUÉS de seedSolicitudHU06.
 */
export async function seedSolicitudHU08(dataSource: DataSource): Promise<void> {
  const solicitudRepository = dataSource.getRepository(SolicitudEntity);

  const acceptedSolicitudes: Partial<SolicitudEntity>[] = [
    // ─────────────────────────────────────────────────────────────
    // Solicitud ACEPTADA Virtual — con link de reunión
    // ─────────────────────────────────────────────────────────────
    {
      estudianteId: 'estudiante-hu08-001',
      ofertaId: 'oferta-hu08-001',
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'Roberto Díaz',
      mensaje:
        'Necesito ayuda con integrales múltiples y el teorema de Stokes para mi examen final.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2024-04-10', hora: '14:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: 'https://meet.google.com/abc-defg-hij',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2024-04-08T10:30:00.000Z'),
    },

    // ─────────────────────────────────────────────────────────────
    // Solicitud ACEPTADA Presencial — con lugar de encuentro
    // ─────────────────────────────────────────────────────────────
    {
      estudianteId: 'estudiante-hu08-002',
      ofertaId: 'oferta-hu08-002',
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'Laura Mendoza',
      mensaje:
        'Quiero repasar ecuaciones diferenciales antes del parcial del viernes.',
      modalidad: 'Presencial',
      horarios: [{ fecha: '2024-04-12', hora: '09:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: null,
      acceptedMeetingLocation:
        'Biblioteca Central, Sala de estudio 3, Segundo piso',
      acceptedAt: new Date('2024-04-09T15:45:00.000Z'),
    },

    // ─────────────────────────────────────────────────────────────
    // Solicitud ACEPTADA por otro tutor — tutor 001
    // ─────────────────────────────────────────────────────────────
    {
      estudianteId: 'estudiante-hu08-003',
      ofertaId: 'oferta-hu08-003',
      tutorId: TUTOR_001,
      nombreEstudiante: 'Sofia Herrera',
      mensaje:
        'Necesito refuerzo en cálculo vectorial, especialmente integrales de línea y superficie.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2024-04-15', hora: '16:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: 'https://zoom.us/j/1234567890',
      acceptedMeetingLocation: null,
      acceptedAt: new Date('2024-04-10T11:00:00.000Z'),
    },

    // ─────────────────────────────────────────────────────────────
    // Solicitud ACEPTADA Presencial — tutor 002
    // ─────────────────────────────────────────────────────────────
    {
      estudianteId: 'estudiante-hu08-004',
      ofertaId: 'oferta-hu08-004',
      tutorId: TUTOR_002,
      nombreEstudiante: 'Diego Vargas',
      mensaje:
        'Me gustaría aprender desarrollo de APIs REST con Node.js y Express.',
      modalidad: 'Presencial',
      horarios: [{ fecha: '2024-04-16', hora: '10:00' }],
      estado: SolicitudEstado.ACEPTADA,
      acceptedMeetingLink: null,
      acceptedMeetingLocation: 'Edificio B, Laboratorio de Computación 201',
      acceptedAt: new Date('2024-04-11T09:30:00.000Z'),
    },

    // ─────────────────────────────────────────────────────────────
    // Solicitud PENDIENTE de prueba — para validar que no se puede
    // aceptar dos veces (validación estado != PENDIENTE)
    // ─────────────────────────────────────────────────────────────
    {
      estudianteId: 'estudiante-hu08-005',
      ofertaId: 'oferta-hu08-005',
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'Carmen Ríos',
      mensaje:
        'Necesito ayuda con probabilidad y estadística para mi tesis de grado.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2024-04-18', hora: '11:00' }],
      estado: SolicitudEstado.PENDIENTE,
      acceptedMeetingLink: null,
      acceptedMeetingLocation: null,
      acceptedAt: null,
    },
  ];

  console.log('🌱 Insertando solicitudes HU-08 (aceptadas)...');
  for (const s of acceptedSolicitudes) {
    const entity = solicitudRepository.create(s);
    await solicitudRepository.save(entity);
  }
  console.log(`✅ ${acceptedSolicitudes.length} solicitudes HU-08 insertadas`);
}
