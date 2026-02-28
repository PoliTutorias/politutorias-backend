import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { seedTutors } from './seeds/tutors.seed';
import { seedOfertas } from './seeds/ofertas.seed';

// Cargar variables de entorno
config();

const dbHost = process.env.DB_HOST || 'localhost';

const sslConfig = dbHost.includes('rds.amazonaws.com')
  ? { rejectUnauthorized: false }
  : false;

/** Conexión sin synchronize: solo para limpiar el esquema viejo */
const PreDataSource = new DataSource({
  type: 'postgres',
  host: dbHost,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'mysecretpassword',
  database: process.env.DB_NAME || 'PoliTutoriasDB',
  entities: [Tutor, Oferta],
  synchronize: false,
  logging: false,
  ssl: sslConfig,
});

/** Conexión principal con synchronize: recrea el esquema limpio */
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
  ssl: sslConfig,
});

async function runSeed() {
  try {
    console.log('🌱 Iniciando seed de base de datos...');

    // Paso 1: Conectar SIN synchronize y eliminar las tablas con el esquema viejo.
    // Esto evita que synchronize falle al agregar columnas NOT NULL a filas existentes.
    console.log('🧹 Eliminando tablas con esquema anterior...');
    await PreDataSource.initialize();
    await PreDataSource.query(
      'DROP TABLE IF EXISTS ofertas CASCADE; DROP TABLE IF EXISTS tutors CASCADE;',
    );
    await PreDataSource.destroy();
    console.log('✅ Tablas eliminadas');

    // Paso 2: Inicializar con synchronize: true → recrea las tablas con el esquema nuevo
    await AppDataSource.initialize();
    console.log(
      '✅ Conexión a base de datos establecida y esquema sincronizado',
    );

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
