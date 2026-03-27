/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import {
  SolicitudEntity,
  SolicitudEstado,
} from '../solicitudes/entities/solicitud.entity';
import { HistoryQueryParamsDto } from './dto/history-query-params.dto';
import { TutoriasService } from './tutorias.service';

/**
 * Unit Tests — TutoriasService — HU-39
 *
 * FASE ROJA del TDD: estos tests FALLARÁN inicialmente porque:
 * 1. TutoriasService no tiene los métodos implementados.
 * 2. Los métodos getHistorial, getDetalle, getSummary no existen.
 */

describe('TutoriasService', () => {
  let service: TutoriasService;
  let solicitudRepository: jest.Mocked<Repository<SolicitudEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TutoriasService,
        {
          provide: getRepositoryToken(SolicitudEntity),
          useValue: {
            count: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Oferta),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TutoriasService>(TutoriasService);
    solicitudRepository = module.get(getRepositoryToken(SolicitudEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHistorial', () => {
    it('debe filtrar estrictamente por tutorId', async () => {
      const tutorId = 'tutor-123';
      const params: HistoryQueryParamsDto = { page: 1, limit: 5 };

      const mockSolicitudes = [
        {
          id: 'sol-1',
          tutorId,
          estudianteId: 'student-1',
          nombreEstudiante: 'Juan Pérez',
          estado: SolicitudEstado.COMPLETADA,
          horarios: [{ fecha: '2024-05-20', hora: '14:00' }],
          oferta: {
            titulo: 'Cálculo Diferencial',
            precioHora: 15,
          },
        },
      ];

      // Mock count
      solicitudRepository.count.mockResolvedValue(1);

      // Mock find

      solicitudRepository.find.mockResolvedValue(mockSolicitudes as never);

      // Mock createQueryBuilder para summary

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),

        select: jest.fn().mockReturnThis(),

        where: jest.fn().mockReturnThis(),

        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      solicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as never,
      );

      const result = await service.getHistorial(tutorId, params);

      // Verificar que se filtró por tutorId
      expect(solicitudRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tutorId,
          }),
        }),
      );

      expect(result.paginatedData.items).toHaveLength(1);
      expect(result.paginatedData.items[0].id).toBe('sol-1');
      expect(result.paginatedData.items[0].time).toBe('14:00');
    });

    it('debe mapear SolicitudEstado.COMPLETADA a "Completada"', async () => {
      const tutorId = 'tutor-123';
      const params: HistoryQueryParamsDto = { page: 1, limit: 5 };

      const mockSolicitudes = [
        {
          id: 'sol-1',
          tutorId,
          estudianteId: 'student-1',
          nombreEstudiante: 'Juan Pérez',
          estado: SolicitudEstado.COMPLETADA,
          horarios: [{ fecha: '2024-05-20', hora: '14:00' }],
          oferta: {
            titulo: 'Cálculo',
            precioHora: 15,
          },
        },
      ];

      solicitudRepository.count.mockResolvedValue(1);

      solicitudRepository.find.mockResolvedValue(mockSolicitudes as never);

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),

        select: jest.fn().mockReturnThis(),

        where: jest.fn().mockReturnThis(),

        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      solicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as never,
      );

      const result = await service.getHistorial(tutorId, params);

      expect(result.paginatedData.items[0].status).toBe('Completada');
    });

    it('debe incluir el campo time con el horario de la primera entrada', async () => {
      const tutorId = 'tutor-123';
      const params: HistoryQueryParamsDto = { page: 1, limit: 5 };

      const mockSolicitudes = [
        {
          id: 'sol-1',
          tutorId,
          estudianteId: 'student-1',
          nombreEstudiante: 'Juan Pérez',
          estado: SolicitudEstado.COMPLETADA,
          horarios: [{ fecha: '2024-05-20', hora: '11:00' }],
          oferta: {
            titulo: 'Cálculo',
            precioHora: 15,
          },
        },
      ];

      solicitudRepository.count.mockResolvedValue(1);
      solicitudRepository.find.mockResolvedValue(mockSolicitudes as never);

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      solicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as never,
      );

      const result = await service.getHistorial(tutorId, params);

      expect(result.paginatedData.items[0].time).toBe('11:00');
    });

    it('debe calcular lastPage correctamente (total=25, limit=5 → lastPage=5)', async () => {
      const tutorId = 'tutor-123';
      const params: HistoryQueryParamsDto = { page: 1, limit: 5 };

      solicitudRepository.count.mockResolvedValue(25);
      solicitudRepository.find.mockResolvedValue([]);

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),

        select: jest.fn().mockReturnThis(),

        where: jest.fn().mockReturnThis(),

        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      solicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as never,
      );

      const result = await service.getHistorial(tutorId, params);

      expect(result.paginatedData.total).toBe(25);
      expect(result.paginatedData.lastPage).toBe(5); // Math.ceil(25/5) = 5
    });
  });

  describe('getDetalle', () => {
    it('debe lanzar NotFoundException si tutorId no coincide (ownership)', async () => {
      const tutorId = 'tutor-123';
      const solicitudId = 'sol-1';

      const mockSolicitud = {
        id: solicitudId,
        tutorId: 'other-tutor', // Diferente tutorId
        estudianteId: 'student-1',
        nombreEstudiante: 'Juan Pérez',
        estado: SolicitudEstado.COMPLETADA,
        mensaje: 'Test',
        modalidad: 'Virtual',
        horarios: [{ fecha: '2024-05-20', hora: '14:00' }],
        acceptedMeetingLink: 'https://zoom.us/j/123',
        oferta: {
          titulo: 'Cálculo',
          precioHora: 15,
        },
      };

      solicitudRepository.findOne.mockResolvedValue(mockSolicitud as never);

      await expect(service.getDetalle(tutorId, solicitudId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar NotFoundException si la solicitud no existe', async () => {
      const tutorId = 'tutor-123';
      const solicitudId = 'non-existent-id';

      solicitudRepository.findOne.mockResolvedValue(null);

      await expect(service.getDetalle(tutorId, solicitudId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe mapear modalidad Virtual a meetingLink', async () => {
      const tutorId = 'tutor-123';
      const solicitudId = 'sol-1';

      const mockSolicitud = {
        id: solicitudId,
        tutorId,
        estudianteId: 'student-1',
        nombreEstudiante: 'Juan Pérez',
        estado: SolicitudEstado.COMPLETADA,
        mensaje: 'Test',
        modalidad: 'Virtual',
        horarios: [{ fecha: '2024-05-20', hora: '14:00' }],
        acceptedMeetingLink: 'https://zoom.us/j/123',
        acceptedMeetingLocation: null,
        oferta: {
          titulo: 'Cálculo',
          precioHora: 15,
        },
      };

      solicitudRepository.findOne.mockResolvedValue(mockSolicitud as never);

      const result = await service.getDetalle(tutorId, solicitudId);

      expect(result.meetingLink).toBe('https://zoom.us/j/123');
      expect(result.location).toBeNull();
    });

    it('debe mapear modalidad Presencial a location', async () => {
      const tutorId = 'tutor-123';
      const solicitudId = 'sol-1';

      const mockSolicitud = {
        id: solicitudId,
        tutorId,
        estudianteId: 'student-1',
        nombreEstudiante: 'Juan Pérez',
        estado: SolicitudEstado.COMPLETADA,
        mensaje: 'Test',
        modalidad: 'Presencial',
        horarios: [{ fecha: '2024-05-20', hora: '14:00' }],
        acceptedMeetingLink: null,
        acceptedMeetingLocation: 'Biblioteca Central, Sala 3',
        oferta: {
          titulo: 'Cálculo',
          precioHora: 15,
        },
      };

      solicitudRepository.findOne.mockResolvedValue(mockSolicitud as never);

      const result = await service.getDetalle(tutorId, solicitudId);

      expect(result.location).toBe('Biblioteca Central, Sala 3');
      expect(result.meetingLink).toBeNull();
    });

    it('debe generar avatar URL usando UI Avatars', async () => {
      const tutorId = 'tutor-123';
      const solicitudId = 'sol-1';

      const mockSolicitud = {
        id: solicitudId,
        tutorId,
        estudianteId: 'student-1',
        nombreEstudiante: 'Juan Pérez',
        estado: SolicitudEstado.COMPLETADA,
        mensaje: 'Test avatar',
        modalidad: 'Virtual',
        horarios: [{ fecha: '2024-05-20', hora: '14:00' }],
        acceptedMeetingLink: 'https://zoom.us/j/123',
        acceptedMeetingLocation: null,
        oferta: {
          titulo: 'Cálculo',
          precioHora: 15,
        },
      };

      solicitudRepository.findOne.mockResolvedValue(mockSolicitud as never);

      const result = await service.getDetalle(tutorId, solicitudId);

      expect(result.student.name).toBe('Juan Pérez');
      expect(result.student.avatar).toBe(
        'https://ui-avatars.com/api/?name=Juan+P%C3%A9rez&background=0D8ABC&color=fff&size=128&bold=true&rounded=true',
      );
    });

    it('debe generar avatar por defecto para nombre genérico', async () => {
      const tutorId = 'tutor-123';
      const solicitudId = 'sol-1';

      const mockSolicitud = {
        id: solicitudId,
        tutorId,
        estudianteId: 'student-1',
        nombreEstudiante: null, // Nombre null
        estado: SolicitudEstado.COMPLETADA,
        mensaje: 'Test avatar por defecto',
        modalidad: 'Virtual',
        horarios: [{ fecha: '2024-05-20', hora: '14:00' }],
        acceptedMeetingLink: 'https://zoom.us/j/123',
        acceptedMeetingLocation: null,
        oferta: {
          titulo: 'Cálculo',
          precioHora: 15,
        },
      };

      solicitudRepository.findOne.mockResolvedValue(mockSolicitud as never);

      const result = await service.getDetalle(tutorId, solicitudId);

      expect(result.student.name).toBe('Estudiante');
      expect(result.student.avatar).toBe(
        'https://ui-avatars.com/api/?name=E&background=6c757d&color=fff&size=128&bold=true&rounded=true',
      );
    });
  });

  describe('getSummary', () => {
    it('debe calcular totalStudents con COUNT DISTINCT estudianteId', async () => {
      const tutorId = 'tutor-123';

      solicitudRepository.count.mockResolvedValue(10);

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),

        select: jest.fn().mockReturnThis(),

        where: jest.fn().mockReturnThis(),

        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      // Mock para materias

      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([
          { materia: 'Cálculo' },
          { materia: 'Álgebra' },
        ] as never)
        .mockResolvedValueOnce([
          { estudianteId: 'student-1' },
          { estudianteId: 'student-2' },
          { estudianteId: 'student-3' },
        ] as never);

      solicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as never,
      );

      const result = await service.getSummary(tutorId);

      expect(result.totalStudents).toBe(3);
    });

    it('debe calcular totalSubjects con COUNT DISTINCT oferta.titulo', async () => {
      const tutorId = 'tutor-123';

      solicitudRepository.count.mockResolvedValue(10);

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),

        select: jest.fn().mockReturnThis(),

        where: jest.fn().mockReturnThis(),

        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      // Mock para materias (primer llamado a getRawMany)

      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([
          { materia: 'Cálculo Diferencial' },
          { materia: 'Álgebra Lineal' },
          { materia: 'Física I' },
          { materia: 'Química General' },
        ] as never)
        .mockResolvedValueOnce([{ estudianteId: 'student-1' }] as never);

      solicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as never,
      );

      const result = await service.getSummary(tutorId);

      expect(result.totalSubjects).toBe(4);
    });
  });
});
