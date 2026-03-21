import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  SolicitudEntity,
  SolicitudEstado,
} from '../solicitudes/entities/solicitud.entity';
import { SessionsService } from './sessions.service';

describe('SessionsService (Unit Tests) - HU15', () => {
  let service: SessionsService;

  const mockSolicitudRepository = {
    createQueryBuilder: jest.fn(),
  };

  const TUTOR_ID = 'tutor-uuid-0001-0000-0000-000000000001';
  const OTHER_TUTOR_ID = 'tutor-uuid-9999-0000-0000-000000000999';

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

  const buildGetManyQBMock = (entities: Partial<SolicitudEntity>[]) => {
    const qb: Record<string, jest.Mock> = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
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

  const buildGetOneQBMock = (entity: Partial<SolicitudEntity> | null) => {
    const qb: Record<string, jest.Mock> = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      getOne: jest.fn().mockResolvedValue(entity),
    };
    Object.keys(qb).forEach((key) => {
      if (key !== 'getOne') {
        qb[key].mockReturnValue(qb);
      }
    });
    mockSolicitudRepository.createQueryBuilder.mockReturnValue(qb);
    return qb;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getRepositoryToken(SolicitudEntity),
          useValue: mockSolicitudRepository,
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ═══════════════════════════════════════════════════════════════════════════
  // getSessionsByDay
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getSessionsByDay', () => {
    it('debe retornar estructura SelectedDayInfoDto correcta', async () => {
      const solicitud = makeSolicitud();
      buildGetManyQBMock([solicitud]);

      const result = await service.getSessionsByDay(TUTOR_ID, '2026-03-25');

      expect(result).toHaveProperty('date', '2026-03-25');
      expect(result).toHaveProperty('sessionCount');
      expect(result).toHaveProperty('sessions');
      expect(Array.isArray(result.sessions)).toBe(true);
    });

    it('debe retornar solo las sesiones que coinciden con la fecha', async () => {
      const solMatch = makeSolicitud({
        id: 'sol-match',
        horarios: [{ fecha: '2026-03-25', hora: '14:00' }],
      });
      const solNoMatch = makeSolicitud({
        id: 'sol-nomatch',
        horarios: [{ fecha: '2026-03-26', hora: '10:00' }],
      });
      buildGetManyQBMock([solMatch, solNoMatch]);

      const result = await service.getSessionsByDay(TUTOR_ID, '2026-03-25');

      expect(result.sessionCount).toBe(1);
      expect(result.sessions[0].id).toBe('sol-match');
    });

    it('debe retornar sesiones ordenadas por hora', async () => {
      const sol16 = makeSolicitud({
        id: 'sol-16',
        horarios: [{ fecha: '2026-03-25', hora: '16:00' }],
      });
      const sol09 = makeSolicitud({
        id: 'sol-09',
        horarios: [{ fecha: '2026-03-25', hora: '09:00' }],
      });
      buildGetManyQBMock([sol16, sol09]);

      const result = await service.getSessionsByDay(TUTOR_ID, '2026-03-25');

      expect(result.sessions[0].hour).toBe('09:00');
      expect(result.sessions[1].hour).toBe('16:00');
    });

    it('debe retornar vacío cuando no hay sesiones en la fecha', async () => {
      buildGetManyQBMock([]);

      const result = await service.getSessionsByDay(TUTOR_ID, '2026-03-25');

      expect(result.sessionCount).toBe(0);
      expect(result.sessions).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getDetails
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getDetails', () => {
    it('debe retornar detalle completo de una sesión Virtual', async () => {
      const solicitud = makeSolicitud({
        modalidad: 'Virtual',
        acceptedMeetingLink: 'https://meet.google.com/abc',
        acceptedMeetingLocation: null,
      });
      buildGetOneQBMock(solicitud);

      const result = await service.getDetails(TUTOR_ID, 'solicitud-uuid-001');

      expect(result.id).toBe('solicitud-uuid-001');
      expect(result.modality).toBe('Virtual');
      expect(result.meetingLink).toBe('https://meet.google.com/abc');
      expect(result.meetingLocation).toBeNull();
      expect(result.studentMessage).toBe('Necesito ayuda con cálculo.');
    });

    it('debe retornar detalle completo de una sesión Presencial', async () => {
      const solicitud = makeSolicitud({
        modalidad: 'Presencial',
        acceptedMeetingLink: null,
        acceptedMeetingLocation: 'Biblioteca Central, Sala 3',
      });
      buildGetOneQBMock(solicitud);

      const result = await service.getDetails(TUTOR_ID, 'solicitud-uuid-001');

      expect(result.modality).toBe('Presencial');
      expect(result.meetingLink).toBeNull();
      expect(result.meetingLocation).toBe('Biblioteca Central, Sala 3');
    });

    it('debe lanzar NotFoundException si la sesión no existe', async () => {
      buildGetOneQBMock(null);

      await expect(
        service.getDetails(TUTOR_ID, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar NotFoundException si la sesión no pertenece al tutor', async () => {
      const solicitud = makeSolicitud({ tutorId: OTHER_TUTOR_ID });
      buildGetOneQBMock(solicitud);

      await expect(
        service.getDetails(TUTOR_ID, 'solicitud-uuid-001'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar NotFoundException si la solicitud no está ACEPTADA ni COMPLETADA', async () => {
      const solicitud = makeSolicitud({
        estado: SolicitudEstado.PENDIENTE,
      });
      buildGetOneQBMock(solicitud);

      await expect(
        service.getDetails(TUTOR_ID, 'solicitud-uuid-001'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe retornar status COMPLETED si la solicitud está en estado COMPLETADA', async () => {
      const solicitud = makeSolicitud({
        estado: SolicitudEstado.COMPLETADA,
        completedAt: new Date('2026-03-20T15:00:00Z'),
      });
      buildGetOneQBMock(solicitud);

      const result = await service.getDetails(TUTOR_ID, 'solicitud-uuid-001');

      expect(result.status).toBe('COMPLETED');
    });

    it('debe retornar precio correcto desde la oferta', async () => {
      const solicitud = makeSolicitud();
      buildGetOneQBMock(solicitud);

      const result = await service.getDetails(TUTOR_ID, 'solicitud-uuid-001');

      expect(result.pricePerHour).toBe(10);
    });
  });
});
