import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tutor } from './entities/tutor.entity';
import { RegistrarDatosBasicosDto } from './dto/registrar-datos-basicos.dto';
import { TypeOrmTutorRepositoryAdapter } from './infrastructure/typeorm-tutor.repository';
import { RegistrarActualizarDatosBasicosTutorUseCase } from './application/use-cases/registrar-actualizar-datos-basicos.use-case';

/**
 * Facade que preserva la API pública de TutorService para compatibilidad
 * con los tests existentes, mientras delega la lógica al UseCase interno.
 *
 * Permite introducir la arquitectura de puertos/adaptadores sin romper
 * ningún test ni contrato externo.
 */
@Injectable()
export class TutorService {
  private readonly useCase: RegistrarActualizarDatosBasicosTutorUseCase;

  constructor(
    @InjectRepository(Tutor)
    private readonly tutorRepository: Repository<Tutor>,
  ) {
    const adapter = new TypeOrmTutorRepositoryAdapter(tutorRepository);
    this.useCase = new RegistrarActualizarDatosBasicosTutorUseCase(adapter);
  }

  async registrarDatosBasicos(
    userId: string,
    dto: RegistrarDatosBasicosDto,
  ): Promise<Tutor> {
    return this.useCase.execute(userId, dto);
  }
}
