import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AvailabilityEntity } from '../../../disponibilidad/entities/availability.entity';
import { ExperienciaEntity } from '../../../experiencias/entities/experiencia.entity';
import { MateriaEntity } from '../../../materias/entities/materia.entity';
import { PerfilProfesionalEntity } from '../../../perfil/entities/perfil-profesional.entity';
import { Tutor } from '../../../tutors/entities/tutor.entity';
import { Oferta } from '../../domain/entities/oferta.entity';
import { GetOfertaByIdUseCase } from './get-oferta-by-id.use-case';

// ── Helpers ──────────────────────────────────────────────────────────────────

const OFERTA_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
const TUTOR_ID = '550e8400-e29b-41d4-a716-446655440001';

function buildMockOferta(overrides: Partial<Oferta> = {}): Oferta {
  return {
    id: OFERTA_ID,
    title: 'Cálculo Diferencial',
    price: '12.50' as unknown as number,
    modality: 'Virtual',
    categories: ['Matemáticas', 'Cálculo'],
    description: 'Tutorías de cálculo diferencial.',
    rating: '4.75' as unknown as number,
    reviewsCount: 10,
    tutorId: TUTOR_ID,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as unknown as Oferta;
}

function buildMockTutor(overrides: Partial<Tutor> = {}): Tutor {
  return {
    id: TUTOR_ID,
    nombreCompleto: 'Juan Pérez',
    fotoPerfil: 'https://example.com/photo.jpg',
    semestreActual: 8,
    calificacionPromedio: 4.5,
    numResenas: 20,
    biografiaCorta: 'Tutor de matemáticas.',
    numeroWhatsapp: '+573001234567',
    ...overrides,
  } as unknown as Tutor;
}

function buildMockAvailability(): AvailabilityEntity[] {
  return [
    {
      id: 'av-1',
      tutorId: TUTOR_ID,
      day: 'Lunes',
      hour: '08:00',
    } as AvailabilityEntity,
    {
      id: 'av-2',
      tutorId: TUTOR_ID,
      day: 'Miércoles',
      hour: '10:00',
    } as AvailabilityEntity,
  ];
}

function buildMockExperiencias(): ExperienciaEntity[] {
  return [
    {
      id: 'exp-1',
      tutorId: TUTOR_ID,
      puesto: 'Monitor',
      institucion: 'ECI',
      fechaInicio: '2022-01',
      fechaFin: '2023-06',
    } as unknown as ExperienciaEntity,
  ];
}

function buildMockMaterias(): MateriaEntity[] {
  return [
    {
      id: 'mat-1',
      tutorId: TUTOR_ID,
      nombre: 'Cálculo I',
    } as unknown as MateriaEntity,
    {
      id: 'mat-2',
      tutorId: TUTOR_ID,
      nombre: 'Álgebra Lineal',
    } as unknown as MateriaEntity,
  ];
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('GetOfertaByIdUseCase', () => {
  let useCase: GetOfertaByIdUseCase;

  const mockOfertaRepo = { findOne: jest.fn() };
  const mockTutorRepo = { findOne: jest.fn() };
  const mockAvailabilityRepo = { find: jest.fn() };
  const mockExperienciaRepo = { find: jest.fn() };
  const mockMateriaRepo = { find: jest.fn() };
  const mockPerfilRepo = { findOne: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOfertaByIdUseCase,
        { provide: getRepositoryToken(Oferta), useValue: mockOfertaRepo },
        { provide: getRepositoryToken(Tutor), useValue: mockTutorRepo },
        {
          provide: getRepositoryToken(AvailabilityEntity),
          useValue: mockAvailabilityRepo,
        },
        {
          provide: getRepositoryToken(ExperienciaEntity),
          useValue: mockExperienciaRepo,
        },
        {
          provide: getRepositoryToken(MateriaEntity),
          useValue: mockMateriaRepo,
        },
        {
          provide: getRepositoryToken(PerfilProfesionalEntity),
          useValue: mockPerfilRepo,
        },
      ],
    }).compile();

    useCase = module.get<GetOfertaByIdUseCase>(GetOfertaByIdUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── Escenario 1: Detalle completo exitoso ──────────────────────────────────
  it('should return full offer detail when offer and tutor exist', async () => {
    const oferta = buildMockOferta();
    const tutor = buildMockTutor();
    const availability = buildMockAvailability();
    const experiencias = buildMockExperiencias();
    const materias = buildMockMaterias();

    mockOfertaRepo.findOne.mockResolvedValue(oferta);
    mockTutorRepo.findOne.mockResolvedValue(tutor);
    mockAvailabilityRepo.find.mockResolvedValue(availability);
    mockExperienciaRepo.find.mockResolvedValue(experiencias);
    mockMateriaRepo.find.mockResolvedValue(materias);

    const result = await useCase.execute(OFERTA_ID);

    expect(result.id).toBe(OFERTA_ID);
    expect(result.title).toBe('Cálculo Diferencial');
    expect(result.price).toBe(12.5);
    expect(result.rating).toBe(4.75);
    expect(result.categories).toEqual(['Matemáticas', 'Cálculo']);
    expect(result.tutor?.nombreCompleto).toBe('Juan Pérez');
    expect(result.tutor?.experiencias).toHaveLength(1);
    expect(result.tutor?.materias).toHaveLength(2);
    expect(result.availability).toHaveLength(2);
    expect(result.availability[0]).toEqual({ day: 'Lunes', hour: '08:00' });
  });

  // ── Escenario 2: Oferta no encontrada (RN-02) ──────────────────────────────
  it('should throw NotFoundException when offer does not exist', async () => {
    mockOfertaRepo.findOne.mockResolvedValue(null);

    await expect(useCase.execute('non-existent-uuid')).rejects.toThrow(
      NotFoundException,
    );

    expect(mockOfertaRepo.findOne).toHaveBeenCalledTimes(1);
    expect(mockTutorRepo.findOne).not.toHaveBeenCalled();
  });

  // ── Escenario 3: Disponibilidad vacía ──────────────────────────────────────
  it('should return empty availability array when tutor has no schedule', async () => {
    mockOfertaRepo.findOne.mockResolvedValue(buildMockOferta());
    mockTutorRepo.findOne.mockResolvedValue(buildMockTutor());
    mockAvailabilityRepo.find.mockResolvedValue([]);
    mockExperienciaRepo.find.mockResolvedValue([]);
    mockMateriaRepo.find.mockResolvedValue([]);

    const result = await useCase.execute(OFERTA_ID);

    expect(result.availability).toEqual([]);
    expect(result.tutor?.experiencias).toEqual([]);
    expect(result.tutor?.materias).toEqual([]);
  });

  // ── Escenario 4: Tutor no encontrado → tutor null en respuesta ─────────────
  it('should return null tutor when tutor is not found in repository', async () => {
    mockOfertaRepo.findOne.mockResolvedValue(buildMockOferta());
    mockTutorRepo.findOne.mockResolvedValue(null);
    mockAvailabilityRepo.find.mockResolvedValue([]);
    mockExperienciaRepo.find.mockResolvedValue([]);
    mockMateriaRepo.find.mockResolvedValue([]);

    const result = await useCase.execute(OFERTA_ID);

    expect(result.tutor).toBeNull();
  });

  // ── Escenario 5: price/rating como string (TypeORM DECIMAL→string) ─────────
  it('should convert DECIMAL string price and rating to number with 2 decimals', async () => {
    const oferta = buildMockOferta({
      price: '9.999' as unknown as number,
      rating: '4.9999' as unknown as number,
    });

    mockOfertaRepo.findOne.mockResolvedValue(oferta);
    mockTutorRepo.findOne.mockResolvedValue(buildMockTutor());
    mockAvailabilityRepo.find.mockResolvedValue([]);
    mockExperienciaRepo.find.mockResolvedValue([]);
    mockMateriaRepo.find.mockResolvedValue([]);

    const result = await useCase.execute(OFERTA_ID);

    expect(typeof result.price).toBe('number');
    expect(typeof result.rating).toBe('number');
    expect(result.price).toBe(10.0);
    expect(result.rating).toBe(5.0);
  });

  // ── Escenario 6: experiencia con fechaFin null ─────────────────────────────
  it('should map fechaFin as null when experiencia is ongoing', async () => {
    const expSinFin: ExperienciaEntity = {
      id: 'exp-2',
      tutorId: TUTOR_ID,
      puesto: 'Asistente',
      institucion: 'UNAL',
      fechaInicio: '2023-08',
      fechaFin: undefined,
    } as unknown as ExperienciaEntity;

    mockOfertaRepo.findOne.mockResolvedValue(buildMockOferta());
    mockTutorRepo.findOne.mockResolvedValue(buildMockTutor());
    mockAvailabilityRepo.find.mockResolvedValue([]);
    mockExperienciaRepo.find.mockResolvedValue([expSinFin]);
    mockMateriaRepo.find.mockResolvedValue([]);

    const result = await useCase.execute(OFERTA_ID);

    expect(result.tutor?.experiencias[0].fechaFin).toBeNull();
  });

  // ── Escenario 7: Consultas relacionadas se lanzan en paralelo ──────────────
  it('should query tutor, availability, experiencias and materias concurrently', async () => {
    const resolveOrder: string[] = [];

    mockOfertaRepo.findOne.mockResolvedValue(buildMockOferta());
    mockTutorRepo.findOne.mockImplementation(() => {
      resolveOrder.push('tutor');
      return Promise.resolve(buildMockTutor());
    });
    mockAvailabilityRepo.find.mockImplementation(() => {
      resolveOrder.push('availability');
      return Promise.resolve(buildMockAvailability());
    });
    mockExperienciaRepo.find.mockImplementation(() => {
      resolveOrder.push('experiencias');
      return Promise.resolve(buildMockExperiencias());
    });
    mockMateriaRepo.find.mockImplementation(() => {
      resolveOrder.push('materias');
      return Promise.resolve(buildMockMaterias());
    });

    await useCase.execute(OFERTA_ID);

    // Todos los repos deben haber sido llamados exactamente una vez
    expect(mockTutorRepo.findOne).toHaveBeenCalledTimes(1);
    expect(mockAvailabilityRepo.find).toHaveBeenCalledTimes(1);
    expect(mockExperienciaRepo.find).toHaveBeenCalledTimes(1);
    expect(mockMateriaRepo.find).toHaveBeenCalledTimes(1);
    // Los 4 deben haberse invocado (no necesariamente en orden determinístico)
    expect(resolveOrder).toHaveLength(4);
    expect(resolveOrder).toEqual(
      expect.arrayContaining([
        'tutor',
        'availability',
        'experiencias',
        'materias',
      ]),
    );
  });
});
