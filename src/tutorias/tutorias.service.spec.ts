/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/unbound-method */
import { BadRequestException, NotFoundException } from '@nestjs/common';
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
 * Unit Tests — TutoriasService — HU-39 + HU-48
 *
 * ─── CONTEXTO DE MAPEO PRD ↔ Implementación ──────────────────────────────────
 *
 * El PRD HU-48 define los enums de base de datos como:
 *   - TutorialStatus.SCHEDULED  → En la implementación real: SolicitudEstado.ACEPTADA
 *   - TutorialStatus.NO_SHOW    → En la implementación real: SolicitudEstado.NO_SHOW
 *
 * El mapeo de estado DTO definido por el PRD es:
 *   DB Value       | DTO Value (Frontend)
 *   ────────────── | ────────────────────
 *   ACEPTADA       | SIN_CONFIRMAR
 *   NO_SHOW        | INASISTENCIA
 *   COMPLETADA     | Completada
 *
 * La función `mapEstadoToDto` (privada) implementa este mapeo internamente.
 * El PRD también especifica en la sección 10.2 una función pública
 * `mapTutorialStatusToDtoStatus` que debe ser testeable de forma unitaria.
 *
 * ─── FASE ROJA — HU-48 ───────────────────────────────────────────────────────
 *
 * Los tests del bloque `reportarInasistencia` validan la lógica de negocio
 * del endpoint POST /api/tutorias/:id/inasistencia.
 *
 * REGLAS DE NEGOCIO (PRD §6 Criterios de Aceptación + §9 Casos de Error):
 *   1. Si la tutoría no existe → NotFoundException
 *   2. Si el tutorId no coincide → NotFoundException (mismo msg, por seguridad)
 *   3. Si el estado NO es ACEPTADA (completed / no-show / canceled) → BadRequestException
 *   4. En estado válido → save() llamado con NO_SHOW + retornar entidad actualizada
 *
 * NOTA: En la Fase Roja estos tests deben FALLAR si el método no está implementado.
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

  // ═══════════════════════════════════════════════════════════════════════════
  // HU-39: getHistorial
  // ═══════════════════════════════════════════════════════════════════════════
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

      expect(solicitudRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tutorId }),
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
          oferta: { titulo: 'Cálculo', precioHora: 15 },
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
          oferta: { titulo: 'Cálculo', precioHora: 15 },
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

    /**
     * HU-48 §7: El endpoint GET historial DEBE incluir el campo `status`
     * con el valor mapeado al DTO (INASISTENCIA / SIN_CONFIRMAR / Completada).
     */
    it('debe mapear SolicitudEstado.NO_SHOW a "INASISTENCIA" en el historial', async () => {
      // Arrange
      const tutorId = 'tutor-123';
      const params: HistoryQueryParamsDto = { page: 1, limit: 5 };

      const mockSolicitudes = [
        {
          id: 'sol-noshow',
          tutorId,
          estudianteId: 'student-1',
          nombreEstudiante: 'María López',
          estado: SolicitudEstado.NO_SHOW, // Tutoría con inasistencia
          horarios: [{ fecha: '2024-05-24', hora: '10:00' }],
          oferta: { titulo: 'Álgebra Lineal', precioHora: 20 },
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

      // Act
      const result = await service.getHistorial(tutorId, params);

      // Assert — PRD §7 Mapeo de Estados: NO_SHOW → INASISTENCIA
      expect(result.paginatedData.items[0].status).toBe('INASISTENCIA');
    });

    /**
     * HU-48 §7: El endpoint GET historial DEBE incluir el campo `status`
     * con el valor 'SIN_CONFIRMAR' para tutorías en estado ACEPTADA.
     */
    it('debe mapear SolicitudEstado.ACEPTADA a "SIN_CONFIRMAR" en el historial', async () => {
      // Arrange
      const tutorId = 'tutor-123';
      const params: HistoryQueryParamsDto = { page: 1, limit: 5 };

      const mockSolicitudes = [
        {
          id: 'sol-aceptada',
          tutorId,
          estudianteId: 'student-2',
          nombreEstudiante: 'Carlos Torres',
          estado: SolicitudEstado.ACEPTADA, // Tutoría programada (SIN_CONFIRMAR)
          horarios: [{ fecha: '2024-05-25', hora: '15:00' }],
          oferta: { titulo: 'Física I', precioHora: 18 },
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

      // Act
      const result = await service.getHistorial(tutorId, params);

      // Assert — PRD §7 Mapeo de Estados: ACEPTADA → SIN_CONFIRMAR
      expect(result.paginatedData.items[0].status).toBe('SIN_CONFIRMAR');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HU-39: getDetalle
  // ═══════════════════════════════════════════════════════════════════════════
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
        oferta: { titulo: 'Cálculo', precioHora: 15 },
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
        oferta: { titulo: 'Cálculo', precioHora: 15 },
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
        oferta: { titulo: 'Cálculo', precioHora: 15 },
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
        oferta: { titulo: 'Cálculo', precioHora: 15 },
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
        oferta: { titulo: 'Cálculo', precioHora: 15 },
      };

      solicitudRepository.findOne.mockResolvedValue(mockSolicitud as never);

      const result = await service.getDetalle(tutorId, solicitudId);

      expect(result.student.name).toBe('Estudiante');
      expect(result.student.avatar).toBe(
        'https://ui-avatars.com/api/?name=E&background=6c757d&color=fff&size=128&bold=true&rounded=true',
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HU-39: getSummary
  // ═══════════════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════════════
  // HU-48: reportarInasistencia — FASE ROJA
  //
  // PRD §10.2 Pruebas Unitarias:
  //   - TutoriasService: Debe lanzar BadRequestException si el estado es completed.
  //   - TutoriasService: Debe asegurar que el tutorId coincida con el de la entidad.
  //   - mapTutorialStatusToDtoStatus: INASISTENCIA cuando recibe NO_SHOW.
  //
  // PRD §9 Casos de Error:
  //   - Tutoría no encontrada           → 404 NotFoundException
  //   - Pertenece a otro tutor          → 404 NotFoundException (sin confirmar existencia)
  //   - Estado NO es SCHEDULED/ACEPTADA → 400 BadRequestException
  //   - Mensaje exacto: "Solo se puede reportar inasistencia para tutorías sin confirmar"
  //
  // PRD §5 Regla de negocio:
  //   - La inasistencia es IRREVERSIBLE una vez marcada (como cancelación / finalización).
  // ═══════════════════════════════════════════════════════════════════════════
  describe('reportarInasistencia', () => {
    /**
     * Constantes de prueba alineadas con el PRD §7 (Contrato de Datos):
     *   id: uuid-v4
     */
    const tutoriaId = '550e8400-e29b-41d4-a716-446655440000';
    const tutorId = 'tutor-123';

    // ── Error: Tutoría no encontrada ───────────────────────────────────────
    it('[ERROR] debe lanzar NotFoundException si la solicitud no existe (tutorId o id incorrecto)', async () => {
      // Arrange — el repositorio retorna null (tutoría inexistente O tutor no es dueño)
      solicitudRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.reportarInasistencia(tutoriaId, tutorId),
      ).rejects.toThrow(NotFoundException);

      // Verificar que se buscó por el id correcto
      expect(solicitudRepository.findOne).toHaveBeenCalledWith({
        where: { id: tutoriaId },
      });

      // No debe persistir cambios si no existe
      expect(solicitudRepository.save).not.toHaveBeenCalled();
    });

    // ── Error: Ownership — tutoría de otro tutor ───────────────────────────
    it('[ERROR] debe lanzar NotFoundException si el tutorId no coincide (ownership seguro)', async () => {
      // Arrange — tutoría existe pero pertenece a otro tutor
      // PRD §11 Seguridad: "No basta recibir el id; se filtra activamente por tutorId del JWT"
      const mockSolicitud: Partial<SolicitudEntity> = {
        id: tutoriaId,
        tutorId: 'otro-tutor-456', // ← Diferente al solicitante
        estado: SolicitudEstado.ACEPTADA,
        horarios: [{ fecha: '2024-05-24', hora: '10:00' }],
      };

      solicitudRepository.findOne.mockResolvedValue(
        mockSolicitud as SolicitudEntity,
      );

      // Act & Assert — mismo mensaje por seguridad (no confirmar existencia)
      await expect(
        service.reportarInasistencia(tutoriaId, tutorId),
      ).rejects.toThrow(NotFoundException);

      // No debe persistir cambios de una tutoría ajena
      expect(solicitudRepository.save).not.toHaveBeenCalled();
    });

    // ── Error: Estado COMPLETADA — no se puede marcar inasistencia ─────────
    it('[ERROR] debe lanzar BadRequestException si el estado es COMPLETADA', async () => {
      // Arrange — PRD §10.2: "Debe lanzar BadRequestException si el estado es completed"
      const mockSolicitud: Partial<SolicitudEntity> = {
        id: tutoriaId,
        tutorId,
        estado: SolicitudEstado.COMPLETADA, // ← Estado inválido para inasistencia
        horarios: [{ fecha: '2024-05-24', hora: '10:00' }],
      };

      solicitudRepository.findOne.mockResolvedValue(
        mockSolicitud as SolicitudEntity,
      );

      // Act & Assert — PRD §9: "Solo se puede reportar inasistencia para tutorías sin confirmar"
      await expect(
        service.reportarInasistencia(tutoriaId, tutorId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.reportarInasistencia(tutoriaId, tutorId),
      ).rejects.toThrow(
        'Solo se puede reportar inasistencia para tutorías sin confirmar',
      );

      // No debe persistir un cambio en estado inválido
      expect(solicitudRepository.save).not.toHaveBeenCalled();
    });

    // ── Error: Estado NO_SHOW — ya fue marcada como inasistencia ──────────
    it('[ERROR] debe lanzar BadRequestException si la tutoría ya tiene estado NO_SHOW (irreversible)', async () => {
      // Arrange — PRD §11: La inasistencia es irreversible una vez marcada
      const mockSolicitud: Partial<SolicitudEntity> = {
        id: tutoriaId,
        tutorId,
        estado: SolicitudEstado.NO_SHOW, // ← Ya fue marcada
        horarios: [{ fecha: '2024-05-24', hora: '10:00' }],
      };

      solicitudRepository.findOne.mockResolvedValue(
        mockSolicitud as SolicitudEntity,
      );

      // Act & Assert
      await expect(
        service.reportarInasistencia(tutoriaId, tutorId),
      ).rejects.toThrow(BadRequestException);

      expect(solicitudRepository.save).not.toHaveBeenCalled();
    });

    // ── Error: Estado RECHAZADA — no aplica inasistencia ──────────────────
    it('[ERROR] debe lanzar BadRequestException si el estado es RECHAZADA', async () => {
      // Arrange
      const mockSolicitud: Partial<SolicitudEntity> = {
        id: tutoriaId,
        tutorId,
        estado: SolicitudEstado.RECHAZADA, // ← Estado cancelado/rechazado
        horarios: [{ fecha: '2024-05-24', hora: '10:00' }],
      };

      solicitudRepository.findOne.mockResolvedValue(
        mockSolicitud as SolicitudEntity,
      );

      // Act & Assert — PRD §9: "Estado no es SCHEDULED → 400 Bad Request"
      await expect(
        service.reportarInasistencia(tutoriaId, tutorId),
      ).rejects.toThrow(BadRequestException);

      expect(solicitudRepository.save).not.toHaveBeenCalled();
    });

    // ── Éxito: Flujo feliz — inasistencia registrada correctamente ─────────
    it('[ÉXITO] debe actualizar el estado a NO_SHOW y llamar a save() cuando todo es válido', async () => {
      // Arrange — PRD §6 Escenario 2: tutor confirma la acción
      const mockSolicitud: Partial<SolicitudEntity> = {
        id: tutoriaId,
        tutorId,
        estado: SolicitudEstado.ACEPTADA, // ← Estado válido (SCHEDULED en PRD)
        horarios: [{ fecha: '2024-05-24', hora: '10:00' }],
        noShowAt: null,
      };

      solicitudRepository.findOne.mockResolvedValue(
        mockSolicitud as SolicitudEntity,
      );

      const mockUpdatedSolicitud: Partial<SolicitudEntity> = {
        ...mockSolicitud,
        estado: SolicitudEstado.NO_SHOW,
        noShowAt: expect.any(Date) as unknown as Date,
      };

      solicitudRepository.save.mockResolvedValue(
        mockUpdatedSolicitud as SolicitudEntity,
      );

      // Act
      const result = await service.reportarInasistencia(tutoriaId, tutorId);

      // Assert — verificar que se buscó correctamente
      expect(solicitudRepository.findOne).toHaveBeenCalledWith({
        where: { id: tutoriaId },
      });

      // Assert — PRD §7: la entidad debe guardarse con estado NO_SHOW
      expect(solicitudRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: tutoriaId,
          estado: SolicitudEstado.NO_SHOW,
          noShowAt: expect.any(Date),
        }),
      );

      // Assert — el resultado retorna el estado actualizado
      expect(result.estado).toBe(SolicitudEstado.NO_SHOW);
    });

    // ── Éxito: Timestamp noShowAt se establece en el momento de la llamada ─
    it('[ÉXITO] debe establecer noShowAt con un timestamp actual (no futuro ni pasado lejano)', async () => {
      // Arrange
      const mockSolicitud: Partial<SolicitudEntity> = {
        id: tutoriaId,
        tutorId,
        estado: SolicitudEstado.ACEPTADA,
        horarios: [{ fecha: '2024-05-24', hora: '10:00' }],
        noShowAt: null,
      };

      solicitudRepository.findOne.mockResolvedValue(
        mockSolicitud as SolicitudEntity,
      );

      // Capturar la entidad que se pasa a save() para validar el timestamp
      const savedSolicitud: Partial<SolicitudEntity> = { ...mockSolicitud };
      solicitudRepository.save.mockImplementation((entity: SolicitudEntity) => {
        savedSolicitud.estado = entity.estado;
        savedSolicitud.noShowAt = entity.noShowAt;
        return Promise.resolve(savedSolicitud as SolicitudEntity);
      });

      // Act — medir tiempo antes y después para validar el rango del timestamp
      const beforeCall = new Date();
      await service.reportarInasistencia(tutoriaId, tutorId);
      const afterCall = new Date();

      // Assert — noShowAt debe ser un Date dentro del rango de la llamada
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

    // ── Éxito: PRD §7 — el campo updatedAt existe en la entidad guardada ──
    it('[ÉXITO] la entidad retornada debe tener los campos id y updatedAt para la respuesta del controller', async () => {
      // Arrange — el controller necesita result.id y result.updatedAt
      // PRD §7 Contrato de Datos: { id, status: "no-show", updatedAt }
      const expectedUpdatedAt = new Date('2024-05-24T10:00:00.000Z');

      const mockSolicitud: Partial<SolicitudEntity> = {
        id: tutoriaId,
        tutorId,
        estado: SolicitudEstado.ACEPTADA,
        horarios: [{ fecha: '2024-05-24', hora: '10:00' }],
        noShowAt: null,
      };

      const mockSavedSolicitud: Partial<SolicitudEntity> = {
        id: tutoriaId,
        tutorId,
        estado: SolicitudEstado.NO_SHOW,
        noShowAt: expectedUpdatedAt,
        updatedAt: expectedUpdatedAt, // ← Requerido por el controller para la respuesta
      };

      solicitudRepository.findOne.mockResolvedValue(
        mockSolicitud as SolicitudEntity,
      );
      solicitudRepository.save.mockResolvedValue(
        mockSavedSolicitud as SolicitudEntity,
      );

      // Act
      const result = await service.reportarInasistencia(tutoriaId, tutorId);

      // Assert — campos necesarios para construir la respuesta del PRD
      expect(result.id).toBe(tutoriaId);
      expect(result.estado).toBe(SolicitudEstado.NO_SHOW);
      expect(result.updatedAt).toEqual(expectedUpdatedAt);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HU-48: mapTutorialStatusToDtoStatus — FASE ROJA
  //
  // PRD §10.2 Pruebas Unitarias:
  //   - mapTutorialStatusToDtoStatus: Debe retornar 'INASISTENCIA' cuando NO_SHOW.
  //   - mapTutorialStatusToDtoStatus: Debe retornar 'SIN_CONFIRMAR' cuando SCHEDULED.
  //
  // NOTA: En la implementación real, este mapeo se hace en el método privado
  // `mapEstadoToDto`. El PRD requiere que sea un método PÚBLICO y testeable.
  // Estos tests fallarán hasta que se exponga como método público.
  // ═══════════════════════════════════════════════════════════════════════════
  describe('mapTutorialStatusToDtoStatus (método público requerido por PRD §10.2)', () => {
    /**
     * PRD §10.2: "mapTutorialStatusToDtoStatus debe retornar 'INASISTENCIA'
     * cuando recibe TutorialStatus.NO_SHOW"
     *
     * Equivalente en implementación real: SolicitudEstado.NO_SHOW → 'INASISTENCIA'
     */
    it('debe retornar "INASISTENCIA" cuando el estado es NO_SHOW', () => {
      // Act & Assert
      // En la implementación actual este método es privado (`mapEstadoToDto`).
      // Este test FALLARÁ (FASE ROJA) hasta que se exponga como método público
      // con el nombre exacto `mapTutorialStatusToDtoStatus`.
      expect(
        (
          service as unknown as {
            mapTutorialStatusToDtoStatus: (s: SolicitudEstado) => string;
          }
        ).mapTutorialStatusToDtoStatus(SolicitudEstado.NO_SHOW),
      ).toBe('INASISTENCIA');
    });

    /**
     * PRD §10.2: "mapTutorialStatusToDtoStatus debe retornar 'SIN_CONFIRMAR'
     * cuando recibe TutorialStatus.SCHEDULED"
     *
     * Equivalente en implementación real: SolicitudEstado.ACEPTADA → 'SIN_CONFIRMAR'
     */
    it('debe retornar "SIN_CONFIRMAR" cuando el estado es ACEPTADA (SCHEDULED en PRD)', () => {
      // Act & Assert
      expect(
        (
          service as unknown as {
            mapTutorialStatusToDtoStatus: (s: SolicitudEstado) => string;
          }
        ).mapTutorialStatusToDtoStatus(SolicitudEstado.ACEPTADA),
      ).toBe('SIN_CONFIRMAR');
    });

    /**
     * Caso adicional para completar la cobertura del mapeo
     */
    it('debe retornar "Completada" cuando el estado es COMPLETADA', () => {
      // Act & Assert
      expect(
        (
          service as unknown as {
            mapTutorialStatusToDtoStatus: (s: SolicitudEstado) => string;
          }
        ).mapTutorialStatusToDtoStatus(SolicitudEstado.COMPLETADA),
      ).toBe('Completada');
    });
  });
});
