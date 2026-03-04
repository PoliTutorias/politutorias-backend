import { PerfilProfesionalEntity } from '../../entities/perfil-profesional.entity';

/**
 * Port (abstracción) del repositorio de PerfilProfesionalEntity.
 *
 * Las capas de Application (Use Cases) dependen de esta interfaz,
 * nunca de TypeORM directamente. — DIP (SOLID)
 */
export interface IPerfilProfesionalRepository {
  /**
   * Busca un perfil profesional por tutorId.
   * Retorna null si no existe.
   */
  findByTutorId(tutorId: string): Promise<PerfilProfesionalEntity | null>;

  /**
   * Crea una instancia en memoria de PerfilProfesionalEntity (sin persistir).
   */
  create(data: Partial<PerfilProfesionalEntity>): PerfilProfesionalEntity;

  /**
   * Persiste un PerfilProfesionalEntity (insert o update).
   */
  save(entity: PerfilProfesionalEntity): Promise<PerfilProfesionalEntity>;
}

/** Token de inyección de dependencias para el módulo NestJS. */
export const PERFIL_PROFESIONAL_REPOSITORY_TOKEN =
  'IPerfilProfesionalRepository';
