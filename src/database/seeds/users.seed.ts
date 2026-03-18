import { DataSource } from 'typeorm';
import { hash } from 'bcryptjs';
import { UserEntity } from '../../users/entities/user.entity';

/**
 * IDs fijos para usuarios de prueba.
 * Mantener sincronizados con tutors.seed.ts → ZERO_TUTOR_USER_ID.
 */
export const SEED_USER_TUTOR_ID = '00000000-0000-4000-a000-000000000001';
export const SEED_USER_STUDENT_ID = '00000000-0000-4000-a000-000000000002';
export const SEED_USER_TUTOR2_ID = '00000000-0000-4000-a000-000000000003';

export async function seedUsers(dataSource: DataSource): Promise<void> {
  console.log('👤 Sembrando usuarios...');

  const userRepo = dataSource.getRepository(UserEntity);

  const passwordHash = await hash('123456', 10);

  const users = [
    {
      id: SEED_USER_TUTOR_ID,
      name: 'Daniel Valdiviezo',
      email: 'daniel.v@epn.edu.ec',
      passwordHash,
    },
    {
      id: SEED_USER_STUDENT_ID,
      name: 'Patricio Chancusig',
      email: 'patricio.c@epn.edu.ec',
      passwordHash,
    },
    {
      id: SEED_USER_TUTOR2_ID,
      name: 'María García',
      email: 'maria.g@epn.edu.ec',
      passwordHash,
    },
  ];

  for (const userData of users) {
    const user = userRepo.create(userData);
    await userRepo.save(user);
  }

  console.log(`✅ ${users.length} usuarios creados (contraseña: 123456)`);
}
