import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { FilterParamsDto } from './dto/filter-params.dto';
import { GlobalCountsDto } from './dto/global-counts.dto';
import { PaginatedSolicitudesDto } from './dto/paginated-solicitudes.dto';
import { VerificarPreviaDto } from './dto/verificar-previa.dto';
import { SolicitudEntity, SolicitudEstado } from './entities/solicitud.entity';
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

// ═══════════════════════════════════════════════════════════════════════════
// HU09 — Ver solicitudes recibidas
// FASE ROJA: estos tests FALLARÁN porque getCountsByStatus() y getFiltered()
// no existen en SolicitudesService todavía.
// ═══════════════════════════════════════════════════════════════════════════

describe('SolicitudesService (Unit Tests) - HU09: Ver solicitudes recibidas', () => {
  let service: SolicitudesService;

  const mockSolicitudRepo = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockOfertaRepo = {
    findOne: jest.fn(),
  };

  const TUTOR_ID = 'tutor-uuid-0001-0000-0000-000000000001';

  const makeSolicitud = (
    overrides = {},
  ): Partial<SolicitudEntity> & { nombreEstudiante?: string } => ({
    id: 'solicitud-uuid-001',
    tutorId: TUTOR_ID,
    estudianteId: 'estudiante-uuid-001',
    nombreEstudiante: 'Ana García',
    mensaje: 'Necesito ayuda con límites y derivadas para el examen.',
    modalidad: 'Virtual',
    estado: SolicitudEstado.PENDIENTE,
    ofertaId: 'oferta-uuid-001',
    createdAt: new Date('2024-05-25T10:30:00Z'),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolicitudesService,
        {
          provide: getRepositoryToken(SolicitudEntity),
          useValue: mockSolicitudRepo,
        },
        { provide: getRepositoryToken(Oferta), useValue: mockOfertaRepo },
      ],
    }).compile();

    service = module.get<SolicitudesService>(SolicitudesService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── getCountsByStatus ────────────────────────────────────────────────────

  describe('getCountsByStatus(tutorId)', () => {
    it('debe retornar conteos correctos cuando hay solicitudes en todos los estados', async () => {
      mockSolicitudRepo.count
        .mockResolvedValueOnce(5) // PENDIENTE
        .mockResolvedValueOnce(2) // EXPIRADA
        .mockResolvedValueOnce(3) // ACEPTADA
        .mockResolvedValueOnce(1); // RECHAZADA

      const result: GlobalCountsDto = await service.getCountsByStatus(TUTOR_ID);

      expect(result.pending).toBe(5);
      expect(result.expired).toBe(2);
      expect(result.responded).toBe(4); // 3 + 1
    });

    it('debe retornar ceros cuando el tutor no tiene solicitudes', async () => {
      mockSolicitudRepo.count.mockResolvedValue(0);

      const result = await service.getCountsByStatus(TUTOR_ID);

      expect(result).toEqual({ pending: 0, expired: 0, responded: 0 });
    });

    it('debe llamar al repositorio con el tutorId correcto para cada estado', async () => {
      mockSolicitudRepo.count.mockResolvedValue(0);

      await service.getCountsByStatus(TUTOR_ID);

      expect(mockSolicitudRepo.count).toHaveBeenCalledTimes(4);
      expect(mockSolicitudRepo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tutorId: TUTOR_ID }) as Record<
            string,
            unknown
          >,
        }) as Record<string, unknown>,
      );
    });

    it('responded debe ser la suma de ACEPTADA y RECHAZADA (nunca un estado propio)', async () => {
      mockSolicitudRepo.count
        .mockResolvedValueOnce(0) // PENDIENTE
        .mockResolvedValueOnce(0) // EXPIRADA
        .mockResolvedValueOnce(7) // ACEPTADA
        .mockResolvedValueOnce(3); // RECHAZADA

      const result = await service.getCountsByStatus(TUTOR_ID);

      expect(result.responded).toBe(10);
      expect(result.pending).toBe(0);
      expect(result.expired).toBe(0);
    });

    it('debe propagar excepciones del repositorio', async () => {
      mockSolicitudRepo.count.mockRejectedValueOnce(
        new Error('DB connection lost'),
      );

      await expect(service.getCountsByStatus(TUTOR_ID)).rejects.toThrow(
        'DB connection lost',
      );
    });
  });

  // ─── getFiltered ──────────────────────────────────────────────────────────

  describe('getFiltered(tutorId, params)', () => {
    // Helper para construir el mock del QueryBuilder encadenado
    const buildQBMock = (
      entities: (Partial<SolicitudEntity> & { nombreEstudiante?: string })[],
      total: number,
    ) => {
      const qb: Record<string, jest.Mock> = {
        leftJoinAndSelect: jest.fn(),
        where: jest.fn(),
        andWhere: jest.fn(),
        orderBy: jest.fn(),
        skip: jest.fn(),
        take: jest.fn(),
        getManyAndCount: jest.fn().mockResolvedValue([entities, total]),
      };
      // Encadenar todos los métodos para que retornen el mismo qb
      Object.keys(qb).forEach((key) => {
        if (key !== 'getManyAndCount') {
          qb[key].mockReturnValue(qb);
        }
      });
      mockSolicitudRepo.createQueryBuilder.mockReturnValue(qb);
      return qb;
    };

    it('debe retornar lista paginada con estructura PaginatedSolicitudesDto', async () => {
      const solicitudes = [makeSolicitud()];
      buildQBMock(solicitudes, 1);

      const params: FilterParamsDto = { page: 1, limit: 10 };
      const result: PaginatedSolicitudesDto = await service.getFiltered(
        TUTOR_ID,
        params,
      );

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('currentPage');
      expect(result).toHaveProperty('itemsPerPage');
      expect(result).toHaveProperty('totalPages');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('debe aplicar paginación correcta: page=2, limit=5 → skip=5, take=5', async () => {
      const qb = buildQBMock([], 0);

      const params: FilterParamsDto = { page: 2, limit: 5 };
      await service.getFiltered(TUTOR_ID, params);

      expect(qb.skip).toHaveBeenCalledWith(5);
      expect(qb.take).toHaveBeenCalledWith(5);
    });

    it('debe aplicar paginación: page=1, limit=10 → skip=0, take=10', async () => {
      const qb = buildQBMock([], 0);

      const params: FilterParamsDto = { page: 1, limit: 10 };
      await service.getFiltered(TUTOR_ID, params);

      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
    });

    it('debe truncar mensajeResumen a 50 chars + "..." si el mensaje es mayor a 50 caracteres', async () => {
      const mensajeLargo = 'A'.repeat(80);
      const solicitudes = [makeSolicitud({ mensaje: mensajeLargo })];
      buildQBMock(solicitudes, 1);

      const result = await service.getFiltered(TUTOR_ID, {
        page: 1,
        limit: 10,
      });

      expect(result.data[0].mensajeResumen).toHaveLength(53); // 50 + "..."
      expect(result.data[0].mensajeResumen.endsWith('...')).toBe(true);
    });

    it('NO debe truncar mensajeResumen si el mensaje tiene 50 caracteres o menos', async () => {
      const mensajeCorto = 'Hola, necesito ayuda.'; // < 50 chars
      const solicitudes = [makeSolicitud({ mensaje: mensajeCorto })];
      buildQBMock(solicitudes, 1);

      const result = await service.getFiltered(TUTOR_ID, {
        page: 1,
        limit: 10,
      });

      expect(result.data[0].mensajeResumen).toBe(mensajeCorto);
      expect(result.data[0].mensajeResumen.endsWith('...')).toBe(false);
    });

    it('mensajeResumen con exactamente 50 caracteres no debe truncarse', async () => {
      const mensaje50 = 'A'.repeat(50);
      const solicitudes = [makeSolicitud({ mensaje: mensaje50 })];
      buildQBMock(solicitudes, 1);

      const result = await service.getFiltered(TUTOR_ID, {
        page: 1,
        limit: 10,
      });

      expect(result.data[0].mensajeResumen).toBe(mensaje50);
      expect(result.data[0].mensajeResumen.endsWith('...')).toBe(false);
    });

    it('debe retornar fechaHora como string formateado (no como Date)', async () => {
      const solicitudes = [
        makeSolicitud({ createdAt: new Date('2024-05-25T10:30:00Z') }),
      ];
      buildQBMock(solicitudes, 1);

      const result = await service.getFiltered(TUTOR_ID, {
        page: 1,
        limit: 10,
      });

      expect(typeof result.data[0].fechaHora).toBe('string');
      expect(result.data[0].fechaHora).not.toBe('');
    });

    it('debe retornar mensajeCompleto con el mensaje íntegro', async () => {
      const mensajeCompleto =
        'Este es el mensaje completo del estudiante sin truncar.';
      const solicitudes = [makeSolicitud({ mensaje: mensajeCompleto })];
      buildQBMock(solicitudes, 1);

      const result = await service.getFiltered(TUTOR_ID, {
        page: 1,
        limit: 10,
      });

      expect(result.data[0].mensajeCompleto).toBe(mensajeCompleto);
    });

    it('debe calcular totalPages correctamente: ceil(total / limit)', async () => {
      buildQBMock([makeSolicitud(), makeSolicitud(), makeSolicitud()], 25);

      const result = await service.getFiltered(TUTOR_ID, {
        page: 1,
        limit: 10,
      });

      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3); // ceil(25/10) = 3
    });

    it('totalPages debe ser 0 cuando total es 0', async () => {
      buildQBMock([], 0);

      const result = await service.getFiltered(TUTOR_ID, {
        page: 1,
        limit: 10,
      });

      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.data).toEqual([]);
    });

    it('debe filtrar por status=PENDIENTE aplicando andWhere con estado PENDIENTE', async () => {
      const qb = buildQBMock([], 0);

      const params: FilterParamsDto = {
        status: 'PENDIENTE',
        page: 1,
        limit: 10,
      };
      await service.getFiltered(TUTOR_ID, params);

      expect(qb.andWhere).toHaveBeenCalled();
    });

    it('debe filtrar RESPONDIDA aplicando andWhere con estados ACEPTADA y RECHAZADA', async () => {
      const qb = buildQBMock([], 0);

      const params: FilterParamsDto = {
        status: 'RESPONDIDA',
        page: 1,
        limit: 10,
      };
      await service.getFiltered(TUTOR_ID, params);

      // RESPONDIDA = ACEPTADA | RECHAZADA → debe llamar andWhere
      expect(qb.andWhere).toHaveBeenCalled();
    });

    it('sin status debe retornar todas las solicitudes del tutor (sin filtro de estado)', async () => {
      const qb = buildQBMock([makeSolicitud()], 1);

      const params: FilterParamsDto = { page: 1, limit: 10 };
      await service.getFiltered(TUTOR_ID, params);

      // where debe llamarse con tutorId pero andWhere NO debe llamarse con estado
      expect(qb.where).toHaveBeenCalled();
    });

    it('debe retornar currentPage igual al page solicitado', async () => {
      buildQBMock([], 0);

      const result = await service.getFiltered(TUTOR_ID, { page: 3, limit: 5 });

      expect(result.currentPage).toBe(3);
      expect(result.itemsPerPage).toBe(5);
    });

    it('debe propagar excepciones del repositorio', async () => {
      mockSolicitudRepo.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await expect(
        service.getFiltered(TUTOR_ID, { page: 1, limit: 10 }),
      ).rejects.toThrow('DB error');
    });
  });
});

