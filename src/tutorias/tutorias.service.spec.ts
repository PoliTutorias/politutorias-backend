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
            save: jest.fn(),
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

  /**
   * FASE ROJA - HU-48: Reportar Inasistencia
   * Estos tests fallarán hasta implementar el método reportarInasistencia()
   */
  describe('reportarInasistencia', () => {
    const tutoriaId = '550e8400-e29b-41d4-a716-446655440000';
    const tutorId = 'tutor-123';

    it('debe lanzar NotFoundException si la solicitud no existe', async () => {
      // Arrange: Mock retorna null (no existe)
      solicitudRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.reportarInasistencia(tutoriaId, tutorId),
      ).rejects.toThrow(NotFoundException);

      expect(solicitudRepository.findOne).toHaveBeenCalledWith({
        where: { id: tutoriaId },
        relations: ['oferta', 'oferta.tutor', 'oferta.materia'],
      });
    });

    it('debe lanzar NotFoundException si el tutorId no coincide (ownership)', async () => {
      // Arrange: Mock retorna solicitud de otro tutor
      const mockSolicitud = {
        id: tutoriaId,
        tutorId: 'otro-tutor-456', // Diferente al tutorId solicitante
        estado: SolicitudEstado.ACEPTADA,
        horarios: [{ fecha: '2024-05-24', hora: '10:00' }],
      };

      solicitudRepository.findOne.mockResolvedValue(
        mockSolicitud as SolicitudEntity,
      );

      // Act & Assert
      await expect(
        service.reportarInasistencia(tutoriaId, tutorId),
      ).rejects.toThrow(NotFoundException);

      // No debe llamar a save()
      expect(solicitudRepository.save).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el estado no es ACEPTADA', async () => {
      // Arrange: Mock solicitud en estado COMPLETADA
      const mockSolicitud = {
        id: tutoriaId,
        tutorId,
        estado: SolicitudEstado.COMPLETADA, // No es ACEPTADA
        horarios: [{ fecha: '2024-05-24', hora: '10:00' }],
      };

      solicitudRepository.findOne.mockResolvedValue(
        mockSolicitud as SolicitudEntity,
      );

      // Act & Assert
      await expect(
        service.reportarInasistencia(tutoriaId, tutorId),
      ).rejects.toThrow(
        'Solo se puede reportar inasistencia para tutorías sin confirmar (ACEPTADA).',
      );

      // No debe llamar a save()
      expect(solicitudRepository.save).not.toHaveBeenCalled();
    });

    it('debe actualizar el estado a NO_SHOW y llamar a save() cuando todo es válido', async () => {
      // Arrange: Mock solicitud válida
      const mockSolicitud = {
        id: tutoriaId,
        tutorId,
        estado: SolicitudEstado.ACEPTADA,
        horarios: [{ fecha: '2024-05-24', hora: '10:00' }],
        noShowAt: null,
      };

      solicitudRepository.findOne.mockResolvedValue(
        mockSolicitud as SolicitudEntity,
      );

      const mockUpdatedSolicitud = {
        ...mockSolicitud,
        estado: SolicitudEstado.NO_SHOW,
        noShowAt: expect.any(Date),
      };

      solicitudRepository.save.mockResolvedValue(
        mockUpdatedSolicitud as SolicitudEntity,
      );

      // Act
      const result = await service.reportarInasistencia(tutoriaId, tutorId);

      // Assert
      expect(solicitudRepository.findOne).toHaveBeenCalledWith({
        where: { id: tutoriaId },
        relations: ['oferta', 'oferta.tutor', 'oferta.materia'],
      });

      expect(solicitudRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: tutoriaId,
          estado: SolicitudEstado.NO_SHOW,
          noShowAt: expect.any(Date),
        }),
      );

      expect(result.estado).toBe(SolicitudEstado.NO_SHOW);
    });

    it('debe establecer noShowAt con un timestamp actual', async () => {
      // Arrange
      const mockSolicitud = {
        id: tutoriaId,
        tutorId,
        estado: SolicitudEstado.ACEPTADA,
        horarios: [{ fecha: '2024-05-24', hora: '10:00' }],
        noShowAt: null,
      };

      solicitudRepository.findOne.mockResolvedValue(
        mockSolicitud as SolicitudEntity,
      );

      const savedSolicitud: Partial<SolicitudEntity> = { ...mockSolicitud };
      solicitudRepository.save.mockImplementation((entity: SolicitudEntity) => {
        savedSolicitud.estado = entity.estado;
        savedSolicitud.noShowAt = entity.noShowAt;
        return Promise.resolve(savedSolicitud as SolicitudEntity);
      });

      // Act
      const beforeCall = new Date();
      await service.reportarInasistencia(tutoriaId, tutorId);
      const afterCall = new Date();

      // Assert: verificar que save fue llamado con un Date válido
      const savedEntity = solicitudRepository.save.mock
        .calls[0][0] as SolicitudEntity;
      expect(savedEntity.noShowAt).toBeInstanceOf(Date);
      expect(savedEntity.noShowAt!.getTime()).toBeGreaterThanOrEqual(
        beforeCall.getTime(),
      );
      expect(savedEntity.noShowAt!.getTime()).toBeLessThanOrEqual(
        afterCall.getTime(),
      );
    });
  });

  describe('marcarCompletada', () => {
    const tutoriaId = '550e8400-e29b-41d4-a716-446655440000';
    const tutorId = 'tutor-123';

    // U-01: Tutoría no existe
    it('should throw NotFoundException if tutorial does not exist', async () => {
      // Arrange: Mock retorna null (no existe)
      solicitudRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.marcarCompletada(tutoriaId, tutorId),
      ).rejects.toThrow(NotFoundException);

      expect(solicitudRepository.findOne).toHaveBeenCalledWith({
        where: { id: tutoriaId },
        relations: ['oferta', 'oferta.tutor', 'oferta.materia'],
      });
    });

    // U-02: Ownership validation
    it('should throw NotFoundException if tutorId does not match', async () => {
      // Arrange: Mock retorna solicitud de otro tutor
      const mockSolicitud = {
        id: tutoriaId,
        tutorId: 'otro-tutor-456', // Diferente al tutorId solicitante
        estado: SolicitudEstado.ACEPTADA,
        horarios: [{ fecha: '2024-05-24', hora: '10:00' }],
      };

      solicitudRepository.findOne.mockResolvedValue(
        mockSolicitud as SolicitudEntity,
      );

      // Act & Assert
      await expect(
        service.marcarCompletada(tutoriaId, tutorId),
      ).rejects.toThrow(NotFoundException);

      // No debe llamar a save()
      expect(solicitudRepository.save).not.toHaveBeenCalled();
    });

    // U-03: Estado inválido
    it('should throw BadRequestException if status is not ACEPTADA', async () => {
      // Arrange: Mock solicitud en estado COMPLETADA
      const mockSolicitud = {
        id: tutoriaId,
        tutorId,
        estado: SolicitudEstado.COMPLETADA, // No es ACEPTADA
        horarios: [{ fecha: '2024-05-24', hora: '10:00' }],
      };

      solicitudRepository.findOne.mockResolvedValue(
        mockSolicitud as SolicitudEntity,
      );

      // Act & Assert
      await expect(
        service.marcarCompletada(tutoriaId, tutorId),
      ).rejects.toThrow('Solo se pueden completar tutorías programadas');

      // No debe llamar a save()
      expect(solicitudRepository.save).not.toHaveBeenCalled();
    });

    // U-04: Happy path
    it('should update status to COMPLETADA and save', async () => {
      // Arrange: Mock solicitud válida
      const mockSolicitud = {
        id: tutoriaId,
        tutorId,
        estado: SolicitudEstado.ACEPTADA,
        horarios: [{ fecha: '2024-05-24', hora: '10:00' }],
        completedAt: null,
        updatedAt: new Date('2024-05-24T10:00:00Z'),
      };

      solicitudRepository.findOne.mockResolvedValue(
        mockSolicitud as SolicitudEntity,
      );

      const mockUpdatedSolicitud = {
        ...mockSolicitud,
        estado: SolicitudEstado.COMPLETADA,
        completedAt: expect.any(Date),
        updatedAt: new Date('2024-05-24T10:30:00Z'),
      };

      solicitudRepository.save.mockResolvedValue(
        mockUpdatedSolicitud as SolicitudEntity,
      );

      // Act
      const result = await service.marcarCompletada(tutoriaId, tutorId);

      // Assert
      expect(solicitudRepository.findOne).toHaveBeenCalledWith({
        where: { id: tutoriaId },
        relations: ['oferta', 'oferta.tutor', 'oferta.materia'],
      });

      expect(solicitudRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: tutoriaId,
          estado: SolicitudEstado.COMPLETADA,
          completedAt: expect.any(Date),
        }),
      );

      // Validar estructura del resultado
      expect(result).toEqual({
        success: true,
        message: 'Tutoría marcada como completada',
        data: {
          id: tutoriaId,
          status: 'completed',
          updatedAt: expect.any(String),
        },
      });
    });

    // U-05: Timestamp actualizado
    it('should set completedAt timestamp when marking as completed', async () => {
      // Arrange
      const mockSolicitud = {
        id: tutoriaId,
        tutorId,
        estado: SolicitudEstado.ACEPTADA,
        horarios: [{ fecha: '2024-05-24', hora: '10:00' }],
        completedAt: null,
        updatedAt: new Date('2024-05-24T10:00:00Z'),
      };

      solicitudRepository.findOne.mockResolvedValue(
        mockSolicitud as SolicitudEntity,
      );

      const savedSolicitud: Partial<SolicitudEntity> = { ...mockSolicitud };
      solicitudRepository.save.mockImplementation((entity: SolicitudEntity) => {
        savedSolicitud.estado = entity.estado;
        savedSolicitud.completedAt = entity.completedAt;
        savedSolicitud.updatedAt = new Date();
        return Promise.resolve(savedSolicitud as SolicitudEntity);
      });

      // Act
      const beforeCall = new Date();
      await service.marcarCompletada(tutoriaId, tutorId);
      const afterCall = new Date();

      // Assert: verificar que save fue llamado con un Date válido
      const savedEntity = solicitudRepository.save.mock
        .calls[0][0] as SolicitudEntity;
      expect(savedEntity.completedAt).toBeInstanceOf(Date);
      expect(savedEntity.completedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeCall.getTime(),
      );
      expect(savedEntity.completedAt!.getTime()).toBeLessThanOrEqual(
        afterCall.getTime(),
      );
    });
  });
});
