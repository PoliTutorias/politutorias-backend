import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { RegistrarActualizarDatosBasicosTutorUseCase } from './application/use-cases/registrar-actualizar-datos-basicos.use-case';
import { TUTOR_REPOSITORY_TOKEN } from './domain/ports/tutor.repository.port';
import { Tutor } from './entities/tutor.entity';
import { TypeOrmTutorRepositoryAdapter } from './infrastructure/typeorm-tutor.repository';
import { TutorController } from './tutor.controller';
import { TutorService } from './tutor.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tutor]), StorageModule],
  controllers: [TutorController],
  providers: [
    // Adapter concreto para el port ITutorRepository
    TypeOrmTutorRepositoryAdapter,
    {
      provide: TUTOR_REPOSITORY_TOKEN,
      useClass: TypeOrmTutorRepositoryAdapter,
    },
    // UseCase: depende de TUTOR_REPOSITORY_TOKEN (DIP)
    RegistrarActualizarDatosBasicosTutorUseCase,
    // Facade público para compatibilidad con tests existentes
    TutorService,
  ],
  exports: [TutorService],
})
export class TutorsModule {}
