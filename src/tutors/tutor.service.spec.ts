/**
 * ============================================================
 * FASE ROJA (TDD) — HU34: Registrar Datos Básicos del Tutor
 * ============================================================
 *
 * Tests unitarios de TutorService.registrarDatosBasicos.
 *
 * MOTIVO DE FALLO INICIAL (RED):
 * - TutorService no existe todavía → módulo no encontrado.
 * - registrarDatosBasicos no está implementado.
 * - RegistrarDatosBasicosDto, Facultades y Semestres no existen → módulo no encontrado.
 * - La entidad Tutor no tiene los campos requeridos (userId, nombreCompleto, etc.).
 *
 * Para pasar a VERDE hay que crear / refactorizar:
 *   src/tutors/tutor.service.ts              (lógica upsert)
 *   src/tutors/dto/registrar-datos-basicos.dto.ts
 *   src/tutors/entities/tutor.entity.ts      (refactorizar con los campos de HU34)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';

// ── Imports que aún NO existen completamente (causan fallo en la fase ROJA) ─
import {
  Facultades,
  RegistrarDatosBasicosDto,
  Semestres,
} from './dto/registrar-datos-basicos.dto';
import { Tutor } from './entities/tutor.entity';
import { TutorService } from './tutor.service';
// ─────────────────────────────────────────────────────────────────────────────

// ── Datos de prueba fijos ─────────────────────────────────────────────────
const MOCK_USER_ID = 'user-uuid-abc';
const MOCK_TUTOR_ID = 'tutor-uuid-xyz';

const VALID_DTO: RegistrarDatosBasicosDto = {
  nombreCompleto: 'María García',
  numeroWhatsapp: '3109876543',
  facultad: Facultades.FIS_SISTEMAS,
  semestreActual: Semestres.TERCERO,
  biografiaCorta:
    'Tutora especializada en programación orientada a objetos y estructuras de datos.',
  fotoPerfil: 'https://storage.example.com/fotos/maria-garcia.jpg',
};

/** Entidad simulada que devuelve el repositorio (perfil existente) */
const EXISTING_TUTOR: Partial<Tutor> = {
  id: MOCK_TUTOR_ID,
  userId: MOCK_USER_ID,
  nombreCompleto: 'María García (antigua)',
  numeroWhatsapp: '3109876543',
  facultad: Facultades.FIS_SISTEMAS,
  semestreActual: Semestres.SEGUNDO,
  biografiaCorta: 'Descripción anterior.',
  fotoPerfil: 'https://storage.example.com/fotos/antigua.jpg',
};

/** Entidad que devuelve create() + save() al crear un perfil nuevo */
const NEW_TUTOR: Partial<Tutor> = {
  id: 'nuevo-tutor-uuid-001',
  userId: MOCK_USER_ID,
  nombreCompleto: VALID_DTO.nombreCompleto,
  numeroWhatsapp: VALID_DTO.numeroWhatsapp,
  facultad: VALID_DTO.facultad,
  semestreActual: VALID_DTO.semestreActual,
  biografiaCorta: VALID_DTO.biografiaCorta,
  fotoPerfil: VALID_DTO.fotoPerfil ?? null,
};

// ── Mock del repositorio TypeORM ──────────────────────────────────────────
const mockTutorRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

