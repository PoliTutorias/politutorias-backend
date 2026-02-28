/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * ============================================================
 * FASE ROJA (TDD) — HU34: Registrar Datos Básicos del Tutor
 * ============================================================
 *
 * Tests e2e del TutorController.
 *
 * MOTIVO DE FALLO INICIAL (RED):
 * - TutorController no existe todavía → módulo no encontrado.
 * - TutorService no existe todavía → módulo no encontrado.
 * - JwtAuthGuard no existe todavía → módulo no encontrado.
 * - RegistrarDatosBasicosDto, Facultades y Semestres no existen → módulo no encontrado.
 *
 * Para pasar a VERDE hay que crear:
 *   src/tutors/tutor.controller.ts
 *   src/tutors/tutor.service.ts
 *   src/tutors/dto/registrar-datos-basicos.dto.ts  (con enums)
 *   src/tutors/guards/jwt-auth.guard.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  UnauthorizedException,
  ExecutionContext,
} from '@nestjs/common';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';

// ── Imports que aún NO existen (causan fallo en la fase ROJA) ──────────────
import { TutorController } from './tutor.controller';
import { TutorService } from './tutor.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  RegistrarDatosBasicosDto,
  Facultades,
  Semestres,
} from './dto/registrar-datos-basicos.dto';
// ─────────────────────────────────────────────────────────────────────────────

// ── Datos de prueba fijos ─────────────────────────────────────────────────
const MOCK_USER_ID = 'user-uuid-123';

const VALID_DTO: RegistrarDatosBasicosDto = {
  nombreCompleto: 'Juan Pérez',
  numeroWhatsapp: '3001234567',
  facultad: Facultades.FIS_SISTEMAS,
  semestreActual: Semestres.QUINTO,
  biografiaCorta: 'Tutor con más de tres años de experiencia en matemáticas.',
};

const TUTOR_CREADO = {
  id: uuidv4(),
  userId: MOCK_USER_ID,
  nombreCompleto: VALID_DTO.nombreCompleto,
  numeroWhatsapp: VALID_DTO.numeroWhatsapp,
  facultad: VALID_DTO.facultad,
  semestreActual: VALID_DTO.semestreActual,
  biografiaCorta: VALID_DTO.biografiaCorta,
  createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  updatedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
};

const TUTOR_ACTUALIZADO = {
  ...TUTOR_CREADO,
  nombreCompleto: 'Juan Pérez Actualizado',
  updatedAt: new Date('2026-02-01T00:00:00.000Z').toISOString(),
};

// ── Mock del servicio ──────────────────────────────────────────────────────
const mockTutorService = {
  registrarDatosBasicos: jest.fn(),
};

// ── Guard que autentica (simula usuario logueado) ─────────────────────────
const authenticatedGuard = {
  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest<{ user: { id: string } }>();
    req.user = { id: MOCK_USER_ID };
    return true;
  },
};

// ── Guard que rechaza (simula token ausente/inválido) ─────────────────────
const unauthorizedGuard = {
  canActivate: () => {
    throw new UnauthorizedException();
  },
};

