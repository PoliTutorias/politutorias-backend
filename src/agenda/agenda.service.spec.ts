import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  SolicitudEntity,
  SolicitudEstado,
} from '../solicitudes/entities/solicitud.entity';
import { AgendaService } from './agenda.service';

describe('AgendaService (Unit Tests) - HU15', () => {
  let service: AgendaService;

  const mockSolicitudRepository = {
    createQueryBuilder: jest.fn(),
  };

  const TUTOR_ID = 'tutor-uuid-0001-0000-0000-000000000001';

  const mockOferta = {
    id: 'oferta-uuid-0001',
    titulo: 'Cálculo Vectorial',
    title: 'Cálculo Vectorial',
    price: 10,
    precioHora: 10,
  };

  const makeSolicitud = (
    overrides: Partial<SolicitudEntity> = {},
  ): Partial<SolicitudEntity> => ({
    id: 'solicitud-uuid-001',
    tutorId: TUTOR_ID,
    estudianteId: 'estudiante-uuid-001',
    nombreEstudiante: 'Ana García',
    mensaje: 'Necesito ayuda con cálculo.',
    modalidad: 'Virtual',
    estado: SolicitudEstado.ACEPTADA,
    horarios: [{ fecha: '2026-03-25', hora: '14:00' }],
    ofertaId: 'oferta-uuid-0001',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    oferta: mockOferta as any,
    createdAt: new Date('2026-03-20T10:00:00Z'),
    updatedAt: new Date('2026-03-20T10:00:00Z'),
    acceptedAt: new Date('2026-03-20T11:00:00Z'),
    completedAt: null,
    acceptedMeetingLink: 'https://meet.google.com/abc',
    acceptedMeetingLocation: null,
    rejectionReason: null,
    rejectionComment: null,
    respondedAt: null,
    ...overrides,
  });

  const buildQBMock = (entities: Partial<SolicitudEntity>[]) => {
    const qb: Record<string, jest.Mock> = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      getMany: jest.fn().mockResolvedValue(entities),
    };
    Object.keys(qb).forEach((key) => {
      if (key !== 'getMany') {
        qb[key].mockReturnValue(qb);
      }
    });
    mockSolicitudRepository.createQueryBuilder.mockReturnValue(qb);
    return qb;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgendaService,
        {
          provide: getRepositoryToken(SolicitudEntity),
          useValue: mockSolicitudRepository,
        },
      ],
    }).compile();

    service = module.get<AgendaService>(AgendaService);
  });

  afterEach(() => jest.clearAllMocks());

  // ═══════════════════════════════════════════════════════════════════════════
  // getMonthlyAgendaData
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getMonthlyAgendaData', () => {
    it('debe retornar estructura InitialAgendaDataDto correcta', async () => {
      const solicitud = makeSolicitud();
      buildQBMock([solicitud]);

      const result = await service.getMonthlyAgendaData(TUTOR_ID, 2026, 3);

      expect(result).toHaveProperty('year', 2026);
      expect(result).toHaveProperty('month', 3);
      expect(result).toHaveProperty('totalSessions');
      expect(result).toHaveProperty('calendarDays');
      expect(result).toHaveProperty('upcomingSessions');
      expect(Array.isArray(result.calendarDays)).toBe(true);
      expect(Array.isArray(result.upcomingSessions)).toBe(true);
    });

    it('debe agrupar sesiones por día en calendarDays', async () => {
      const solicitud1 = makeSolicitud({
        id: 'sol-001',
        horarios: [{ fecha: '2026-03-25', hora: '14:00' }],
      });
      const solicitud2 = makeSolicitud({
        id: 'sol-002',
        horarios: [{ fecha: '2026-03-25', hora: '16:00' }],
      });
      const solicitud3 = makeSolicitud({
        id: 'sol-003',
        horarios: [{ fecha: '2026-03-26', hora: '10:00' }],
      });
      buildQBMock([solicitud1, solicitud2, solicitud3]);

      const result = await service.getMonthlyAgendaData(TUTOR_ID, 2026, 3);

      expect(result.calendarDays.length).toBe(2);

      const day25 = result.calendarDays.find((d) => d.day === 25);
      expect(day25).toBeDefined();
      expect(day25!.sessionCount).toBe(2);
      expect(day25!.labels.length).toBe(2);

      const day26 = result.calendarDays.find((d) => d.day === 26);
      expect(day26).toBeDefined();
      expect(day26!.sessionCount).toBe(1);
    });

    it('debe retornar vacío cuando no hay sesiones en el mes', async () => {
      buildQBMock([]);

      const result = await service.getMonthlyAgendaData(TUTOR_ID, 2026, 3);

      expect(result.totalSessions).toBe(0);
      expect(result.calendarDays).toEqual([]);
      expect(result.upcomingSessions).toEqual([]);
    });

    it('debe filtrar sesiones que no caen en el mes consultado', async () => {
      const solicitudAbril = makeSolicitud({
        id: 'sol-abril',
        horarios: [{ fecha: '2026-04-15', hora: '10:00' }],
      });
      buildQBMock([solicitudAbril]);

      const result = await service.getMonthlyAgendaData(TUTOR_ID, 2026, 3);

      expect(result.totalSessions).toBe(0);
      expect(result.calendarDays).toEqual([]);
    });

    it('debe ordenar calendarDays por número de día', async () => {
      const sol1 = makeSolicitud({
        id: 'sol-1',
        horarios: [{ fecha: '2026-03-30', hora: '09:00' }],
      });
      const sol2 = makeSolicitud({
        id: 'sol-2',
        horarios: [{ fecha: '2026-03-05', hora: '11:00' }],
      });
      buildQBMock([sol1, sol2]);

      const result = await service.getMonthlyAgendaData(TUTOR_ID, 2026, 3);

      expect(result.calendarDays[0].day).toBe(5);
      expect(result.calendarDays[1].day).toBe(30);
    });

    it('debe incluir sesiones COMPLETADAS en la agenda', async () => {
      const completada = makeSolicitud({
        id: 'sol-completada',
        estado: SolicitudEstado.COMPLETADA,
        horarios: [{ fecha: '2026-03-10', hora: '08:00' }],
      });
      buildQBMock([completada]);

      const result = await service.getMonthlyAgendaData(TUTOR_ID, 2026, 3);

      expect(result.totalSessions).toBe(1);
    });

    it('debe ordenar upcomingSessions por fecha y hora', async () => {
      const sol1 = makeSolicitud({
        id: 'sol-1',
        horarios: [{ fecha: '2026-03-26', hora: '16:00' }],
      });
      const sol2 = makeSolicitud({
        id: 'sol-2',
        horarios: [{ fecha: '2026-03-25', hora: '10:00' }],
      });
      buildQBMock([sol1, sol2]);

      const result = await service.getMonthlyAgendaData(TUTOR_ID, 2026, 3);

      expect(result.upcomingSessions[0].date).toBe('2026-03-25');
      expect(result.upcomingSessions[1].date).toBe('2026-03-26');
    });
  });
});
