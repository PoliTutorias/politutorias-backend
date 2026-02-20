import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { seedTutors } from './seeds/tutors.seed';
import { seedOfertas } from './seeds/ofertas.seed';

// Cargar variables de entorno
config();

const dbHost = process.env.DB_HOST || 'localhost';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: dbHost,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'mysecretpassword',
  database: process.env.DB_NAME || 'PoliTutoriasDB',
  entities: [Tutor, Oferta],
  synchronize: true,
  logging: false,
  ssl: dbHost.includes('rds.amazonaws.com')
    ? { rejectUnauthorized: false }
    : false,
});

async function runSeed() {
  try {
    console.log('🌱 Iniciando seed de base de datos...');

    // Inicializar conexión
    await AppDataSource.initialize();
    console.log('✅ Conexión a base de datos establecida');

    // Limpiar tablas usando CASCADE para manejar FK constraints
    console.log('🧹 Limpiando tablas existentes...');
    await AppDataSource.query('TRUNCATE TABLE ofertas, tutors CASCADE');
    console.log('✅ Tablas limpiadas');

    // IMPORTANTE: Ejecutar seed de tutores ANTES de ofertas (FK constraint)
    await seedTutors(AppDataSource);

    // Ejecutar seed de ofertas
    await seedOfertas(AppDataSource);

    console.log('🎉 Seed completado exitosamente');
  } catch (error) {
    console.error('❌ Error ejecutando seed:', error);
    process.exit(1);
  } finally {
    // Cerrar conexión
    await AppDataSource.destroy();
    console.log('👋 Conexión cerrada');
  }
}

// Ejecutar seed
void runSeed();
