import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { AvailabilityEntity } from '../disponibilidad/entities/availability.entity';
import { ExperienciaEntity } from '../experiencias/entities/experiencia.entity';
import { MateriaEntity } from '../materias/entities/materia.entity';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { OfertaEntity } from '../ofertas/entities/oferta.entity';
import { PerfilProfesionalEntity } from '../perfil/entities/perfil-profesional.entity';
import { Tutor } from '../tutors/entities/tutor.entity';
import { seedDisponibilidad } from './seeds/disponibilidad.seed';
import { seedExperiencias } from './seeds/experiencias.seed';
import { seedOfertas, seedOfertasHU26 } from './seeds/ofertas.seed';
import { seedPerfilesProfesionales } from './seeds/perfil-profesional.seed';
import { seedTutors } from './seeds/tutors.seed';

// Cargar variables de entorno
config();

const dbHost = process.env.DB_HOST || 'localhost';

const sslConfig = dbHost.includes('rds.amazonaws.com')
  ? { rejectUnauthorized: false }
  : false;

/** Todas las entidades del proyecto */
const ALL_ENTITIES = [
  Tutor,
  Oferta,
  OfertaEntity,
  AvailabilityEntity,
  ExperienciaEntity,
  PerfilProfesionalEntity,
  MateriaEntity,
];

/** Conexión sin synchronize: solo para limpiar el esquema viejo */
const PreDataSource = new DataSource({
  type: 'postgres',
  host: dbHost,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'mysecretpassword',
  database: process.env.DB_NAME || 'PoliTutoriasDB',
  entities: ALL_ENTITIES,
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
  entities: ALL_ENTITIES,
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
    await PreDataSource.query(`
      DROP TABLE IF EXISTS tutor_materias             CASCADE;
      DROP TABLE IF EXISTS tutor_perfiles_profesionales CASCADE;
      DROP TABLE IF EXISTS tutor_experiencias         CASCADE;
      DROP TABLE IF EXISTS availability               CASCADE;
      DROP TABLE IF EXISTS ofertas                    CASCADE;
      DROP TABLE IF EXISTS tutors                     CASCADE;

      -- Eliminar tipos ENUM huérfanos para que synchronize los recree con los valores actuales
      DROP TYPE IF EXISTS tutors_facultad_enum         CASCADE;
      DROP TYPE IF EXISTS tutors_semestreactual_enum   CASCADE;
      DROP TYPE IF EXISTS ofertas_modalidad_enum       CASCADE;
    `);
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

    // HU26: Seed de ofertas con campo modalidad (PRESENCIAL/VIRTUAL/Virtual/Presencial)
    await seedOfertasHU26(AppDataSource);

    // Ejecutar seed de disponibilidad
    await seedDisponibilidad(AppDataSource);

    // HU42: Experiencias y perfiles profesionales
    // (deben ir DESPUÉS de seedTutors por FK tutorId)
    await seedExperiencias(AppDataSource);
    await seedPerfilesProfesionales(AppDataSource);

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
