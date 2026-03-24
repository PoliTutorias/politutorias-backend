import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  SolicitudEntity,
  SolicitudEstado,
} from '../solicitudes/entities/solicitud.entity';
import { AgendaEstudianteService } from './agenda-estudiante.service';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit Tests — AgendaEstudianteService — HU11: Ver tutorías agendadas
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * FASE ROJA del TDD: estos tests FALLARÁN inicialmente porque:
 *  1. AgendaEstudianteService no existe todavía en src/agenda-estudiante/.
 *  2. Las reglas de negocio (clasificación ACEPTADA vs COMPLETED, paginación,
 *     campos condicionales) no están implementadas.
 *  3. Los DTOs AgendaStudentListItemDTO y AgendaStudentDetailDTO no existen.
 *
 * Mock: únicamente SolicitudEntity Repository (TypeORM).
 * No se mockea lógica de negocio dentro de los tests.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Identificadores de prueba ─────────────────────────────────────────────

const STUDENT_ID = 'student-uuid-0001-0000-0000-000000000001';
const OTHER_STUDENT_ID = 'student-uuid-9999-0000-0000-000000000099';
const TUTOR_ID = 'tutor-uuid-0001-0000-0000-000000000001';

const SESSION_VIRTUAL_ID = 'session-uuid-0001-0000-0000-000000000001';
const SESSION_PRESENCIAL_ID = 'session-uuid-0002-0000-0000-000000000002';
const SESSION_PASSED_ID = 'session-uuid-0003-0000-0000-000000000003';
const SESSION_CANCELLED_ID = 'session-uuid-0004-0000-0000-000000000004';

// ─── Fixtures de SolicitudEntity ──────────────────────────────────────────

/** Sesión futura (ACEPTADA) — modalidad Virtual */
const solicitudFuturaVirtual: Partial<SolicitudEntity> = {
  id: SESSION_VIRTUAL_ID,
  estudianteId: STUDENT_ID,
  tutorId: TUTOR_ID,
  modalidad: 'Virtual',
  estado: SolicitudEstado.ACEPTADA,
  mensaje: 'Necesito ayuda con límites y derivadas.',
  // Fecha en 2099: siempre futura → sección "proximas"
  horarios: [{ fecha: '2099-07-25', hora: '10:00' }],
  acceptedMeetingLink: 'https://zoom.us/j/123456789',
  acceptedMeetingLocation: null,
  acceptedAt: new Date('2099-07-20T08:00:00.000Z'),
  createdAt: new Date('2099-07-01T08:00:00.000Z'),
  oferta: {
    id: 'oferta-uuid-0001',
    title: 'Cálculo I',
    price: 25000,
    tutorId: TUTOR_ID,
    tutor: {
      id: TUTOR_ID,
      nombreCompleto: 'Juan Pérez',
      fotoPerfil: 'https://example.com/avatars/juan.jpg',
    },
  } as unknown as SolicitudEntity['oferta'],
};

/** Sesión presencial futura (ACEPTADA) */
const solicitudFuturaPresencial: Partial<SolicitudEntity> = {
  id: SESSION_PRESENCIAL_ID,
  estudianteId: STUDENT_ID,
  tutorId: TUTOR_ID,
  modalidad: 'Presencial',
  estado: SolicitudEstado.ACEPTADA,
  mensaje: 'Quiero repasar los temas del parcial.',
  horarios: [{ fecha: '2099-08-15', hora: '09:00' }],
  acceptedMeetingLink: null,
  acceptedMeetingLocation: 'Biblioteca Central, Piso 2',
  acceptedAt: new Date('2099-08-10T08:00:00.000Z'),
  createdAt: new Date('2099-08-01T08:00:00.000Z'),
  oferta: {
    id: 'oferta-uuid-0002',
    title: 'Álgebra Lineal',
    price: 20000,
    tutorId: TUTOR_ID,
    tutor: {
      id: TUTOR_ID,
      nombreCompleto: 'María López',
      fotoPerfil: 'https://example.com/avatars/maria.jpg',
    },
  } as unknown as SolicitudEntity['oferta'],
};

/**
 * Sesión con estado ACEPTADA PERO con fecha en el PASADO.
 * REGLA CRÍTICA: El servicio debe retornarla como COMPLETED en el DTO
 * (sin persistir el cambio en BD).
 */
