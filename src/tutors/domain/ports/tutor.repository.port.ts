import { Tutor } from '../../entities/tutor.entity';

/**
 * Port (abstracción) del repositorio de Tutor.
 * Las capas de dominio/aplicación dependen de esta interfaz, no de TypeORM.
 * — Principio de Inversión de Dependencias (SOLID-D)
 */
export interface ITutorRepository {
  /**
   * Busca un perfil de tutor por su userId.
   * @returns El Tutor encontrado, o null si no existe.
   */
  findByUserId(userId: string): Promise<Tutor | null>;

  /**
   * Persiste (crea o actualiza) un perfil de tutor.
   * @returns El Tutor persistido con los datos actualizados.
   */
  save(tutor: Tutor): Promise<Tutor>;

  /**
   * Crea una nueva instancia de Tutor (sin persistirla).
   */
  create(data: Partial<Tutor>): Tutor;
}

export const TUTOR_REPOSITORY_TOKEN = 'ITutorRepository';
