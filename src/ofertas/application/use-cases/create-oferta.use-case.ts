import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { IOfertaRepository } from '../ports/oferta.repository.interface';
import { Oferta } from '../../domain/entities/oferta.entity';
import { CreateOfertaDto } from '../../dto/create-oferta.dto';
import { OfertaAlreadyExistsException } from '../exceptions/oferta-already-exists.exception';

const INTERNAL_SERVER_ERROR_MESSAGE = 'Error interno del servidor al crear la oferta';

@Injectable()
export class CreateOfertaUseCase {
  constructor(
    @Inject(IOfertaRepository)
    private readonly ofertaRepository: IOfertaRepository,
  ) {}

  async execute(createOfertaDto: CreateOfertaDto, tutorId: string): Promise<Oferta> {
    try {
      const oferta = Oferta.createFromDto(createOfertaDto, tutorId);
      return await this.ofertaRepository.save(oferta);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handles errors during offer creation, translating domain exceptions
   * to appropriate HTTP exceptions.
   */
  private handleError(error: any): never {
    if (error instanceof OfertaAlreadyExistsException) {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          message: error.message,
          error: 'Conflict',
        },
        HttpStatus.CONFLICT,
      );
    }
    throw new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: INTERNAL_SERVER_ERROR_MESSAGE,
        error: 'Internal Server Error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
