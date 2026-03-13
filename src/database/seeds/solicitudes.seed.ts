import { DataSource } from 'typeorm';
import {
  SolicitudEntity,
  SolicitudEstado,
} from '../../solicitudes/entities/solicitud.entity';
import { HU32_OFERTA_DETALLE_ID } from './ofertas.seed';

/**
 * UUID del tutor "en cero" — sincronizado con tutors.seed.ts
 * Corresponde al tutor con userId 'test-user-123' (TEST_USER_ID).
 */
const ZERO_TUTOR_ID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Seed de Solicitudes para HU-06: Enviar solicitud de tutoría.
 *
 * Crea solicitudes de prueba en distintos estados para validar el flujo completo.
 * DEBE ejecutarse DESPUÉS de seedTutors y seedOfertaDetalleHU32.
 */
export async function seedSolicitudHU06(dataSource: DataSource): Promise<void> {
  const solicitudRepository = dataSource.getRepository(SolicitudEntity);

  const solicitudes: Partial<SolicitudEntity>[] = [
    // 1 ─ Solicitud PENDIENTE del estudiante de prueba para la oferta HU32
    {
      estudianteId: 'test-user-123',
      ofertaId: HU32_OFERTA_DETALLE_ID,
      tutorId: ZERO_TUTOR_ID,
      mensaje:
        'Necesito apoyo con los temas de límites y derivadas. Tengo examen la próxima semana.',
      modalidad: 'Virtual',
      horarios: [
        { fecha: '2024-03-15', hora: '10:00' },
        { fecha: '2024-03-16', hora: '14:00' },
      ],
      estado: SolicitudEstado.PENDIENTE,
    },
    // 2 ─ Solicitud ACEPTADA — otro estudiante
    {
      estudianteId: 'estudiante-uuid-0002-0000-0000-000000000002',
      ofertaId: HU32_OFERTA_DETALLE_ID,
      tutorId: ZERO_TUTOR_ID,
      mensaje:
        'Quiero repasar álgebra lineal antes del parcial. Tengo dificultades con transformaciones lineales.',
      modalidad: 'Presencial',
      horarios: [{ fecha: '2024-03-18', hora: '09:00' }],
      estado: SolicitudEstado.ACEPTADA,
    },
    // 3 ─ Solicitud RECHAZADA — otro estudiante
    {
      estudianteId: 'estudiante-uuid-0003-0000-0000-000000000003',
      ofertaId: HU32_OFERTA_DETALLE_ID,
      tutorId: ZERO_TUTOR_ID,
      mensaje: 'Necesito clases de estadística descriptiva e inferencial.',
      modalidad: 'Virtual',
      horarios: [{ fecha: '2024-03-20', hora: '16:00' }],
      estado: SolicitudEstado.RECHAZADA,
    },
  ];

  console.log('🌱 Insertando solicitudes HU-06...');
  for (const s of solicitudes) {
    const entity = solicitudRepository.create(s);
    await solicitudRepository.save(entity);
  }
  console.log(`✅ ${solicitudes.length} solicitudes HU-06 insertadas`);
}
