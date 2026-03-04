// test/e2e/perfil.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, CanActivate, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { PerfilController } from './../../src/perfil/perfil.controller';
import { PerfilService } from './../../src/perfil/perfil.service';
import { JwtAuthGuard } from './../../src/auth/guards/jwt-auth.guard';
import { PerfilProfesionalEntity } from '../../src/perfil/entities/perfil-profesional.entity';

describe('PerfilController (e2e)', () => {
  let app: INestApplication;
  const mockPerfilService = {
    finalizar: jest.fn(),
  };

  const mockJwtAuthGuard: CanActivate = {
    canActivate: jest.fn((context) => {
      const request = context.switchToHttp().getRequest();
      request.user = { id: 'a-valid-uuid-tutor-id' };
      return true;
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PerfilController],
      providers: [
        { provide: PerfilService, useValue: mockPerfilService },
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
    mockPerfilService.finalizar.mockReset();
    jest.spyOn(mockJwtAuthGuard, 'canActivate').mockImplementation((context) => {
      const request = context.switchToHttp().getRequest();
      request.user = { id: 'a-valid-uuid-tutor-id' };
      return true;
    });
  });

  // Escenario 1: Finalización Exitosa del Perfil (Creación/Actualización)
  it('should finalize the professional profile and return 200 OK', async () => {
    const tutorId = 'a-valid-uuid-tutor-id';
    const perfilProfesionalDto = {
      materias: ['Cálculo', 'Física'],
    };
    const mockFinalPerfil: PerfilProfesionalEntity = {
      id: 'mock-perfil-uuid',
      tutorId: tutorId,
      materias: perfilProfesionalDto.materias,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPerfilService.finalizar.mockResolvedValue(mockFinalPerfil); // Esto debe fallar si mock no devuelve 'id' o materias

    await request(app.getHttpServer())
      .post('/api/perfil/finalizar')
      .set('Authorization', `Bearer some-jwt-token`)
      .send(perfilProfesionalDto)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Perfil profesional finalizado con éxito');
        expect(res.body.data).toBeDefined();
        expect(res.body.data.id).toBe('mock-perfil-uuid');
        expect(res.body.data.tutorId).toBe(tutorId);
        expect(res.body.data.materias).toEqual(perfilProfesionalDto.materias);
        expect(mockPerfilService.finalizar).toHaveBeenCalledWith(tutorId, perfilProfesionalDto);
      });
  });

  // Escenario 2: Actualización de Materias a Vacío
  it('should update materias to an empty array and return 200 OK', async () => {
    const tutorId = 'a-valid-uuid-tutor-id';
    const perfilProfesionalDto = {
      materias: [],
    };
    const mockFinalPerfil: PerfilProfesionalEntity = {
      id: 'mock-perfil-uuid',
      tutorId: tutorId,
      materias: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPerfilService.finalizar.mockResolvedValue(mockFinalPerfil);

    await request(app.getHttpServer())
      .post('/api/perfil/finalizar')
      .set('Authorization', `Bearer some-jwt-token`)
      .send(perfilProfesionalDto)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Perfil profesional finalizado con éxito');
        expect(res.body.data.materias).toEqual([]);
        expect(mockPerfilService.finalizar).toHaveBeenCalledWith(tutorId, perfilProfesionalDto);
      });
  });

  // Escenario 3: Validación de Materias (No array de strings)
  it('should return 400 BAD REQUEST if materias is not an array of strings', async () => {
    const invalidPerfilProfesionalDto = {
      materias: ['Cálculo', 123], // Materia inválida
    };

    await request(app.getHttpServer())
      .post('/api/perfil/finalizar')
      .set('Authorization', `Bearer some-jwt-token`)
      .send(invalidPerfilProfesionalDto)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        expect(res.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toEqual(expect.arrayContaining(['Cada materia debe ser una cadena de texto.']));
        expect(mockPerfilService.finalizar).not.toHaveBeenCalled();
      });
  });

  // Escenario 4: Validación de Experiencias Anidadas Invalidas
  it('should return 400 BAD REQUEST if nested experiences are invalid', async () => {
    const invalidPerfilProfesionalDto = {
      experiencias: [
        {
          puesto: 'Profesor',
          institucion: 'Universidad',
          fechaInicio: '01/2020',
        },
        {
          // puesto: 'missing', // Puesto vacío para la segunda experiencia
          institucion: 'Instituto',
          fechaInicio: '03/2018',
        },
      ],
    };

    await request(app.getHttpServer())
      .post('/api/perfil/finalizar')
      .set('Authorization', `Bearer some-jwt-token`)
      .send(invalidPerfilProfesionalDto)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        expect(res.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
        // El mensaje de error anidado es complejo, solo verificar que un error existe.
        // NestJS ValidationPipe genera mensajes con el formato "experiencias.N.mensaje"
        expect(res.body.message).toEqual(expect.arrayContaining(['experiencias.1.El puesto es requerido.']));
        expect(mockPerfilService.finalizar).not.toHaveBeenCalled();
      });
  });

  // Escenario 5: No Autorizado (JWT Inválido)
  it('should return 401 UNAUTHORIZED if no JWT is provided', async () => {
    jest.spyOn(mockJwtAuthGuard, 'canActivate').mockImplementation(() => {
      throw new UnauthorizedException('Unauthorized');
    });

    await request(app.getHttpServer())
      .post('/api/perfil/finalizar')
      .send({ materias: ['Matemáticas'] })
      .expect(HttpStatus.UNAUTHORIZED)
      .expect((res) => {
        expect(res.body.statusCode).toBe(HttpStatus.UNAUTHORIZED);
        expect(res.body.message).toBe('Unauthorized');
      });
  });

  // Escenario 6: Error Interno del Servidor
  it('should return 500 INTERNAL SERVER ERROR if an unexpected error occurs', async () => {
    const tutorId = 'a-valid-uuid-tutor-id';
    const perfilProfesionalDto = {
      materias: ['Cálculo'],
    };

    mockPerfilService.finalizar.mockRejectedValue(new Error('DB error'));

    await request(app.getHttpServer())
      .post('/api/perfil/finalizar')
      .set('Authorization', `Bearer some-jwt-token`)
      .send(perfilProfesionalDto)
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
      .expect((res) => {
        expect(res.body.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(res.body.message).toBe('Error interno al finalizar el perfil profesional.');
      });
  });
});
