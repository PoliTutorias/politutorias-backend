// src/perfil/perfil.service.spec.ts
/* eslint-disable @typescript-eslint/unbound-method */
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilProfesionalDto } from '../common/dtos/perfil-profesional.dto';
import { ExperienciaEntity } from '../experiencias/entities/experiencia.entity';
import { MateriaEntity } from '../materias/entities/materia.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { PerfilProfesionalEntity } from './entities/perfil-profesional.entity';
import { PerfilService } from './perfil.service';

// Mocks para los repositorios
const mockTutorRepository = {
  findOne: jest.fn(),
};

const mockPerfilProfesionalRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockExperienciaRepository = {
  // Solo se necesita si PerfilService interactúa directamente con Experiencias (que no es el caso actual para persistencia, solo quizás para consulta/retorno)
  find: jest.fn(),
};

const mockMateriaRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

describe('PerfilService', () => {
  let service: PerfilService;
  let perfilProfesionalRepository: Repository<PerfilProfesionalEntity>;
  // let experienciaRepository: Repository<ExperienciaEntity>; // Descomentar si el servicio interactúa con ellas

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerfilService,
        {
          provide: getRepositoryToken(PerfilProfesionalEntity),
          useValue: mockPerfilProfesionalRepository,
        },
        {
          provide: getRepositoryToken(ExperienciaEntity),
          useValue: mockExperienciaRepository, // Proveer aunque no se use activamente para evitar errores de inyección
        },
        {
          provide: getRepositoryToken(MateriaEntity),
          useValue: mockMateriaRepository, // Proveer aunque no se use activamente
        },
        {
          provide: getRepositoryToken(Tutor),
          useValue: mockTutorRepository,
        },
      ],
    }).compile();

    service = module.get<PerfilService>(PerfilService);
    perfilProfesionalRepository = module.get<
      Repository<PerfilProfesionalEntity>
    >(getRepositoryToken(PerfilProfesionalEntity));
    // experienciaRepository = module.get<Repository<ExperienciaEntity>>(getRepositoryToken(ExperienciaEntity)); // Descomentar si se usa

    // Resetear mocks antes de cada test
    mockPerfilProfesionalRepository.findOne.mockReset();
    mockPerfilProfesionalRepository.create.mockReset();
    mockPerfilProfesionalRepository.save.mockReset();
    mockMateriaRepository.findOne.mockReset();
    mockMateriaRepository.create.mockReset();
    mockMateriaRepository.save.mockReset();
    mockTutorRepository.findOne.mockReset();
    // mockExperienciaRepository.find.mockReset(); // Descomentar si se usa
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Escenario 1: Finalización Exitosa del Perfil (Creación)
  it('should create a new professional profile if one does not exist', async () => {
    const userId = 'tutor-uuid-456';
    const perfilProfesionalDto: PerfilProfesionalDto = {
      materias: ['Álgebra'],
    };
    const newPerfilEntity: PerfilProfesionalEntity = {
      id: 'perfil-uuid-789',
      tutorId: userId,
      materias: perfilProfesionalDto.materias,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPerfilProfesionalRepository.findOne.mockResolvedValue(undefined); // No existe perfil
    mockPerfilProfesionalRepository.create.mockReturnValue({
      tutorId: userId,
      materias: perfilProfesionalDto.materias,
    });
    mockPerfilProfesionalRepository.save.mockResolvedValue(newPerfilEntity); // Esto debe estar ausente o ser un mock vacío para la fase roja

    const result = await service.finalizar(userId, perfilProfesionalDto);

    expect(perfilProfesionalRepository.findOne).toHaveBeenCalledWith({
      where: { tutorId: userId },
    });
    expect(perfilProfesionalRepository.create).toHaveBeenCalledWith({
      tutorId: userId,
    });
    expect(perfilProfesionalRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tutorId: userId,
        materias: perfilProfesionalDto.materias,
      }),
    );
    expect(result).toEqual(newPerfilEntity); // Esto debe fallar
  });

  // Escenario 1: Finalización Exitosa del Perfil (Actualización)
  it('should update an existing professional profile', async () => {
    const userId = 'tutor-uuid-456';
    const existingPerfil: PerfilProfesionalEntity = {
      id: 'perfil-uuid-789',
      tutorId: userId,
      materias: ['Historia'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const perfilProfesionalDto: PerfilProfesionalDto = {
      materias: ['Geografía', 'Economía'],
    };
    const updatedPerfilEntity: PerfilProfesionalEntity = {
      ...existingPerfil,
      materias: perfilProfesionalDto.materias,
      updatedAt: new Date(),
    };

    mockPerfilProfesionalRepository.findOne.mockResolvedValue(existingPerfil); // Perfil existente
    mockPerfilProfesionalRepository.save.mockResolvedValue(updatedPerfilEntity); // Esto debe fallar

    const result = await service.finalizar(userId, perfilProfesionalDto);

    expect(perfilProfesionalRepository.findOne).toHaveBeenCalledWith({
      where: { tutorId: userId },
    });
    expect(perfilProfesionalRepository.create).not.toHaveBeenCalled(); // No se llama a create si existe
    expect(perfilProfesionalRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: existingPerfil.id,
        tutorId: userId,
        materias: perfilProfesionalDto.materias,
      }),
    );
    expect(result).toEqual(updatedPerfilEntity); // Esto debe fallar
  });

  // Escenario 2: Actualización de Materias a Vacío
  it('should set materias to an empty array if provided as empty', async () => {
    const userId = 'tutor-uuid-456';
    const existingPerfil: PerfilProfesionalEntity = {
      id: 'perfil-uuid-789',
      tutorId: userId,
      materias: ['Biología'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const perfilProfesionalDto: PerfilProfesionalDto = {
      materias: [],
    };
    const updatedPerfilEntity: PerfilProfesionalEntity = {
      ...existingPerfil,
      materias: [],
      updatedAt: new Date(),
    };

    mockPerfilProfesionalRepository.findOne.mockResolvedValue(existingPerfil);
    mockPerfilProfesionalRepository.save.mockResolvedValue(updatedPerfilEntity); // Esto debe fallar

    const result = await service.finalizar(userId, perfilProfesionalDto);

    expect(result.materias).toEqual([]); // Esto debe fallar
    expect(perfilProfesionalRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        materias: [],
      }),
    );
  });

  // Escenario 6: Error Interno del Servidor
  it('should throw an InternalServerErrorException if repository fails to save', async () => {
    const userId = 'tutor-uuid-456';
    const perfilProfesionalDto: PerfilProfesionalDto = {
      materias: ['Literatura'],
    };

    mockPerfilProfesionalRepository.findOne.mockResolvedValue(undefined);
    mockPerfilProfesionalRepository.create.mockReturnValue({ tutorId: userId });
    mockPerfilProfesionalRepository.save.mockRejectedValue(
      new Error('DB error'),
    ); // Esto debe estar ausente para la fase roja

    await expect(
      service.finalizar(userId, perfilProfesionalDto),
    ).rejects.toThrow(InternalServerErrorException);
    await expect(
      service.finalizar(userId, perfilProfesionalDto),
    ).rejects.toThrow('Error interno al finalizar el perfil profesional.');
    expect(perfilProfesionalRepository.save).toHaveBeenCalled();
  });
});
