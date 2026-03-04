import { ExperienciaEntity } from '../../entities/experiencia.entity';

/**
 * Port (abstracción) del repositorio de ExperienciaEntity.
 *
 * Las capas de Application (Use Cases) dependen de esta interfaz,
 * nunca de TypeORM directamente. — DIP (SOLID)
 */
export interface IExperienciaRepository {
  /**
   * Crea una instancia en memoria de ExperienciaEntity (sin persistir).
   */
  create(data: Partial<ExperienciaEntity>): ExperienciaEntity;

  /**
   * Persiste una ExperienciaEntity (insert o update).
   */
  save(entity: ExperienciaEntity): Promise<ExperienciaEntity>;
}

/** Token de inyección de dependencias para el módulo NestJS. */
export const EXPERIENCIA_REPOSITORY_TOKEN = 'IExperienciaRepository';
