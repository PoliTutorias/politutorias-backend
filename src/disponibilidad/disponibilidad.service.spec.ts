/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { CreateAvailabilityUseCase } from './application/use-cases/create-availability.use-case';
import {
  IAvailabilityRepository,
  AVAILABILITY_REPOSITORY_TOKEN,
} from './application/ports/availability.repository.interface';
import type { AvailabilityBlockDto } from './dto/availability-block.dto';

describe('CreateAvailabilityUseCase', () => {
  let useCase: CreateAvailabilityUseCase;
  let availabilityRepository: jest.Mocked<IAvailabilityRepository>;

  beforeEach(async () => {
    // Mock del repositorio
    const mockRepository: jest.Mocked<IAvailabilityRepository> = {
      deleteByTutorId: jest.fn(),
      create: jest.fn(),
      saveAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAvailabilityUseCase,
        {
          provide: AVAILABILITY_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateAvailabilityUseCase>(CreateAvailabilityUseCase);
    availabilityRepository = module.get<jest.Mocked<IAvailabilityRepository>>(
      AVAILABILITY_REPOSITORY_TOKEN,
    );
  });

  describe('execute method', () => {
    /**
     * ESC-1: Registro exitoso de nueva disponibilidad
     * Given: tutorId and blocks with valid data.
     * When: useCase.execute() is called.
     * Then: Expect deleteByTutorId called once, create called for each block, saveAll called once,
     *       returned object matches success structure.
     */
    it('ESC-1: Debería ejecutar exitosamente el caso de uso de disponibilidad', async () => {
      const tutorId = 'uuid-tutor-A';
      const availabilityBlocks: AvailabilityBlockDto[] = [
        { day: 'Lun', hour: '09:00' },
      ];

      const mockEntity = {
        id: 'uuid-block-1',
        tutorId,
        day: 'Lun',
        hour: '09:00',
      };

      // Mock del repositorio
      availabilityRepository.deleteByTutorId.mockResolvedValue(undefined);
      availabilityRepository.create.mockReturnValue(mockEntity);
      availabilityRepository.saveAll.mockResolvedValue([mockEntity]);

      const result = await useCase.execute(tutorId, availabilityBlocks);

      // Verificaciones
      expect(availabilityRepository.deleteByTutorId).toHaveBeenCalledTimes(1);
      expect(availabilityRepository.deleteByTutorId).toHaveBeenCalledWith(
        tutorId,
      );

      expect(availabilityRepository.create).toHaveBeenCalledTimes(1);
      expect(availabilityRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tutorId,
          day: 'Lun',
          hour: '09:00',
        }),
      );

      expect(availabilityRepository.saveAll).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        message: 'Disponibilidad registrada exitosamente para el tutor.',
        tutorId,
        blocks: expect.arrayContaining([
          expect.objectContaining({
            id: 'uuid-block-1',
            day: 'Lun',
            hour: '09:00',
          }),
        ]),
      });
    });

    /**
     * ESC-2: Reemplazo exitoso de disponibilidad existente
     * Given: tutorId with existing availability and blocks with new data.
     * When: useCase.execute() is called.
     * Then: Expect deleteByTutorId called once, create called for each new block, saveAll called once,
     *       returned object confirms replacement with new blocks.
     */
    it('ESC-2: Debería reemplazar exitosamente la disponibilidad existente', async () => {
      const tutorId = 'uuid-tutor-B';
      const availabilityBlocks: AvailabilityBlockDto[] = [
        { day: 'Mié', hour: '11:00' },
        { day: 'Jue', hour: '12:00' },
      ];

      const mockCreatedEntities = [
        {
          id: 'uuid-block-2',
          tutorId,
          day: 'Mié',
          hour: '11:00',
        },
        {
          id: 'uuid-block-3',
          tutorId,
          day: 'Jue',
          hour: '12:00',
        },
      ];

      // Mock del repositorio
      availabilityRepository.deleteByTutorId.mockResolvedValue(undefined);
      availabilityRepository.create.mockImplementation((dto) => ({
        id: mockCreatedEntities.find(
          (e) => e.day === dto.day && e.hour === dto.hour,
        )?.id,
        ...dto,
      }));
      availabilityRepository.saveAll.mockResolvedValue(mockCreatedEntities);

      const result = await useCase.execute(tutorId, availabilityBlocks);

      // Verificaciones
      expect(availabilityRepository.deleteByTutorId).toHaveBeenCalledTimes(1);
      expect(availabilityRepository.deleteByTutorId).toHaveBeenCalledWith(
        tutorId,
      );

      expect(availabilityRepository.create).toHaveBeenCalledTimes(2);

      expect(availabilityRepository.saveAll).toHaveBeenCalledTimes(1);

      expect(result.blocks.length).toBe(2);
      expect(result.blocks).toContainEqual(
        expect.objectContaining({
          day: 'Mié',
          hour: '11:00',
        }),
      );
      expect(result.blocks).toContainEqual(
        expect.objectContaining({
          day: 'Jue',
          hour: '12:00',
        }),
      );
    });

    /**
     * ESC-8: Error al eliminar disponibilidad anterior (delete falla)
     * Given: tutorId and valid AvailabilityBlockDto array.
     * When: useCase.execute() is called and availabilityRepository.deleteByTutorId throws.
     * Then: Expect InternalServerErrorException with message
     *       "Error interno al guardar la disponibilidad."
     *       create and saveAll should not be called.
     */
    it('ESC-8: Debería lanzar InternalServerErrorException si delete falla', async () => {
      const tutorId = 'uuid-tutor-D';
      const availabilityBlocks: AvailabilityBlockDto[] = [
        { day: 'Lun', hour: '09:00' },
      ];

      // Mock del repositorio para fallar en deleteByTutorId
      availabilityRepository.deleteByTutorId.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        useCase.execute(tutorId, availabilityBlocks),
      ).rejects.toThrow(InternalServerErrorException);

      expect(availabilityRepository.deleteByTutorId).toHaveBeenCalledTimes(1);
      expect(availabilityRepository.create).not.toHaveBeenCalled();
      expect(availabilityRepository.saveAll).not.toHaveBeenCalled();
    });

    /**
     * ESC-8: Error al guardar nuevos bloques (saveAll falla)
     * Given: tutorId and valid AvailabilityBlockDto array.
     * When: useCase.execute() is called and availabilityRepository.saveAll throws.
     * Then: Expect InternalServerErrorException with message
     *       "Error interno al guardar la disponibilidad."
     *       deleteByTutorId and create should have been called, but saveAll fails.
     */
    it('ESC-8: Debería lanzar InternalServerErrorException si saveAll falla', async () => {
      const tutorId = 'uuid-tutor-E';
      const availabilityBlocks: AvailabilityBlockDto[] = [
        { day: 'Lun', hour: '09:00' },
      ];

      const mockCreatedEntity = {
        id: 'uuid-block-1',
        tutorId,
        day: 'Lun',
        hour: '09:00',
      };

      // Mock del repositorio para fallar en saveAll
      availabilityRepository.deleteByTutorId.mockResolvedValue(undefined);
      availabilityRepository.create.mockReturnValue(mockCreatedEntity);
      availabilityRepository.saveAll.mockRejectedValue(
        new Error('Database constraint violation'),
      );

      await expect(
        useCase.execute(tutorId, availabilityBlocks),
      ).rejects.toThrow(InternalServerErrorException);

      expect(availabilityRepository.deleteByTutorId).toHaveBeenCalledTimes(1);
      expect(availabilityRepository.create).toHaveBeenCalled();
      expect(availabilityRepository.saveAll).toHaveBeenCalledTimes(1);
    });
  });
});
