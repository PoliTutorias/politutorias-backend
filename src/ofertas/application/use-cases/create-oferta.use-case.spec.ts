/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { CreateOfertaUseCase } from './create-oferta.use-case';
import { IOfertaRepository } from '../ports/oferta.repository.interface';
import { Oferta } from '../../domain/entities/oferta.entity';
import { CreateOfertaDto } from '../../dto/create-oferta.dto';
import { OfertaAlreadyExistsException } from '../exceptions/oferta-already-exists.exception';
import { HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

// Mock del repositorio
const mockOfertaRepository = {
  save: jest.fn(),
};

describe('CreateOfertaUseCase', () => {
  let useCase: CreateOfertaUseCase;
  let ofertaRepository: IOfertaRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOfertaUseCase,
        {
          provide: IOfertaRepository,
          useValue: mockOfertaRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateOfertaUseCase>(CreateOfertaUseCase);
    ofertaRepository = module.get<IOfertaRepository>(IOfertaRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Escenario 1: Publicación de oferta exitosa
  it('should create a new offer successfully', async () => {
    const createOfertaDto: CreateOfertaDto = {
      title: 'Cálculo Avanzado',
      price: 50,
      modality: 'Virtual',
      categories: ['Matemáticas'],
      description: 'Clases personalizadas de cálculo avanzado.',
    };
    const tutorId = uuid();
    const expectedOferta: Oferta = {
      id: uuid(),
      ...createOfertaDto,
      tutorId: tutorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockOfertaRepository.save.mockResolvedValue(expectedOferta);

    const result = await useCase.execute(createOfertaDto, tutorId);

    expect(result).toEqual(expectedOferta);
    expect(ofertaRepository.save).toHaveBeenCalledTimes(1);
    const savedOfertaArg = mockOfertaRepository.save.mock.calls[0][0];
    expect(savedOfertaArg.title).toBe(createOfertaDto.title);
    expect(savedOfertaArg.tutorId).toBe(tutorId);
    expect(savedOfertaArg).toBeInstanceOf(Oferta);
  });

  // Escenario 2: Intento de publicación con título duplicado para el mismo tutor
  it('should throw HttpException 409 Conflict if offer title already exists for the tutor', async () => {
    const createOfertaDto: CreateOfertaDto = {
      title: 'Programación en Python',
      price: 40,
      modality: 'Presencial',
      categories: ['Programación'],
      description: 'Aprende Python desde cero hasta avanzado.',
    };
    const tutorId = uuid();

    // El repositorio mock debe lanzar la excepción de dominio
    mockOfertaRepository.save.mockRejectedValue(
      new OfertaAlreadyExistsException(
        'Ya existe una oferta con este título para este tutor.',
      ),
    );

    try {
      await useCase.execute(createOfertaDto, tutorId);
      fail('Expected HttpException to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
      const response = error.getResponse();
      expect(response.statusCode).toBe(HttpStatus.CONFLICT);
      expect(response.message).toBe(
        'Ya existe una oferta con este título para este tutor.',
      );
      expect(response.error).toBe('Conflict');
    }

    expect(ofertaRepository.save).toHaveBeenCalledTimes(1);
    const savedOfertaArg = mockOfertaRepository.save.mock.calls[0][0];
    expect(savedOfertaArg.title).toBe(createOfertaDto.title);
    expect(savedOfertaArg.tutorId).toBe(tutorId);
  });

  // Escenario 3: Error inesperado del repositorio
  it('should throw HttpException 500 Internal Server Error for unexpected repository errors', async () => {
    const createOfertaDto: CreateOfertaDto = {
      title: 'Historia Universal',
      price: 25,
      modality: 'Virtual',
      categories: ['Historia'],
      description: 'Recorrido por los eventos más importantes de la historia.',
    };
    const tutorId = uuid();

    // El repositorio mock debe lanzar un error genérico
    mockOfertaRepository.save.mockRejectedValue(
      new Error('Network error during save operation'),
    );

    try {
      await useCase.execute(createOfertaDto, tutorId);
      fail('Expected HttpException to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      const response = error.getResponse();
      expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(response.message).toBe(
        'Error interno del servidor al crear la oferta',
      );
      expect(response.error).toBe('Internal Server Error');
    }

    expect(ofertaRepository.save).toHaveBeenCalledTimes(1);
    const savedOfertaArg = mockOfertaRepository.save.mock.calls[0][0];
    expect(savedOfertaArg.title).toBe(createOfertaDto.title);
    expect(savedOfertaArg.tutorId).toBe(tutorId);
  });
});
