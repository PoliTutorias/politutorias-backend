import { DataSource } from 'typeorm';
import {
  SolicitudEntity,
  SolicitudEstado,
} from '../../solicitudes/entities/solicitud.entity';
import { HU32_OFERTA_DETALLE_ID } from './ofertas.seed';
import { SEED_USER_STUDENT_ID, SEED_USER_TUTOR2_ID } from './users.seed';

/**
 * UUID del tutor "en cero" — sincronizado con tutors.seed.ts
 * Corresponde al tutor con userId 'test-user-123' (TEST_USER_ID).
 */
const ZERO_TUTOR_ID = '550e8400-e29b-41d4-a716-446655440000';

// UUIDs de tutores reales (sincronizados con tutors.seed.ts)
const TUTOR_001 = '550e8400-e29b-41d4-a716-446655440001'; // Juan Carlos Pérez
const TUTOR_002 = '550e8400-e29b-41d4-a716-446655440002'; // María Fernanda González
const TUTOR_003 = '550e8400-e29b-41d4-a716-446655440003'; // Carlos Alberto Rodríguez
const TUTOR_004 = '550e8400-e29b-41d4-a716-446655440004'; // Ana Lucía Torres
const TUTOR_005 = '550e8400-e29b-41d4-a716-446655440005'; // Roberto Alejandro Mora

/**
 * Seed de Solicitudes para HU-06: Enviar solicitud de tutoría.
 *
 * Crea solicitudes de prueba en distintos estados para validar el flujo completo.
 *
 * Solicitudes del estudiante 'test-user-123' (el usuario de prueba principal):
 *   - 1 PENDIENTE  → acaba de enviar, aún sin respuesta del tutor
 *   - 2 ACEPTADA   → el tutor ya confirmó la sesión
 *   - 3 RECHAZADA  → el tutor declinó por falta de disponibilidad
 *   - 4 PENDIENTE  → segunda solicitud a otro tutor (modalidad presencial)
 *   - 5 ACEPTADA   → tutoría de programación confirmada
 *
 * Solicitudes de otros estudiantes (para poblar el sistema):
 *   - 6 ACEPTADA   → otro estudiante, oferta HU32
 *   - 7 RECHAZADA  → otro estudiante, oferta HU32
 *   - 8 PENDIENTE  → tercer estudiante, diferente tutor
 *
 * DEBE ejecutarse DESPUÉS de seedTutors y seedOfertaDetalleHU32.
 */
export async function seedSolicitudHU06(dataSource: DataSource): Promise<void> {
  const solicitudRepository = dataSource.getRepository(SolicitudEntity);

  const solicitudes: Partial<SolicitudEntity>[] = [
    // 1 ─ Solicitud PENDIENTE del estudiante Patricio para la oferta HU32
    {
      estudianteId: SEED_USER_STUDENT_ID,
      ofertaId: HU32_OFERTA_DETALLE_ID,
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'Patricio Chancusig',
      mensaje:
        'Necesito apoyo con los temas de límites y derivadas. Tengo examen la próxima semana y me cuesta mucho entender la regla de la cadena.',
      modalidad: 'Virtual',
      horarios: [
        { fecha: '2024-03-15', hora: '10:00' },
        { fecha: '2024-03-16', hora: '14:00' },
        { fecha: '2024-03-17', hora: '09:00' },
      ],
      estado: SolicitudEstado.PENDIENTE,
    },
    // 2 ─ Solicitud ACEPTADA — María García
    {
      estudianteId: SEED_USER_TUTOR2_ID,
      ofertaId: HU32_OFERTA_DETALLE_ID,
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'María García',
      mensaje:
        'Quiero repasar álgebra lineal antes del parcial. Tengo dificultades con transformaciones lineales y diagonalización.',
      modalidad: 'Presencial',
      horarios: [
        { fecha: '2024-03-18', hora: '09:00' },
        { fecha: '2024-03-19', hora: '09:00' },
      ],
      estado: SolicitudEstado.ACEPTADA,
    },
    // 3 ─ Solicitud RECHAZADA
    {
      estudianteId: 'estudiante-uuid-0003-0000-0000-000000000003',
      ofertaId: HU32_OFERTA_DETALLE_ID,
      tutorId: ZERO_TUTOR_ID,
      nombreEstudiante: 'Carlos López',
      mensaje: 'Necesito clases de estadística descriptiva e inferencial.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2024-03-20', hora: '16:00' }],
      estado: SolicitudEstado.RECHAZADA,
    },

    // 11 ─ PENDIENTE — estudiante 004 / tutor Juan Carlos
    {
      estudianteId: 'estudiante-uuid-0004-0000-0000-000000000004',
      ofertaId: HU32_OFERTA_DETALLE_ID,
      tutorId: TUTOR_001,
      mensaje:
        'Buenas tardes, me gustaría reforzar cálculo vectorial. Tengo problemas con los integrales de línea y los teoremas de Green y Stokes.',
      modalidad: 'Virtual',
      horarios: [
        { fecha: '2024-03-22', hora: '10:00' },
        { fecha: '2024-03-24', hora: '10:00' },
      ],
      estado: SolicitudEstado.PENDIENTE,
    },

    // 12 ─ ACEPTADA — estudiante 005 / María Fernanda
    {
      estudianteId: 'estudiante-uuid-0005-0000-0000-000000000005',
      ofertaId: HU32_OFERTA_DETALLE_ID,
      tutorId: TUTOR_002,
      mensaje:
        'Hola, estoy aprendiendo desarrollo web con React y me estoy perdiendo con los hooks. ¿Podría ayudarme a entender useEffect y useContext?',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2024-03-14', hora: '17:00' }],
      estado: SolicitudEstado.ACEPTADA,
    },

    // 13 ─ PENDIENTE — estudiante 006 / Carlos Alberto (química)
    {
      estudianteId: 'estudiante-uuid-0006-0000-0000-000000000006',
      ofertaId: HU32_OFERTA_DETALLE_ID,
      tutorId: TUTOR_003,
      mensaje:
        'Necesito apoyo con estequiometría y balanceo de reacciones. Tengo el parcial de química general el próximo viernes.',
      modalidad: 'Presencial',
      horarios: [
        { fecha: '2024-03-26', hora: '15:00' },
        { fecha: '2024-03-27', hora: '15:00' },
      ],
      estado: SolicitudEstado.PENDIENTE,
    },
  ];

  console.log('🌱 Insertando solicitudes HU-06...');
  for (const s of solicitudes) {
    const entity = solicitudRepository.create(s);
    await solicitudRepository.save(entity);
  }
  console.log(`✅ ${solicitudes.length} solicitudes HU-06 insertadas`);
}
