/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import {
    HttpStatus,
    INestApplication,
    UnauthorizedException,
    ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { DEV_JWT_TOKEN, TEST_USER_ID } from '../../src/auth/jwt.constants';
import { CreateAvailabilityUseCase } from '../../src/disponibilidad/application/use-cases/create-availability.use-case';
import { DisponibilidadController } from '../../src/disponibilidad/disponibilidad.controller';
import { DisponibilidadService } from '../../src/disponibilidad/disponibilidad.service';
import { CreateAvailabilityDto } from '../../src/disponibilidad/dto/create-availability.dto';
import { Tutor } from '../../src/tutors/entities/tutor.entity';

describe('DisponibilidadController (E2E)', () => {
  let app: INestApplication;
  let createAvailabilityUseCase: jest.Mocked<CreateAvailabilityUseCase>;
  let jwtAuthGuard: jest.Mocked<JwtAuthGuard>;
  let disponibilidadService: jest.Mocked<DisponibilidadService>;
  let tutorRepository: { findOne: jest.Mock };

  beforeEach(async () => {
    // Mock del UseCase

    createAvailabilityUseCase = {
      execute: jest.fn(),
    } as any;

    // Mock del guard - implementar canActivate para adjuntar usuario al request

    jwtAuthGuard = {
      canActivate: jest.fn((context) => {
        const request = context.switchToHttp().getRequest();

        const authHeader = request.headers.authorization;

        // Si no hay Authorization header, lanzar UnauthorizedException
        if (!authHeader) {
          throw new UnauthorizedException();
        }

        request.user = { id: TEST_USER_ID };
        return true;
      }),
    } as any;

    disponibilidadService = {
      findByTutorId: jest.fn(),
    } as any;

    tutorRepository = {
      findOne: jest.fn().mockResolvedValue({ id: TEST_USER_ID }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DisponibilidadController],
      providers: [
        {
          provide: CreateAvailabilityUseCase,
          useValue: createAvailabilityUseCase,
        },
        {
          provide: DisponibilidadService,
          useValue: disponibilidadService,
        },
        {
          provide: getRepositoryToken(Tutor),
          useValue: tutorRepository,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    // Aplicar ValidationPipe globalmente para validar DTOs
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /api/disponibilidad', () => {
    /**
     * ESC-1: Registro exitoso de nueva disponibilidad
     * Given: Valid CreateAvailabilityDto and a valid JWT representing uuid-tutor-A.
     * When: POST request to /api/disponibilidad with DTO and JWT.
     * Then: 201 Created, DisponibilidadService.save called once, response matches contract.
     */
    it('ESC-1: Debería registrar exitosamente una nueva disponibilidad', async () => {
      const createAvailabilityDto: CreateAvailabilityDto = {
        tutorId: TEST_USER_ID,
        blocks: [{ day: 'Lun', hour: '09:00' }],
      };

      const mockResponse = {
        message: 'Disponibilidad registrada exitosamente para el tutor.',
        tutorId: TEST_USER_ID,
        blocks: [{ id: 'uuid-block-1', day: 'Lun', hour: '09:00' }],
      };

      // Mock del UseCase para retornar respuesta exitosa
      createAvailabilityUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/api/disponibilidad')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(createAvailabilityDto);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toEqual(mockResponse);
      expect(createAvailabilityUseCase.execute).toHaveBeenCalledTimes(1);
      expect(createAvailabilityUseCase.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        createAvailabilityDto.blocks,
      );
    });

    /**
     * ESC-2: Actualización exitosa de disponibilidad existente
     * Given: Valid CreateAvailabilityDto with new blocks and a valid JWT representing uuid-tutor-B.
     * When: POST request to /api/disponibilidad.
     * Then: 201 Created, DisponibilidadService.save called, response matches contract.
     */
    it('ESC-2: Debería actualizar exitosamente la disponibilidad existente', async () => {
      const createAvailabilityDto: CreateAvailabilityDto = {
        tutorId: TEST_USER_ID,
        blocks: [
          { day: 'Mié', hour: '11:00' },
          { day: 'Jue', hour: '12:00' },
        ],
      };

      const mockResponse = {
        message: 'Disponibilidad registrada exitosamente para el tutor.',
        tutorId: TEST_USER_ID,
        blocks: [
          { id: 'uuid-block-2', day: 'Mié', hour: '11:00' },
          { id: 'uuid-block-3', day: 'Jue', hour: '12:00' },
        ],
      };

      createAvailabilityUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/api/disponibilidad')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(createAvailabilityDto);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toEqual(mockResponse);
      expect(createAvailabilityUseCase.execute).toHaveBeenCalledTimes(1);
      expect(createAvailabilityUseCase.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        createAvailabilityDto.blocks,
      );
    });

    /**
     * ESC-3: Prioridad del tutorId del JWT sobre el DTO
     * Given: CreateAvailabilityDto with different tutorId (uuid-tutor-X) and JWT for uuid-tutor-C.
     * When: POST request to /api/disponibilidad.
     * Then: 201 Created, service called with JWT tutorId, response tutorId is uuid-tutor-C.
     */
    it('ESC-3: TutorId del JWT debe tener prioridad sobre el del DTO', async () => {
      const dtoDifferentTutorId = '550e8400-e29b-41d4-a716-446655440099';
      const createAvailabilityDto: CreateAvailabilityDto = {
        tutorId: dtoDifferentTutorId,
        blocks: [{ day: 'Vie', hour: '14:00' }],
      };

      const mockResponse = {
        message: 'Disponibilidad registrada exitosamente para el tutor.',
        tutorId: TEST_USER_ID,
        blocks: [{ id: 'uuid-block-4', day: 'Vie', hour: '14:00' }],
      };

      createAvailabilityUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/api/disponibilidad')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(createAvailabilityDto);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body.tutorId).toBe(TEST_USER_ID);
      expect(response.body.tutorId).not.toBe(dtoDifferentTutorId);
      expect(createAvailabilityUseCase.execute).toHaveBeenCalledTimes(1);
      // UseCase debe ser llamado con tutorId del JWT
      expect(createAvailabilityUseCase.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.any(Array),
      );
    });

    /**
     * ESC-4: Petición sin autenticación JWT
     * Given: Valid CreateAvailabilityDto without Authorization header.
     * When: POST request to /api/disponibilidad without JWT.
     * Then: 401 Unauthorized, DisponibilidadService.save not called, response matches contract.
     */
    it('ESC-4: Debería retornar 401 Unauthorized sin JWT válido', async () => {
      const createAvailabilityDto: CreateAvailabilityDto = {
        tutorId: 'uuid-tutor-A',
        blocks: [{ day: 'Lun', hour: '09:00' }],
      };

      // Para este test, sin el header Authorization, el mock del guard retornará false
      const response = await request(app.getHttpServer())
        .post('/api/disponibilidad')
        .send(createAvailabilityDto);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body).toEqual({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
      });
      expect(createAvailabilityUseCase.execute).not.toHaveBeenCalled();
    });

    /**
     * ESC-5: DTO con array de blocks vacío
     * Given: Valid JWT and CreateAvailabilityDto with blocks: [].
     * When: POST request to /api/disponibilidad.
     * Then: 400 Bad Request, message: "Se debe seleccionar al menos un horario disponible."
     */
    it('ESC-5: Debería retornar 400 Bad Request si blocks está vacío', async () => {
      const createAvailabilityDto: CreateAvailabilityDto = {
        tutorId: TEST_USER_ID,
        blocks: [],
      };

      const response = await request(app.getHttpServer())
        .post('/api/disponibilidad')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(createAvailabilityDto);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
      // El mensaje puede ser un array de strings o un string
      if (Array.isArray(response.body.message)) {
        expect(response.body.message[0]).toBe(
          'Se debe seleccionar al menos un horario disponible.',
        );
      } else {
        expect(response.body.message).toBe(
          'Se debe seleccionar al menos un horario disponible.',
        );
      }
      expect(response.body.error).toBe('Bad Request');
      expect(createAvailabilityUseCase.execute).not.toHaveBeenCalled();
    });

    /**
     * ESC-6: DTO con day faltante/inválido en un bloque
     * Given: Valid JWT and CreateAvailabilityDto with blocks[0].day = null.
     * When: POST request to /api/disponibilidad.
     * Then: 400 Bad Request, message array contains "El día no puede estar vacío."
     */
    it('ESC-6: Debería retornar 400 Bad Request si day es nulo o vacío', async () => {
      const createAvailabilityDto = {
        tutorId: TEST_USER_ID,
        blocks: [{ day: null, hour: '09:00' }],
      };

      const response = await request(app.getHttpServer())
        .post('/api/disponibilidad')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(createAvailabilityDto);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(Array.isArray(response.body.message)).toBe(true);
      // Buscar el mensaje en cualquier error del array (puede tener prefijo como 'blocks.0.')
      const hasExpectedMessage = response.body.message.some(
        (msg: string) =>
          msg.includes('El día no puede estar vacío.') ||
          msg === 'El día no puede estar vacío.',
      );
      expect(hasExpectedMessage).toBe(true);
      expect(response.body.error).toBe('Bad Request');
      expect(createAvailabilityUseCase.execute).not.toHaveBeenCalled();
    });

    /**
     * ESC-7: DTO con hour faltante/inválido en un bloque
     * Given: Valid JWT and CreateAvailabilityDto with blocks[0].hour = "".
     * When: POST request to /api/disponibilidad.
     * Then: 400 Bad Request, message array contains "La hora no puede estar vacía."
     */
    it('ESC-7: Debería retornar 400 Bad Request si hour es vacío', async () => {
      const createAvailabilityDto: CreateAvailabilityDto = {
        tutorId: TEST_USER_ID,
        blocks: [{ day: 'Lun', hour: '' }],
      };

      const response = await request(app.getHttpServer())
        .post('/api/disponibilidad')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(createAvailabilityDto);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(Array.isArray(response.body.message)).toBe(true);
      // Buscar el mensaje en cualquier error del array (puede tener prefijo como 'blocks.0.')
      const hasExpectedMessage = response.body.message.some(
        (msg: string) =>
          msg.includes('La hora no puede estar vacía.') ||
          msg === 'La hora no puede estar vacía.',
      );
      expect(hasExpectedMessage).toBe(true);
      expect(response.body.error).toBe('Bad Request');
      expect(createAvailabilityUseCase.execute).not.toHaveBeenCalled();
    });

    /**
     * ESC-8: Fallo interno en la persistencia de datos
     * Given: Valid CreateAvailabilityDto and valid JWT.
     * When: POST request and DisponibilidadService.save throws InternalServerErrorException.
     * Then: 500 Internal Server Error, response matches contract.
     */
    it('ESC-8: Debería retornar 500 Internal Server Error si el servicio falla', async () => {
      const createAvailabilityDto: CreateAvailabilityDto = {
        tutorId: TEST_USER_ID,
        blocks: [{ day: 'Lun', hour: '09:00' }],
      };

      createAvailabilityUseCase.execute.mockRejectedValue(
        new Error('Error interno al guardar la disponibilidad.'),
      );

      const response = await request(app.getHttpServer())
        .post('/api/disponibilidad')
        .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
        .send(createAvailabilityDto);

      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(response.body.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(
        'Error interno al guardar la disponibilidad.',
      );
      expect(response.body.error).toBe('Internal Server Error');
    });
  });
});
