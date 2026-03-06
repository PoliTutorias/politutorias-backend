/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateAvailabilityUseCase } from './application/use-cases/create-availability.use-case';
import {
  IAvailabilityRepository,
  AVAILABILITY_REPOSITORY_TOKEN,
} from './application/ports/availability.repository.interface';
import type { AvailabilityBlockDto } from './dto/availability-block.dto';

describe('CreateAvailabilityUseCase', () => {
  let useCase: CreateAvailabilityUseCase;
  let availabilityRepository: jest.Mocked<IAvailabilityRepository>;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    // Mock del repositorio
    const mockRepository: jest.Mocked<IAvailabilityRepository> = {
      deleteByTutorId: jest.fn(),
      create: jest.fn(),
      saveAll: jest.fn(),
    };

    // Mock de DataSource con transacción que ejecuta el callback
    const mockDataSource = {
      transaction: jest.fn((callback: any) => callback({
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        save: jest.fn().mockResolvedValue([]),
      })),
    } as unknown as jest.Mocked<DataSource>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAvailabilityUseCase,
        {
          provide: AVAILABILITY_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    useCase = module.get<CreateAvailabilityUseCase>(CreateAvailabilityUseCase);
    availabilityRepository = module.get<jest.Mocked<IAvailabilityRepository>>(
      AVAILABILITY_REPOSITORY_TOKEN,
    );
    dataSource = module.get<jest.Mocked<DataSource>>(DataSource);
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

      // Mock del DataSource para que ejecute la transacción correctamente
      const mockManager = {
        delete: jest
          .fn()
          .mockResolvedValue({ affected: 1 }),
        save: jest.fn().mockResolvedValue([mockEntity]),
      };

      (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
        callback(mockManager),
      );

      // Mock del repositorio
      availabilityRepository.create.mockReturnValue(mockEntity);

      const result = await useCase.execute(tutorId, availabilityBlocks);

      // Verificaciones de transacción
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockManager.delete).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalled();

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

      // Mock del DataSource
      const mockManager = {
        delete: jest
          .fn()
          .mockResolvedValue({ affected: 2 }),
        save: jest.fn().mockResolvedValue(mockCreatedEntities),
      };

      (dataSource.transaction as jest.Mock).mockImplementation((callback) =>
        callback(mockManager),
      );

      // Mock del repositorio para crear entidades
      availabilityRepository.create.mockImplementation((dto) => ({
        id: mockCreatedEntities.find(
          (e) => e.day === dto.day && e.hour === dto.hour,
        )?.id,
        ...dto,
      }));

      const result = await useCase.execute(tutorId, availabilityBlocks);

      // Verificaciones
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockManager.delete).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalled();

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
     * When: useCase.execute() is called and delete within transaction throws.
     * Then: Expect InternalServerErrorException with message
     *       "Error interno al guardar la disponibilidad."
     */
    it('ESC-8: Debería lanzar InternalServerErrorException si delete falla', async () => {
      const tutorId = 'uuid-tutor-D';
      const availabilityBlocks: AvailabilityBlockDto[] = [
        { day: 'Lun', hour: '09:00' },
      ];

      // Mock del DataSource para que la transacción lance error DENTRO del callback
      (dataSource.transaction as jest.Mock).mockImplementation((callback) => {
        const mockManager = {
          delete: jest
            .fn()
            .mockRejectedValue(new Error('Database connection failed')),
          save: jest.fn(),
        };
        return callback(mockManager);
      });

      await expect(
        useCase.execute(tutorId, availabilityBlocks),
      ).rejects.toThrow(InternalServerErrorException);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    });

    /**
     * ESC-8: Error al guardar nuevos bloques (save falla dentro transacción)
     * Given: tutorId and valid AvailabilityBlockDto array.
     * When: useCase.execute() is called and save within transaction throws.
     * Then: Expect InternalServerErrorException with message
     *       "Error interno al guardar la disponibilidad."
     */
    it('ESC-8: Debería lanzar InternalServerErrorException si saveAll falla', async () => {
      const tutorId = 'uuid-tutor-E';
      const availabilityBlocks: AvailabilityBlockDto[] = [
        { day: 'Lun', hour: '09:00' },
      ];

      // Mock del DataSource donde save falla
      (dataSource.transaction as jest.Mock).mockImplementation((callback) => {
        const mockManager = {
          delete: jest
            .fn()
            .mockResolvedValue({ affected: 1 }),
          save: jest
            .fn()
            .mockRejectedValue(new Error('Database constraint violation')),
        };
        return callback(mockManager);
      });

      await expect(
        useCase.execute(tutorId, availabilityBlocks),
      ).rejects.toThrow(InternalServerErrorException);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    });
  });
});