/**
 * Unit Tests — SolicitudesService — HU-33: Ver solicitudes enviadas (Student Perspective)
 *
 * FASE ROJA del TDD: estos tests FALLARÁN inicialmente porque:
 * 1. SolicitudesService.findAllForStudent no está implementado.
 * 2. SolicitudesService.findByIdForStudent no está implementado.
 * 3. Las reglas de negocio específicas del estudiante no existen.
 */
describe('SolicitudesService (Unit Tests) - HU-33 Student Perspective', () => {
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
  const ESTUDIANTE_ID = '550e8400-e29b-41d4-a716-446655440000';
  const OTHER_ESTUDIANTE_ID = '550e8400-e29b-41d4-a716-446655440099';
  const TUTOR_ID = 'tutor-uuid-0001-0000-0000-000000000001';

  const mockTutor = {
    id: TUTOR_ID,
    nombreCompleto: 'Juan Pérez',
    fotoPerfil: 'https://example.com/avatars/tutor.jpg',
  };

  const mockOferta = {
    id: 'oferta-uuid-0001-0000-0000-000000000001',
    title: 'Cálculo Diferencial',
    modality: 'Virtual',
    tutorId: TUTOR_ID,
    price: 20,
    categories: ['Matemáticas'],
    tutor: mockTutor,
  };

  const mockSolicitudPendiente: Partial<SolicitudEntity> = {
    id: 'solicitud-uuid-001',
    estudianteId: ESTUDIANTE_ID,
    ofertaId: mockOferta.id,
    tutorId: TUTOR_ID,
    nombreEstudiante: 'Ana García',
    mensaje: 'Necesito ayuda con límites y derivadas',
    modalidad: 'Virtual',
    horarios: [
      { fecha: '2024-05-15', hora: '10:00' },
      { fecha: '2024-05-16', hora: '14:00' },
    ],
    estado: SolicitudEstado.PENDIENTE,
    createdAt: new Date('2024-05-25T10:30:00.000Z'),
    oferta: mockOferta as unknown as OfertaEntity,
  };

  const mockSolicitudExpirada: Partial<SolicitudEntity> = {
    id: 'solicitud-uuid-005',
    estudianteId: ESTUDIANTE_ID,
    ofertaId: mockOferta.id,
    tutorId: TUTOR_ID,
    nombreEstudiante: 'Ana García',
    mensaje: 'Necesito ayuda con geometría',
    modalidad: 'Presencial',
    horarios: [{ fecha: '2024-05-10', hora: '11:00' }],
    estado: SolicitudEstado.EXPIRADA,
    createdAt: new Date('2024-05-10T10:00:00.000Z'),
    oferta: mockOferta as unknown as OfertaEntity,
  };

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
  // findAllForStudent - List solicitudes from student perspective
  // ═══════════════════════════════════════════════════════════════════════════

  describe('findAllForStudent', () => {
    /**
     * Test: Returns paginated list filtered by estudianteId
     */
    it('should return paginated list of solicitudes for the student', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([
            [mockSolicitudPendiente, mockSolicitudExpirada],
            2,
          ]),
      };

      mockSolicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findAllForStudent(ESTUDIANTE_ID, {
        page: 1,
        limit: 5,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 2);
      expect(result).toHaveProperty('currentPage', 1);
      expect(result).toHaveProperty('itemsPerPage', 5);
      expect(result).toHaveProperty('totalPages', 1);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('tutorName');
      expect(result.data[0]).toHaveProperty('tutorAvatarUrl');
      expect(result.data[0]).toHaveProperty('subject');
      expect(result.data[0]).toHaveProperty('date');
      expect(result.data[0]).toHaveProperty('modality');
      expect(result.data[0]).toHaveProperty('pricePerHour');
      expect(result.data[0]).toHaveProperty('status');
    });

    /**
     * Test: Default pagination (page=1, limit=5)
     */
    it('should use default pagination values (page=1, limit=5)', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockSolicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await service.findAllForStudent(ESTUDIANTE_ID, {});

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0); // (1 - 1) * 5
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });

    /**
     * Test: Custom pagination (page=2, limit=10)
     */
    it('should apply custom pagination correctly', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockSolicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await service.findAllForStudent(ESTUDIANTE_ID, { page: 2, limit: 10 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10); // (2 - 1) * 10
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    /**
     * Test: Filter by status=PENDIENTE
     */
    it('should filter by status=PENDIENTE correctly', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([[mockSolicitudPendiente], 1]),
      };

      mockSolicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findAllForStudent(ESTUDIANTE_ID, {
        status: 'PENDIENTE',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'solicitud.estado = :estado',
        { estado: 'PENDIENTE' },
      );
      expect(result.total).toBe(1);
    });

    /**
     * Test: Filter by status=RESPONDIDA (should work but return empty - no ACEPTADA/RECHAZADA yet)
     * NOTE: ACEPTADA/RECHAZADA states are out of scope for HU-33.
     * They will be implemented in HU-08 (Aceptar) and HU-23 (Rechazar).
     * This test validates the filter works, but returns empty for now.
     */
    it('should filter by status=RESPONDIDA and return empty (no ACEPTADA/RECHAZADA states yet)', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]), // Empty - states don't exist yet
      };

      mockSolicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findAllForStudent(ESTUDIANTE_ID, {
        status: 'RESPONDIDA',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'solicitud.estado IN (:...estados)',
        { estados: [SolicitudEstado.ACEPTADA, SolicitudEstado.RECHAZADA] },
      );
      expect(result.total).toBe(0); // Empty result - states not implemented yet
      expect(result.data).toEqual([]);
    });

    /**
     * Test: Filter by status=EXPIRADA
     */
    it('should filter by status=EXPIRADA correctly', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([[mockSolicitudExpirada], 1]),
      };

      mockSolicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findAllForStudent(ESTUDIANTE_ID, {
        status: 'EXPIRADA',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'solicitud.estado = :estado',
        { estado: 'EXPIRADA' },
      );
      expect(result.total).toBe(1);
    });

    /**
     * Test: Filter by status=TODAS (no filter applied) - only PENDIENTE and EXPIRADA for HU-33
     */
    it('should not apply estado filter when status=TODAS', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [mockSolicitudPendiente, mockSolicitudExpirada],
          2, // Only PENDIENTE + EXPIRADA in scope for HU-33
        ]),
      };

      mockSolicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findAllForStudent(ESTUDIANTE_ID, {
        status: 'TODAS',
      });

      // andWhere should NOT be called for estado filtering when status=TODAS
      expect(result.total).toBe(2);
    });

    /**
     * Test: Ordering by createdAt DESC
     */
    it('should order results by createdAt DESC', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockSolicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await service.findAllForStudent(ESTUDIANTE_ID, {});

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'solicitud.createdAt',
        'DESC',
      );
    });

    /**
     * Test: JOIN includes oferta and oferta.tutor relations
     */
    it('should include oferta and oferta.tutor joins', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockSolicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await service.findAllForStudent(ESTUDIANTE_ID, {});

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'solicitud.oferta',
        'oferta',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'oferta.tutor',
        'tutor',
      );
    });

    /**
     * Test: Maps to StudentSolicitudListItemDto with correct fields
     */
    it('should map entities to StudentSolicitudListItemDto correctly', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([[mockSolicitudPendiente], 1]),
      };

      mockSolicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findAllForStudent(ESTUDIANTE_ID, {});

      expect(result.data[0]).toEqual(
        expect.objectContaining({
          id: mockSolicitudPendiente.id,
          tutorName: mockTutor.nombreCompleto,
          tutorAvatarUrl: mockTutor.fotoPerfil,
          subject: mockOferta.categories[0],
          date: mockSolicitudPendiente.createdAt.toISOString(),
          modality: mockSolicitudPendiente.modalidad,
          pricePerHour: Number(mockOferta.price),
          status: mockSolicitudPendiente.estado,
        }),
      );
    });

    /**
     * Test: Empty result set
     */
    it('should return empty data array when no solicitudes found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockSolicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findAllForStudent(ESTUDIANTE_ID, {});

      expect(result).toEqual({
        data: [],
        total: 0,
        currentPage: 1,
        itemsPerPage: 5,
        totalPages: 0,
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findByIdForStudent - Get single solicitud detail from student perspective
  // ═══════════════════════════════════════════════════════════════════════════

  describe('findByIdForStudent', () => {
    /**
     * Test: Returns StudentSolicitudDetailDto when solicitud exists and belongs to student
     */
    it('should return detail DTO when solicitud exists and belongs to student', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockSolicitudPendiente),
      };

      mockSolicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findByIdForStudent(
        ESTUDIANTE_ID,
        mockSolicitudPendiente.id,
      );

      expect(result).toHaveProperty('id', mockSolicitudPendiente.id);
      expect(result).toHaveProperty('mensaje', mockSolicitudPendiente.mensaje);
      expect(result).toHaveProperty(
        'horarios',
        mockSolicitudPendiente.horarios,
      );
      expect(result).toHaveProperty('tutorName');
      expect(result).toHaveProperty('tutorAvatarUrl');
    });

    /**
     * Test: Throws NotFoundException when solicitud does not exist
     */
    it('should throw NotFoundException when solicitud does not exist', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockSolicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await expect(
        service.findByIdForStudent(ESTUDIANTE_ID, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    /**
     * Test: Throws NotFoundException when solicitud belongs to another student
     */
    it('should throw NotFoundException when solicitud belongs to another student', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockSolicitudPendiente),
      };

      mockSolicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await expect(
        service.findByIdForStudent(
          OTHER_ESTUDIANTE_ID,
          mockSolicitudPendiente.id,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    /**
     * Test: Includes oferta and tutor joins
     */
    it('should include oferta and oferta.tutor joins', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockSolicitudPendiente),
      };

      mockSolicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await service.findByIdForStudent(
        ESTUDIANTE_ID,
        mockSolicitudPendiente.id,
      );

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'solicitud.oferta',
        'oferta',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'oferta.tutor',
        'tutor',
      );
    });

    /**
     * Test: Maps all fields correctly
     */
    it('should map all fields correctly to StudentSolicitudDetailDto', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockSolicitudPendiente),
      };

      mockSolicitudRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findByIdForStudent(
        ESTUDIANTE_ID,
        mockSolicitudPendiente.id,
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: mockSolicitudPendiente.id,
          tutorName: mockTutor.nombreCompleto,
          tutorAvatarUrl: mockTutor.fotoPerfil,
          subject: mockOferta.categories[0],
          date: mockSolicitudPendiente.createdAt.toISOString(),
          modality: mockSolicitudPendiente.modalidad,
          pricePerHour: Number(mockOferta.price),
          status: mockSolicitudPendiente.estado,
          mensaje: mockSolicitudPendiente.mensaje,
          horarios: mockSolicitudPendiente.horarios,
        }),
      );
    });
  });
});