// =============================================================================
describe('TutorService — registrarDatosBasicos (Unit Tests) — HU34', () => {
  let service: TutorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TutorService,
        {
          provide: getRepositoryToken(Tutor),
          useValue: mockTutorRepository,
        },
      ],
    }).compile();

    service = module.get<TutorService>(TutorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Escenario 1: Upsert → CREATE (sin perfil existente)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Escenario 1: Registro de nuevo perfil de tutor (Upsert - Create)', () => {
    it('debe llamar findOne, create y save; y retornar el TutorEntity creado', async () => {
      // GIVEN: no existe ningún tutor con ese userId
      mockTutorRepository.findOne.mockResolvedValueOnce(null);
      mockTutorRepository.create.mockReturnValueOnce(NEW_TUTOR);
      mockTutorRepository.save.mockResolvedValueOnce(NEW_TUTOR);

      // WHEN
      const result = await service.registrarDatosBasicos(
        MOCK_USER_ID,
        VALID_DTO,
      );

      // THEN — findOne buscó por userId
      expect(mockTutorRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockTutorRepository.findOne).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID },
      });

      // THEN — create fue llamado con el userId y todos los campos del DTO
      expect(mockTutorRepository.create).toHaveBeenCalledTimes(1);
      expect(mockTutorRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: MOCK_USER_ID,
          nombreCompleto: VALID_DTO.nombreCompleto,
          numeroWhatsapp: VALID_DTO.numeroWhatsapp,
          facultad: VALID_DTO.facultad,
          semestreActual: VALID_DTO.semestreActual,
          biografiaCorta: VALID_DTO.biografiaCorta,
          fotoPerfil: VALID_DTO.fotoPerfil,
        }),
      );

      // THEN — save fue llamado con la entidad creada
      expect(mockTutorRepository.save).toHaveBeenCalledTimes(1);
      expect(mockTutorRepository.save).toHaveBeenCalledWith(NEW_TUTOR);

      // THEN — retorna la entidad con id y userId
      expect(result).toMatchObject({
        id: NEW_TUTOR.id,
        userId: MOCK_USER_ID,
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Escenario 2: Upsert → UPDATE (perfil existente)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Escenario 2: Actualización de perfil de tutor existente (Upsert - Update)', () => {
    it('debe llamar findOne y save SIN llamar create; y retornar el TutorEntity actualizado', async () => {
      // GIVEN: ya existe un tutor con ese userId
      const updatedTutor = {
        ...EXISTING_TUTOR,
        nombreCompleto: VALID_DTO.nombreCompleto,
        semestreActual: VALID_DTO.semestreActual,
        biografiaCorta: VALID_DTO.biografiaCorta,
      };

      mockTutorRepository.findOne.mockResolvedValueOnce(EXISTING_TUTOR);
      mockTutorRepository.save.mockResolvedValueOnce(updatedTutor);

      // WHEN
      const result = await service.registrarDatosBasicos(
        MOCK_USER_ID,
        VALID_DTO,
      );

      // THEN — findOne buscó por userId
      expect(mockTutorRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockTutorRepository.findOne).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID },
      });

      // THEN — create NO fue llamado (es update, no create)
      expect(mockTutorRepository.create).not.toHaveBeenCalled();

      // THEN — save fue llamado con los datos actualizados sobre la entidad existente
      expect(mockTutorRepository.save).toHaveBeenCalledTimes(1);
      expect(mockTutorRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: MOCK_TUTOR_ID,
          nombreCompleto: VALID_DTO.nombreCompleto,
          numeroWhatsapp: VALID_DTO.numeroWhatsapp,
          facultad: VALID_DTO.facultad,
          semestreActual: VALID_DTO.semestreActual,
          biografiaCorta: VALID_DTO.biografiaCorta,
          fotoPerfil: VALID_DTO.fotoPerfil,
        }),
      );

      // THEN — el id no cambió
      expect(result).toMatchObject({
        id: MOCK_TUTOR_ID,
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Escenario 8: Restricción de unicidad de numeroWhatsapp (DB UNIQUE violation)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Escenario 8: Restricción de Persistencia — numeroWhatsapp duplicado', () => {
    it('debe propagar la QueryFailedError lanzada por repository.save', async () => {
      // GIVEN: save simula una violación de UNIQUE constraint
      const uniqueViolationError = new QueryFailedError(
        'INSERT INTO tutors ...',
        [],
        new Error(
          'duplicate key value violates unique constraint "UQ_tutors_numeroWhatsapp"',
        ),
      );

      mockTutorRepository.findOne.mockResolvedValueOnce(null);
      mockTutorRepository.create.mockReturnValueOnce(NEW_TUTOR);
      mockTutorRepository.save.mockRejectedValueOnce(uniqueViolationError);

      // WHEN / THEN
      await expect(
        service.registrarDatosBasicos(MOCK_USER_ID, VALID_DTO),
      ).rejects.toThrow(QueryFailedError);

      expect(mockTutorRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Escenario 9: Error genérico inesperado durante la persistencia
  // ───────────────────────────────────────────────────────────────────────────
  describe('Escenario 9: Error interno del servidor (inesperado durante la persistencia)', () => {
    it('debe propagar el Error genérico lanzado por repository.save', async () => {
      // GIVEN: save simula un fallo inesperado (ej. conexión perdida)
      const unexpectedError = new Error(
        'Connection lost: The server closed the connection.',
      );

      mockTutorRepository.findOne.mockResolvedValueOnce(null);
      mockTutorRepository.create.mockReturnValueOnce(NEW_TUTOR);
      mockTutorRepository.save.mockRejectedValueOnce(unexpectedError);

      // WHEN / THEN
      await expect(
        service.registrarDatosBasicos(MOCK_USER_ID, VALID_DTO),
      ).rejects.toThrow(Error);

      await expect(
        // Llamada adicional para verificar el mensaje exacto
        (async () => {
          mockTutorRepository.findOne.mockResolvedValueOnce(null);
          mockTutorRepository.create.mockReturnValueOnce(NEW_TUTOR);
          mockTutorRepository.save.mockRejectedValueOnce(unexpectedError);
          await service.registrarDatosBasicos(MOCK_USER_ID, VALID_DTO);
        })(),
      ).rejects.toThrow('Connection lost: The server closed the connection.');

      expect(mockTutorRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});