const solicitudAceptadaPasada: Partial<SolicitudEntity> = {
  id: SESSION_PASSED_ID,
  estudianteId: STUDENT_ID,
  tutorId: TUTOR_ID,
  modalidad: 'Virtual',
  // Estado en BD: ACEPTADA — pero la fecha ya pasó
  estado: SolicitudEstado.ACEPTADA,
  mensaje: 'Sesión ya realizada.',
  horarios: [{ fecha: '2020-01-10', hora: '09:00' }],
  acceptedMeetingLink: 'https://meet.google.com/abc-def',
  acceptedMeetingLocation: null,
  acceptedAt: new Date('2020-01-05T08:00:00.000Z'),
  createdAt: new Date('2019-12-20T08:00:00.000Z'),
  oferta: {
    id: 'oferta-uuid-0001',
    title: 'Cálculo I',
    price: 25000,
    tutorId: TUTOR_ID,
    tutor: {
      id: TUTOR_ID,
      nombreCompleto: 'Juan Pérez',
      fotoPerfil: 'https://example.com/avatars/juan.jpg',
    },
  } as unknown as SolicitudEntity['oferta'],
};

/** Sesión cancelada */
const solicitudCancelada: Partial<SolicitudEntity> = {
  id: SESSION_CANCELLED_ID,
  estudianteId: STUDENT_ID,
  tutorId: TUTOR_ID,
  modalidad: 'Presencial',
  estado: SolicitudEstado.COMPLETADA,
  mensaje: 'Tutoría cancelada.',
  horarios: [{ fecha: '2021-03-05', hora: '11:00' }],
  acceptedMeetingLink: null,
  acceptedMeetingLocation: 'Sala de reuniones',
  createdAt: new Date('2021-03-01T08:00:00.000Z'),
  oferta: {
    id: 'oferta-uuid-0002',
    title: 'Álgebra Lineal',
    price: 20000,
    tutorId: TUTOR_ID,
    tutor: {
      id: TUTOR_ID,
      nombreCompleto: 'María López',
      fotoPerfil: 'https://example.com/avatars/maria.jpg',
    },
  } as unknown as SolicitudEntity['oferta'],
};

// ─── Mock del repositorio ─────────────────────────────────────────────────

const mockSolicitudRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
  count: jest.fn(),
};

// ─────────────────────────────────────────────────────────────────────────────
// Suite principal
// ─────────────────────────────────────────────────────────────────────────────

