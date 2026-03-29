// test/e2e/experiencias.e2e-spec.ts
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  CanActivate,
  HttpStatus,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { DEV_JWT_TOKEN, TEST_USER_ID } from '../../src/auth/jwt.constants';
import { ExperienciaEntity } from '../../src/experiencias/entities/experiencia.entity';
import { Tutor } from '../../src/tutors/entities/tutor.entity';
import { JwtAuthGuard } from './../../src/auth/guards/jwt-auth.guard';
import { ExperienciasController } from './../../src/experiencias/experiencias.controller';
import { ExperienciasService } from './../../src/experiencias/experiencias.service';

const createMockTutorRepository = () => ({
  findOne: jest.fn(),
});

describe('ExperienciasController (e2e)', () => {
  let app: INestApplication;
  // Mock del servicio
  const mockExperienciasService = {
    add: jest.fn(),
  };
  let mockTutorRepository: ReturnType<typeof createMockTutorRepository>;

  // Mock del guard para simular autenticación
  const mockJwtAuthGuard: CanActivate = {
    canActivate: jest.fn((context) => {
      const req = context.switchToHttp().getRequest<{ user: { id: string } }>();
      req.user = { id: TEST_USER_ID }; // Simular usuario autenticado
      return true;
    }),
  };

  beforeAll(async () => {
    mockTutorRepository = createMockTutorRepository();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ExperienciasController],
      providers: [
        { provide: ExperienciasService, useValue: mockExperienciasService },
        { provide: getRepositoryToken(Tutor), useValue: mockTutorRepository },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
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

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Resetear mocks antes de cada test para asegurar aislamiento
    mockExperienciasService.add.mockReset();
    mockTutorRepository.findOne.mockReset();
    jest
      .spyOn(mockJwtAuthGuard, 'canActivate')
      .mockImplementation((context) => {
        const req = context
          .switchToHttp()
          .getRequest<{ user: { id: string } }>();
        req.user = { id: TEST_USER_ID };
        return true;
      });
  });

  // Escenario 1: Registro Exitoso
  it('should create an experience and return 201 CREATED', async () => {
    const tutorId = TEST_USER_ID;
    const experienciaDto = {
      puesto: 'Profesor de Cálculo I',
      institucion: 'Universidad Nacional',
      fechaInicio: '08/2020',
      fechaFin: 'Presente',
    };
    const mockCreatedExperience: ExperienciaEntity = {
      id: 'mock-exp-uuid',
      tutorId: tutorId,
      ...experienciaDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Para que este test falle inicialmente, el mock service no devuelve la entidad completa
    mockExperienciasService.add.mockResolvedValue(mockCreatedExperience); // Inicialmente, esto puede ser {} o throw new Error()

    await request(app.getHttpServer())
      .post('/api/experiencias')
      .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`) // Token ficticio, el guard lo permite
      .send(experienciaDto)
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Experiencia registrada con éxito');
        expect(res.body.data).toBeDefined();
        expect(res.body.data.id).toBe('mock-exp-uuid'); // Esto debe fallar si mock no devuelve 'id'
        expect(res.body.data.tutorId).toBe(tutorId);
        expect(res.body.data.puesto).toBe(experienciaDto.puesto);
        expect(res.body.data.institucion).toBe(experienciaDto.institucion);
        expect(res.body.data.fechaInicio).toBe(experienciaDto.fechaInicio);
        expect(res.body.data.fechaFin).toBe(experienciaDto.fechaFin);
        expect(mockExperienciasService.add).toHaveBeenCalledWith(
          tutorId,
          experienciaDto,
        );
      });
  });

  // Escenario 2: Validación de Campo Requerido (puesto)
  it('should return 400 BAD REQUEST if puesto is missing', async () => {
    const invalidExperienciaDto = {
      // puesto: 'missing',
      institucion: 'Universidad Nacional',
      fechaInicio: '08/2020',
      fechaFin: 'Presente',
    };

    await request(app.getHttpServer())
      .post('/api/experiencias')
      .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
      .send(invalidExperienciaDto)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        expect(res.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toEqual(
          expect.arrayContaining(['El puesto es requerido.']),
        );
        expect(mockExperienciasService.add).not.toHaveBeenCalled();
      });
  });

  // Escenario 3: Validación de Formato de fechaInicio
  it('should return 400 BAD REQUEST if fechaInicio format is invalid', async () => {
    const invalidExperienciaDto = {
      puesto: 'Profesor',
      institucion: 'Universidad',
      fechaInicio: '2024/03', // Formato incorrecto
      fechaFin: 'Presente',
    };

    await request(app.getHttpServer())
      .post('/api/experiencias')
      .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
      .send(invalidExperienciaDto)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        expect(res.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toEqual(
          expect.arrayContaining([
            'Formato de fecha MM/AAAA inválido para fecha de inicio.',
          ]),
        );
        expect(mockExperienciasService.add).not.toHaveBeenCalled();
      });
  });

  // Escenario 4: Validación de Longitud Máxima de fechaFin
  it('should return 400 BAD REQUEST if fechaFin exceeds max length', async () => {
    const invalidExperienciaDto = {
      puesto: 'Profesor',
      institucion: 'Universidad',
      fechaInicio: '08/2020',
      fechaFin: 'Presenteee', // Excede 9 caracteres
    };

    await request(app.getHttpServer())
      .post('/api/experiencias')
      .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
      .send(invalidExperienciaDto)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        expect(res.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toEqual(
          expect.arrayContaining([
            'Máximo 7 caracteres (MM/AAAA) o "Presente" (8 caracteres).',
          ]),
        );
        expect(mockExperienciasService.add).not.toHaveBeenCalled();
      });
  });

  // Escenario 5: No Autorizado (JWT Inválido)
  it('should return 401 UNAUTHORIZED if no JWT is provided', async () => {
    jest.spyOn(mockJwtAuthGuard, 'canActivate').mockImplementation(() => {
      throw new UnauthorizedException('Unauthorized');
    });

    const experienciaDto = {
      puesto: 'Profesor de Cálculo I',
      institucion: 'Universidad Nacional',
      fechaInicio: '08/2020',
    };

    await request(app.getHttpServer())
      .post('/api/experiencias')
      .send(experienciaDto)
      .expect(HttpStatus.UNAUTHORIZED)
      .expect((res) => {
        expect(res.body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
        expect(res.body.message).toBe('Unauthorized');
      });
  });

  // Escenario 6: Error Interno del Servidor
  it('should return 500 INTERNAL SERVER ERROR if an unexpected error occurs', async () => {
    const experienciaDto = {
      puesto: 'Profesor de Cálculo I',
      institucion: 'Universidad Nacional',
      fechaInicio: '08/2020',
      fechaFin: 'Presente',
    };

    // Hacer que el mock del servicio lance un error
    mockExperienciasService.add.mockRejectedValue(
      new Error('Database connection lost'),
    );

    await request(app.getHttpServer())
      .post('/api/experiencias')
      .set('Authorization', `Bearer ${DEV_JWT_TOKEN}`)
      .send(experienciaDto)
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
      .expect((res) => {
        expect(res.body.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(res.body.message).toBe(
          'Error interno al registrar la experiencia.',
        );
      });
  });
});
