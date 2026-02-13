import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Oferta } from '../ofertas/domain/entities/oferta.entity';
import { seedOfertas } from './seeds/ofertas.seed';

// Cargar variables de entorno
config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'mysecretpassword',
  database: process.env.DB_NAME || 'PoliTutoriasDB',
  entities: [Oferta],
  synchronize: false, // No sincronizar automáticamente en seeds
  logging: false,
});

async function runSeed() {
  try {
    console.log('🌱 Iniciando seed de base de datos...');
    
    // Inicializar conexión
    await AppDataSource.initialize();
    console.log('✅ Conexión a base de datos establecida');

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
runSeed();
