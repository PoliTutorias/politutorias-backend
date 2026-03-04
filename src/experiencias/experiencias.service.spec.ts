// src/experiencias/experiencias.service.spec.ts
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ExperienciasService } from './experiencias.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExperienciaEntity } from './entities/experiencia.entity';
import { ExperienciaDto } from '../common/dtos/experiencia.dto';
import { InternalServerErrorException } from '@nestjs/common';

const mockExperienciaRepository = {
  create: jest.fn(),
  save: jest.fn(),
};

describe('ExperienciasService', () => {
  let service: ExperienciasService;
  let repository: Repository<ExperienciaEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperienciasService,
        {
          provide: getRepositoryToken(ExperienciaEntity),
          useValue: mockExperienciaRepository,
        },
      ],
    }).compile();

    service = module.get<ExperienciasService>(ExperienciasService);
    repository = module.get<Repository<ExperienciaEntity>>(
      getRepositoryToken(ExperienciaEntity),
    );

    // Resetear mocks antes de cada test
    mockExperienciaRepository.create.mockReset();
    mockExperienciaRepository.save.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Escenario 1: Registro Exitoso
  it('should successfully add a new experience', async () => {
    const userId = 'tutor-uuid-123';
    const experienciaDto: ExperienciaDto = {
      puesto: 'Desarrollador Backend',
      institucion: 'Tech Solutions',
      fechaInicio: '01/2022',
      fechaFin: 'Presente',
    };
    const newExperienciaEntity: ExperienciaEntity = {
      id: 'exp-uuid-456',
      tutorId: userId,
      ...experienciaDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockExperienciaRepository.create.mockReturnValue(newExperienciaEntity);
    mockExperienciaRepository.save.mockResolvedValue(newExperienciaEntity); // Esto debe estar ausente o ser un mock vacío para la fase roja

    const result = await service.add(userId, experienciaDto);

    expect(repository.create).toHaveBeenCalledWith({
      tutorId: userId,
      ...experienciaDto,
    });
    expect(repository.save).toHaveBeenCalledWith(newExperienciaEntity);
    expect(result).toEqual(newExperienciaEntity); // Esto debe fallar si save no retorna la entidad
  });

  // Escenario 6: Error Interno del Servidor
  it('should throw an InternalServerErrorException if repository fails to save', async () => {
    const userId = 'tutor-uuid-123';
    const experienciaDto: ExperienciaDto = {
      puesto: 'Desarrollador Backend',
      institucion: 'Tech Solutions',
      fechaInicio: '01/2022',
    };

    mockExperienciaRepository.create.mockReturnValue({
      tutorId: userId,
      ...experienciaDto,
    });
    mockExperienciaRepository.save.mockRejectedValue(new Error('DB error')); // Esto debe estar ausente para la fase roja

    await expect(service.add(userId, experienciaDto)).rejects.toThrow(
      InternalServerErrorException,
    );
    await expect(service.add(userId, experienciaDto)).rejects.toThrow(
      'Error interno al registrar la experiencia.',
    );
    expect(repository.create).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalled();
  });
});