// =============================================================================
// Suite principal: usuario AUTENTICADO
// =============================================================================
describe('TutorController (e2e) — HU34 [usuario autenticado]', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TutorController],
      providers: [{ provide: TutorService, useValue: mockTutorService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(authenticatedGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    // Misma configuración que main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Escenario 1: Upsert → CREATE (nuevo perfil)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Escenario 1: Registro de nuevo perfil de tutor (Upsert - Create)', () => {
    it('debe responder 201 con success:true y el TutorEntity creado', async () => {
      mockTutorService.registrarDatosBasicos.mockResolvedValueOnce(
        TUTOR_CREADO,
      );

      const response = await request(app.getHttpServer())
        .post('/api/tutor/datos-basicos')
        .send(VALID_DTO)
        .expect(201);

      // Estructura general de la respuesta
      expect(response.body).toEqual({
        success: true,
        message: 'Datos básicos registrados con éxito',
        data: expect.objectContaining({
          id: expect.stringMatching(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
          ),
          userId: MOCK_USER_ID,
          nombreCompleto: VALID_DTO.nombreCompleto,
          numeroWhatsapp: VALID_DTO.numeroWhatsapp,
          facultad: VALID_DTO.facultad,
          semestreActual: VALID_DTO.semestreActual,
          biografiaCorta: VALID_DTO.biografiaCorta,
        }),
      });

      // El servicio fue llamado con userId y dto correctos
      expect(mockTutorService.registrarDatosBasicos).toHaveBeenCalledTimes(1);
      expect(mockTutorService.registrarDatosBasicos).toHaveBeenCalledWith(
        MOCK_USER_ID,
        expect.objectContaining(VALID_DTO),
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Escenario 2: Upsert → UPDATE (perfil existente)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Escenario 2: Actualización de perfil de tutor existente (Upsert - Update)', () => {
    it('debe responder 201 con el mismo id del tutor y los datos actualizados', async () => {
      const dtoActualizado: RegistrarDatosBasicosDto = {
        ...VALID_DTO,
        nombreCompleto: 'Juan Pérez Actualizado',
      };

      mockTutorService.registrarDatosBasicos.mockResolvedValueOnce(
        TUTOR_ACTUALIZADO,
      );

      const response = await request(app.getHttpServer())
        .post('/api/tutor/datos-basicos')
        .send(dtoActualizado)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Datos básicos registrados con éxito',
        data: expect.objectContaining({
          id: TUTOR_ACTUALIZADO.id, // mismo id → no se creó uno nuevo
          userId: MOCK_USER_ID,
          nombreCompleto: 'Juan Pérez Actualizado',
        }),
      });

      expect(mockTutorService.registrarDatosBasicos).toHaveBeenCalledTimes(1);
      expect(mockTutorService.registrarDatosBasicos).toHaveBeenCalledWith(
        MOCK_USER_ID,
        expect.objectContaining(dtoActualizado),
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Escenario 4: Validación DTO — nombreCompleto ausente/vacío
  // ───────────────────────────────────────────────────────────────────────────
  describe('Escenario 4: Validación DTO — nombreCompleto ausente o vacío', () => {
    it('debe responder 400 con el mensaje "El nombre es obligatorio."', async () => {
      const dtoInvalido = { ...VALID_DTO, nombreCompleto: '' };

      const response = await request(app.getHttpServer())
        .post('/api/tutor/datos-basicos')
        .send(dtoInvalido)
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toEqual(
        expect.arrayContaining(['El nombre es obligatorio.']),
      );

      expect(mockTutorService.registrarDatosBasicos).not.toHaveBeenCalled();
    });

    it('debe responder 400 cuando nombreCompleto está ausente del body', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { nombreCompleto: _, ...dtoSinNombre } = VALID_DTO;

      const response = await request(app.getHttpServer())
        .post('/api/tutor/datos-basicos')
        .send(dtoSinNombre)
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toEqual(
        expect.arrayContaining(['El nombre es obligatorio.']),
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Escenario 5: Validación DTO — nombreCompleto con menos de 3 caracteres
  // ───────────────────────────────────────────────────────────────────────────
  describe('Escenario 5: Validación DTO — nombreCompleto con longitud mínima no cumplida', () => {
    it('debe responder 400 con "El nombre debe tener al menos 3 caracteres." cuando nombreCompleto = "ab"', async () => {
      const dtoInvalido = { ...VALID_DTO, nombreCompleto: 'ab' };

      const response = await request(app.getHttpServer())
        .post('/api/tutor/datos-basicos')
        .send(dtoInvalido)
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toEqual(
        expect.arrayContaining(['El nombre debe tener al menos 3 caracteres.']),
      );

      expect(mockTutorService.registrarDatosBasicos).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Escenario 6: Validación DTO — nombreCompleto con caracteres no permitidos
  // ───────────────────────────────────────────────────────────────────────────
  describe('Escenario 6: Validación DTO — nombreCompleto con formato incorrecto', () => {
    it('debe responder 400 con "El nombre solo puede contener letras y espacios." cuando nombreCompleto = "Juan123"', async () => {
      const dtoInvalido = { ...VALID_DTO, nombreCompleto: 'Juan123' };

      const response = await request(app.getHttpServer())
        .post('/api/tutor/datos-basicos')
        .send(dtoInvalido)
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          'El nombre solo puede contener letras y espacios.',
        ]),
      );

      expect(mockTutorService.registrarDatosBasicos).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Escenario 7: Validación DTO — enum inválido (facultad / semestreActual)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Escenario 7: Validación DTO — valor de enum inválido', () => {
    it('debe responder 400 con "Selecciona una facultad válida." cuando facultad es inválida', async () => {
      const dtoInvalido = { ...VALID_DTO, facultad: 'FacultadInvalida' };

      const response = await request(app.getHttpServer())
        .post('/api/tutor/datos-basicos')
        .send(dtoInvalido)
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toEqual(
        expect.arrayContaining(['Selecciona una facultad válida.']),
      );

      expect(mockTutorService.registrarDatosBasicos).not.toHaveBeenCalled();
    });

    it('debe responder 400 con "Selecciona un semestre válido." cuando semestreActual es inválido', async () => {
      const dtoInvalido = { ...VALID_DTO, semestreActual: 'SemestreInvalido' };

      const response = await request(app.getHttpServer())
        .post('/api/tutor/datos-basicos')
        .send(dtoInvalido)
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toEqual(
        expect.arrayContaining(['Selecciona un semestre válido.']),
      );

      expect(mockTutorService.registrarDatosBasicos).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Escenario 8: Error interno del servidor (fallo inesperado del servicio)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Escenario 8: Error interno del servidor', () => {
    it('debe responder 500 con el mensaje acordado cuando el servicio lanza una excepción inesperada', async () => {
      mockTutorService.registrarDatosBasicos.mockRejectedValueOnce(
        new Error('Fallo inesperado en la base de datos'),
      );

      const response = await request(app.getHttpServer())
        .post('/api/tutor/datos-basicos')
        .send(VALID_DTO)
        .expect(500);

      expect(response.body).toEqual({
        statusCode: 500,
        message: 'Error interno del servidor al registrar datos básicos.',
      });

      expect(mockTutorService.registrarDatosBasicos).toHaveBeenCalledTimes(1);
    });
  });
});

// =============================================================================
// Suite secundaria: usuario NO AUTENTICADO
// =============================================================================
describe('TutorController (e2e) — HU34 [usuario no autenticado]', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TutorController],
      providers: [{ provide: TutorService, useValue: mockTutorService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(unauthorizedGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Escenario 3: Acceso no autorizado (JWT ausente/inválido)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Escenario 3: Acceso no autorizado', () => {
    it('debe responder 401 con { statusCode: 401, message: "Unauthorized" }', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tutor/datos-basicos')
        .send(VALID_DTO)
        .expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
      });

      expect(mockTutorService.registrarDatosBasicos).not.toHaveBeenCalled();
    });
  });
});