describe('AgendaEstudianteService (Unit Tests) — HU11', () => {
  let service: AgendaEstudianteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgendaEstudianteService,
        {
          provide: getRepositoryToken(SolicitudEntity),
          useValue: mockSolicitudRepository,
        },
      ],
    }).compile();

    service = module.get(AgendaEstudianteService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getStudentAgenda
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getStudentAgenda(studentId, params)', () => {
    /**
     * Escenario 1 — Filtro por studentId y estados correctos
     *
     * DADO QUE: Existen solicitudes del estudiante con estados ACEPTADA y CANCELADA.
     * CUANDO:   Se llama a getStudentAgenda.
     * ENTONCES: El repositorio es consultado SOLO con el studentId dado
     *           y estados incluidos: ACEPTADA y COMPLETADA/CANCELADA.
     */
    it('debe filtrar sesiones por studentId y únicamente por estados ACEPTADA y COMPLETADA', async () => {
      mockSolicitudRepository.find.mockResolvedValueOnce([
        solicitudFuturaVirtual,
        solicitudCancelada,
      ]);

      await service.getStudentAgenda(STUDENT_ID, { page: 1, limit: 5 });

      // El repositorio debe ser consultado con el estudianteId correcto
      expect(mockSolicitudRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.objectContaining({ estudianteId: STUDENT_ID }),
          ]) as unknown,
        }),
      );
    });

    /**
     * Escenario 2 — Clasificación en "proximas" vs "anteriores"
     *
     * DADO QUE: Existen sesiones futuras (ACEPTADA + fecha futura) y pasadas.
     * CUANDO:   Se llama a getStudentAgenda.
     * ENTONCES: Las sesiones futuras van en "proximas" y las pasadas en "anteriores".
     */
    it('debe clasificar correctamente sesiones futuras en proximas y pasadas en anteriores', async () => {
      mockSolicitudRepository.find.mockResolvedValueOnce([
        solicitudFuturaVirtual, // fecha 2099 → proximas
        solicitudAceptadaPasada, // fecha 2020, ACEPTADA en BD → anteriores (COMPLETED en DTO)
        solicitudCancelada, // COMPLETADA → anteriores
      ]);

      const result = await service.getStudentAgenda(STUDENT_ID, {
        page: 1,
        limit: 10,
      });

      // Verificar estructura base
      expect(result).toHaveProperty('proximas');
      expect(result).toHaveProperty('anteriores');
      expect(Array.isArray(result.proximas)).toBe(true);
      expect(Array.isArray(result.anteriores)).toBe(true);

      // La sesión futura debe estar en proximas
      const proximasIds = (result.proximas as { id: string }[]).map(
        (s) => s.id,
      );
      expect(proximasIds).toContain(SESSION_VIRTUAL_ID);

      // Las sesiones pasadas deben estar en anteriores
      const anterioresIds = (result.anteriores as { id: string }[]).map(
        (s) => s.id,
      );
      expect(anterioresIds).toContain(SESSION_PASSED_ID);
      expect(anterioresIds).toContain(SESSION_CANCELLED_ID);
    });

    /**
     * ★ Escenario 3 — REGLA CRÍTICA: ACEPTADA pasada → COMPLETED en DTO
     *
     * DADO QUE: Una solicitud tiene estado ACEPTADA en BD pero su fecha/hora ya pasó.
     * CUANDO:   El servicio mapea la sesión al DTO.
     * ENTONCES: El campo "status" del DTO debe ser 'COMPLETED' (no 'ACEPTADA'),
     *           SIN modificar el estado en la base de datos.
     *
     * Esta es la regla de negocio principal de HU11: el COMPLETED es calculado
     * en tiempo real comparando fecha actual vs fecha de sesión.
     */
    it('REGLA CRÍTICA: una sesión ACEPTADA con fecha pasada debe mapearse como COMPLETED en el DTO', async () => {
      mockSolicitudRepository.find.mockResolvedValueOnce([
        solicitudAceptadaPasada, // ACEPTADA en BD, fecha en 2020
      ]);

      const result = await service.getStudentAgenda(STUDENT_ID, {
        page: 1,
        limit: 10,
      });

      // Debe aparecer en "anteriores"
      const anteriores = result.anteriores as { id: string; status: string }[];
      const sesionMapeada = anteriores.find((s) => s.id === SESSION_PASSED_ID);

      expect(sesionMapeada).toBeDefined();
      // El status del DTO debe ser COMPLETED, aunque en BD es ACEPTADA
      expect(sesionMapeada?.status).toBe('COMPLETED');

      // Verificar que el repositorio NO fue llamado con save (no se persiste el cambio)
      expect(mockSolicitudRepository.find).toHaveBeenCalledTimes(1);
    });

    /**
     * Escenario 4 — Paginación de "anteriores"
     *
     * DADO QUE: Existen 12 sesiones anteriores en el mock.
     * CUANDO:   Se llama a getStudentAgenda con page=2, limit=5.
     * ENTONCES: La sección "anteriores" contiene exactamente 5 items
     *           correspondientes a la página 2 (índices 5-9).
     */
    it('debe aplicar correctamente el slice de paginación (page=2, limit=5) en la sección anteriores', async () => {
      // Generar 12 sesiones pasadas
      const sesionesPasadas: Partial<SolicitudEntity>[] = Array.from(
        { length: 12 },
        (_, i) => ({
          id: `session-past-${String(i).padStart(4, '0')}`,
          estudianteId: STUDENT_ID,
          tutorId: TUTOR_ID,
          modalidad: 'Virtual',
          estado: SolicitudEstado.ACEPTADA,
          mensaje: `Sesión ${i}`,
          horarios: [{ fecha: '2020-01-10', hora: '09:00' }], // fecha pasada
          acceptedMeetingLink: `https://zoom.us/j/${i}`,
          acceptedMeetingLocation: null,
          createdAt: new Date('2020-01-01T08:00:00.000Z'),
          oferta: {
            id: 'oferta-uuid-0001',
            title: 'Cálculo I',
            price: 25000,
            tutorId: TUTOR_ID,
            tutor: {
              id: TUTOR_ID,
              nombreCompleto: 'Juan Pérez',
              fotoPerfil: 'https://example.com/avatars/juan.jpg',
            },
          } as unknown as SolicitudEntity['oferta'],
        }),
      );

      mockSolicitudRepository.find.mockResolvedValueOnce(sesionesPasadas);

      const result = await service.getStudentAgenda(STUDENT_ID, {
        page: 2,
        limit: 5,
      });

      // La página 2 con limit 5 debe retornar los items del índice 5 al 9 (5 items)
      expect(result.anteriores).toHaveLength(5);
      expect(result.totalAnteriores).toBe(12);
      expect(result.currentPage).toBe(2);

      // Los IDs en página 2 deben ser los del índice 5-9
      const ids = (result.anteriores as { id: string }[]).map((s) => s.id);
      expect(ids).toContain('session-past-0005');
      expect(ids).toContain('session-past-0009');
      expect(ids).not.toContain('session-past-0000');
      expect(ids).not.toContain('session-past-0010');
    });

    /**
     * Escenario 5 — Agenda vacía
     *
     * DADO QUE: El estudiante no tiene tutorías agendadas.
     * CUANDO:   Se llama a getStudentAgenda.
     * ENTONCES: Retorna proximas=[], anteriores=[], totalProximas=0, totalAnteriores=0.
     */
    it('debe retornar proximas y anteriores vacíos cuando el estudiante no tiene sesiones', async () => {
      mockSolicitudRepository.find.mockResolvedValueOnce([]);

      const result = await service.getStudentAgenda(STUDENT_ID, {
        page: 1,
        limit: 5,
      });

      expect(result.proximas).toEqual([]);
      expect(result.anteriores).toEqual([]);
      expect(result.totalProximas).toBe(0);
      expect(result.totalAnteriores).toBe(0);
    });

    /**
     * Escenario 6 — Estructura mínima del DTO de item en "proximas"
     *
     * DADO QUE: Existe una sesión futura válida.
     * CUANDO:   Se llama a getStudentAgenda.
     * ENTONCES: Cada item en "proximas" tiene los campos mínimos del
     *           AgendaStudentListItemDTO.
     */
    it('cada item en proximas debe tener la estructura AgendaStudentListItemDTO', async () => {
      mockSolicitudRepository.find.mockResolvedValueOnce([
        solicitudFuturaVirtual,
      ]);

      const result = await service.getStudentAgenda(STUDENT_ID, {
        page: 1,
        limit: 5,
      });

      expect(result.proximas).toHaveLength(1);
      const item = result.proximas[0] as unknown as Record<string, unknown>;
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('tutorName');
      expect(item).toHaveProperty('subjectName');
      expect(item).toHaveProperty('date');
      expect(item).toHaveProperty('time');
      expect(item).toHaveProperty('modality');
      expect(item).toHaveProperty('status', 'ACEPTADA');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getSessionDetails
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getSessionDetails(studentId, sessionId)', () => {
    /**
     * Escenario 7 — Detalle de sesión Virtual: meetingLink presente
     *
     * DADO QUE: La sesión existe, pertenece al estudiante y es de modalidad Virtual.
     * CUANDO:   Se llama a getSessionDetails.
     * ENTONCES: El DTO retornado incluye meetingLink (URL) y meetingLocation es null.
     */
    it('debe retornar el meetingLink cuando la modalidad es Virtual', async () => {
      mockSolicitudRepository.findOne.mockResolvedValueOnce(
        solicitudFuturaVirtual,
      );

      const result = await service.getSessionDetails(
        STUDENT_ID,
        SESSION_VIRTUAL_ID,
      );

      expect(result).toHaveProperty('meetingLink');
      expect(typeof result.meetingLink).toBe('string');
      expect(result.meetingLink).toBe('https://zoom.us/j/123456789');
      expect(result.meetingLocation).toBeNull();
    });

    /**
     * Escenario 8 — Detalle de sesión Presencial: meetingLocation presente
     *
     * DADO QUE: La sesión existe, pertenece al estudiante y es de modalidad Presencial.
     * CUANDO:   Se llama a getSessionDetails.
     * ENTONCES: El DTO retornado incluye meetingLocation (texto) y meetingLink es null.
     */
    it('debe retornar el meetingLocation cuando la modalidad es Presencial', async () => {
      mockSolicitudRepository.findOne.mockResolvedValueOnce(
        solicitudFuturaPresencial,
      );

      const result = await service.getSessionDetails(
        STUDENT_ID,
        SESSION_PRESENCIAL_ID,
      );

      expect(result).toHaveProperty('meetingLocation');
      expect(typeof result.meetingLocation).toBe('string');
      expect(result.meetingLocation).toBe('Biblioteca Central, Piso 2');
      expect(result.meetingLink).toBeNull();
    });

    /**
     * Escenario 9 — 404 por sesión inexistente
     *
     * DADO QUE: El repositorio retorna null (sesión no existe).
     * CUANDO:   Se llama a getSessionDetails con un ID inexistente.
     * ENTONCES: El servicio lanza NotFoundException.
     */
    it('debe lanzar NotFoundException cuando la sesión no existe en BD', async () => {
      mockSolicitudRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.getSessionDetails(
          STUDENT_ID,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    /**
     * Escenario 10 — 404 por sesión de otro estudiante
     *
     * DADO QUE: La sesión existe en BD pero pertenece a otro estudiante.
     * CUANDO:   Se llama a getSessionDetails con el ID de un estudiante diferente.
     * ENTONCES: El servicio lanza NotFoundException (no expone datos de otros).
     *
     * NOTA: Se usa 404 (no 403) para no revelar la existencia del recurso.
     */
    it('debe lanzar NotFoundException cuando la sesión pertenece a otro estudiante', async () => {
      // La sesión existe pero su estudianteId no coincide con OTHER_STUDENT_ID
      mockSolicitudRepository.findOne.mockResolvedValueOnce(
        solicitudFuturaVirtual, // estudianteId = STUDENT_ID
      );

      await expect(
        service.getSessionDetails(
          OTHER_STUDENT_ID, // ← ID diferente al dueño de la sesión
          SESSION_VIRTUAL_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    /**
     * Escenario 11 — Estructura completa del AgendaStudentDetailDTO
     *
     * DADO QUE: La sesión existe y pertenece al estudiante.
     * CUANDO:   Se llama a getSessionDetails.
     * ENTONCES: El DTO retornado tiene TODOS los campos definidos en el contrato.
     */
    it('debe retornar todos los campos del AgendaStudentDetailDTO', async () => {
      mockSolicitudRepository.findOne.mockResolvedValueOnce(
        solicitudFuturaVirtual,
      );

      const result = await service.getSessionDetails(
        STUDENT_ID,
        SESSION_VIRTUAL_ID,
      );

      const dto = result as unknown as Record<string, unknown>;

      // Campos base (compartidos con el listItem)
      expect(dto).toHaveProperty('id', SESSION_VIRTUAL_ID);
      expect(dto).toHaveProperty('tutorName');
      expect(dto).toHaveProperty('subjectName');
      expect(dto).toHaveProperty('date');
      expect(dto).toHaveProperty('time');
      expect(dto).toHaveProperty('modality');
      expect(dto).toHaveProperty('status');

      // Campos adicionales del detalle
      expect(dto).toHaveProperty('meetingLink');
      expect(dto).toHaveProperty('meetingLocation');
      expect(dto).toHaveProperty('studentMessage');

      // Valores concretos
      expect(dto.studentMessage).toBe(
        'Necesito ayuda con límites y derivadas.',
      );
      expect(dto.modality).toBe('Virtual');
    });

    /**
     * Escenario 12 — Verificar que el repositorio busca por ID correcto
     *
     * DADO QUE: El servicio recibe un sessionId.
     * CUANDO:   Se llama a getSessionDetails.
     * ENTONCES: El repositorio es invocado con el ID de sesión correcto.
     */
    it('debe consultar el repositorio con el sessionId correcto', async () => {
      mockSolicitudRepository.findOne.mockResolvedValueOnce(
        solicitudFuturaVirtual,
      );

      await service.getSessionDetails(STUDENT_ID, SESSION_VIRTUAL_ID);

      expect(mockSolicitudRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: SESSION_VIRTUAL_ID,
          }) as unknown,
        }),
      );
    });
  });
});
