import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { SolicitudEntity, SolicitudEstado } from './entities/solicitud.entity';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { VerificarPreviaDto } from './dto/verificar-previa.dto';
import { SolicitudesService } from './solicitudes.service';

/**
 * Unit Tests — SolicitudesService — HU-06: Enviar solicitud de tutoría
 *
 * FASE ROJA del TDD: estos tests FALLARÁN inicialmente porque:
 * 1. SolicitudesService.verificarSolicitudPrevia no está implementado.
 * 2. SolicitudesService.create no está implementado.
 * 3. Las reglas de negocio (modalidad dual, duplicidad, NotFoundException) no existen.
 *
 * El estudianteId se extrae del JWT (req.user.id), NO del body del DTO.
 * El tutorId se resuelve internamente desde la oferta, NO del body.
 */
describe('SolicitudesService (Unit Tests) - HU-06', () => {
  let service: SolicitudesService;

  // ─── Mocks de repositorios ────────────────────────────────────────────────
  const mockSolicitudRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockOfertaRepository = {
    findOne: jest.fn(),
  };

  // ─── Datos de prueba ──────────────────────────────────────────────────────
  const ESTUDIANTE_ID = 'test-user-123'; // TEST_USER_ID del JWT dev

  const mockOfertaVirtual: Partial<Oferta> = {
    id: 'oferta-uuid-0001-0000-0000-000000000001',
    title: 'Cálculo Diferencial',
    modality: 'Virtual',
    tutorId: 'tutor-uuid-0001-0000-0000-000000000001',
  };

  const mockOfertaPresencial: Partial<Oferta> = {
    id: 'oferta-uuid-0002-0000-0000-000000000002',
    title: 'Álgebra Lineal',
    modality: 'Presencial',
    tutorId: 'tutor-uuid-0001-0000-0000-000000000001',
  };

  const mockOfertaDual: Partial<Oferta> = {
    id: 'oferta-uuid-0003-0000-0000-000000000003',
    title: 'Física General',
    modality: 'VIRTUAL/PRESENCIAL',
    tutorId: 'tutor-uuid-0001-0000-0000-000000000001',
  };

  const mockHorarios = [
    { fecha: '2024-03-15', hora: '10:00' },
    { fecha: '2024-03-16', hora: '14:00' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolicitudesService,
        {
          provide: getRepositoryToken(SolicitudEntity),
          useValue: mockSolicitudRepository,
        },
        {
          provide: getRepositoryToken(Oferta),
          useValue: mockOfertaRepository,
        },
      ],
    }).compile();

    service = module.get<SolicitudesService>(SolicitudesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // verificarSolicitudPrevia
  // ═══════════════════════════════════════════════════════════════════════════

  describe('verificarSolicitudPrevia', () => {
    /**
     * Escenario 1: Ya existe solicitud PENDIENTE con horario solapado.
     *
     * DADO QUE: El repositorio encuentra una solicitud con estado PENDIENTE
     *           para el mismo estudianteId y ofertaId con horario solapado.
     * CUANDO:   Se llama a verificarSolicitudPrevia.
     * ENTONCES: Retorna { existe: true, mensaje: "Horario ya solicitado..." }.
     */
    it('debe retornar { existe: true, mensaje } cuando existe solicitud PENDIENTE con horario solapado', async () => {
      const dto: VerificarPreviaDto = {
        ofertaId: mockOfertaVirtual.id!,
        horarios: mockHorarios,
      };

      const solicitudExistente: Partial<SolicitudEntity> = {
        id: 'solicitud-uuid-001',
        estudianteId: ESTUDIANTE_ID,
        ofertaId: mockOfertaVirtual.id!,
        estado: SolicitudEstado.PENDIENTE,
        horarios: mockHorarios,
      };

      mockSolicitudRepository.findOne.mockResolvedValueOnce(solicitudExistente);

      const result = await service.verificarSolicitudPrevia(ESTUDIANTE_ID, dto);

      expect(result.existe).toBe(true);
      expect(result.mensaje).toContain('Horario ya solicitado');
    });

    /**
     * Escenario 2: No existe solicitud previa con horario solapado.
     *
     * DADO QUE: El repositorio NO encuentra ninguna solicitud con ese horario.
     * CUANDO:   Se llama a verificarSolicitudPrevia.
     * ENTONCES: Retorna { existe: false, mensaje: null }.
     */
    it('debe retornar { existe: false } cuando no hay colisión de horarios', async () => {
      const dto: VerificarPreviaDto = {
        ofertaId: mockOfertaVirtual.id!,
        horarios: mockHorarios,
      };

      mockSolicitudRepository.findOne.mockResolvedValueOnce(null);

      const result = await service.verificarSolicitudPrevia(ESTUDIANTE_ID, dto);

      expect(result.existe).toBe(false);
      expect(result.mensaje).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // create
  // ═══════════════════════════════════════════════════════════════════════════

  describe('create', () => {
    /**
     * Escenario 3 — Modalidad Dual: lanzar BadRequestException si la oferta
     * tiene modalidad dual ('VIRTUAL/PRESENCIAL') y el DTO no incluye modalidad.
     *
     * DADO QUE: La oferta tiene modality 'VIRTUAL/PRESENCIAL'.
     * CUANDO:   El DTO no incluye el campo modalidad.
     * ENTONCES: Lanza BadRequestException con mensaje sobre modalidad requerida.
     */
    it('debe lanzar BadRequestException si la oferta es dual y el DTO no incluye modalidad', async () => {
      const dto: CreateSolicitudDto = {
        ofertaId: mockOfertaDual.id!,
        mensaje: 'Necesito ayuda con los temas de mecánica.',
        horarios: mockHorarios,
        // modalidad no incluida
      };

      mockOfertaRepository.findOne.mockResolvedValueOnce(mockOfertaDual);

      await expect(service.create(ESTUDIANTE_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    /**
     * Escenario 4 — Modalidad Única: el service asigna automáticamente
     * la modalidad si la oferta solo tiene una (no es dual).
     *
     * DADO QUE: La oferta tiene modality 'Virtual' (única).
     * CUANDO:   El DTO no incluye modalidad.
     * ENTONCES: El service guarda la solicitud con modalidad 'Virtual' automáticamente.
     */
    it('debe asignar modalidad automáticamente si la oferta es de modalidad única', async () => {
      const dto: CreateSolicitudDto = {
        ofertaId: mockOfertaVirtual.id!,
        mensaje: 'Quiero repasar los temas de límites.',
        horarios: mockHorarios,
        // modalidad no incluida — debe asignarse automáticamente
      };

      const solicitudGuardada: Partial<SolicitudEntity> = {
        id: 'solicitud-uuid-002',
        estudianteId: ESTUDIANTE_ID,
        ofertaId: mockOfertaVirtual.id!,
        tutorId: mockOfertaVirtual.tutorId!,
        mensaje: dto.mensaje,
        modalidad: 'Virtual', // asignada automáticamente
        horarios: mockHorarios,
        estado: SolicitudEstado.PENDIENTE,
      };

      mockOfertaRepository.findOne.mockResolvedValueOnce(mockOfertaVirtual);
      mockSolicitudRepository.findOne.mockResolvedValueOnce(null); // no hay duplicados
      mockSolicitudRepository.create.mockReturnValueOnce(solicitudGuardada);
      mockSolicitudRepository.save.mockResolvedValueOnce(solicitudGuardada);

      const result = await service.create(ESTUDIANTE_ID, dto);

      // Verifica que se guardó con la modalidad asignada automáticamente
      expect(mockSolicitudRepository.save).toHaveBeenCalled();
      const savedCalls = mockSolicitudRepository.save.mock.calls as [
        Partial<SolicitudEntity>,
      ][];
      const savedEntity = savedCalls[0][0];
      expect(savedEntity.modalidad).toBe('Virtual');
      expect(result).toBeDefined();
    });

    /**
     * Escenario 5 — Oferta inexistente: lanzar NotFoundException.
     *
     * DADO QUE: El repositorio de Oferta no encuentra ninguna oferta con ese ID.
     * CUANDO:   Se llama a create con un ofertaId inexistente.
     * ENTONCES: Lanza NotFoundException.
     */
    it('debe lanzar NotFoundException si el ofertaId no existe en la base de datos', async () => {
      const dto: CreateSolicitudDto = {
        ofertaId: '00000000-0000-0000-0000-000000000000',
        mensaje: 'Mensaje de prueba válido.',
        horarios: mockHorarios,
      };

      mockOfertaRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.create(ESTUDIANTE_ID, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    /**
     * Escenario 6 — Duplicidad: lanzar BadRequestException si ya existe
     * una solicitud PENDIENTE para el mismo bloque de horario.
     *
     * DADO QUE: Ya existe una solicitud PENDIENTE del mismo estudiante
     *           para la misma oferta con horario solapado.
     * CUANDO:   Se llama a create con los mismos parámetros.
     * ENTONCES: Lanza BadRequestException con mensaje sobre duplicidad.
     */
    it('debe lanzar BadRequestException si ya existe solicitud PENDIENTE con el mismo horario', async () => {
      const dto: CreateSolicitudDto = {
        ofertaId: mockOfertaVirtual.id!,
        mensaje: 'Segunda solicitud para el mismo horario.',
        horarios: mockHorarios,
      };

      const solicitudDuplicada: Partial<SolicitudEntity> = {
        id: 'solicitud-uuid-003',
        estudianteId: ESTUDIANTE_ID,
        ofertaId: mockOfertaVirtual.id!,
        estado: SolicitudEstado.PENDIENTE,
        horarios: mockHorarios,
      };

      mockOfertaRepository.findOne.mockResolvedValueOnce(mockOfertaVirtual);
      mockSolicitudRepository.findOne.mockResolvedValueOnce(solicitudDuplicada);

      await expect(service.create(ESTUDIANTE_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    /**
     * Escenario 7 — Persistencia: se llama a repository.save() con el estado PENDIENTE.
     *
     * DADO QUE: La oferta existe, no hay duplicados, modalidad válida.
     * CUANDO:   Se llama a create con datos correctos.
     * ENTONCES: Se llama a solicitudRepository.save() con estado SolicitudEstado.PENDIENTE.
     */
    it('debe llamar a repository.save() con estado SolicitudEstado.PENDIENTE al crear exitosamente', async () => {
      const dto: CreateSolicitudDto = {
        ofertaId: mockOfertaPresencial.id!,
        mensaje: 'Necesito apoyo con álgebra lineal.',
        horarios: [{ fecha: '2024-03-20', hora: '09:00' }],
      };

      const solicitudCreada: Partial<SolicitudEntity> = {
        id: 'solicitud-uuid-004',
        estudianteId: ESTUDIANTE_ID,
        ofertaId: mockOfertaPresencial.id!,
        tutorId: mockOfertaPresencial.tutorId!,
        mensaje: dto.mensaje,
        modalidad: 'Presencial',
        horarios: dto.horarios,
        estado: SolicitudEstado.PENDIENTE,
      };

      mockOfertaRepository.findOne.mockResolvedValueOnce(mockOfertaPresencial);
      mockSolicitudRepository.findOne.mockResolvedValueOnce(null);
      mockSolicitudRepository.create.mockReturnValueOnce(solicitudCreada);
      mockSolicitudRepository.save.mockResolvedValueOnce(solicitudCreada);

      await service.create(ESTUDIANTE_ID, dto);

      // Verificar que save fue llamado
      expect(mockSolicitudRepository.save).toHaveBeenCalledTimes(1);

      // Verificar que el objeto guardado tiene estado PENDIENTE
      const savedCalls2 = mockSolicitudRepository.save.mock.calls as [
        Partial<SolicitudEntity>,
      ][];
      const savedArg = savedCalls2[0][0];
      expect(savedArg.estado).toBe(SolicitudEstado.PENDIENTE);
    });
  });
});
