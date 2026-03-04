import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OfertasModule } from './ofertas/ofertas.module';
import { OffersModule } from './offers/offers.module';
import { TutorsModule } from './tutors/tutors.module';
import { DisponibilidadModule } from './disponibilidad/disponibilidad.module';
import { ExperienciasModule } from './experiencias/experiencias.module';
import { PerfilModule } from './perfil/perfil.module';
import { Oferta } from './ofertas/domain/entities/oferta.entity';
import { Tutor } from './tutors/entities/tutor.entity';
import { AvailabilityEntity } from './disponibilidad/entities/availability.entity';
import { ExperienciaEntity } from './experiencias/entities/experiencia.entity';
import { PerfilProfesionalEntity } from './perfil/entities/perfil-profesional.entity';
import { MateriaEntity } from './materias/entities/materia.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [
          Oferta,
          Tutor,
          AvailabilityEntity,
          ExperienciaEntity,
          PerfilProfesionalEntity,
          MateriaEntity,
        ],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: false,
        ssl: configService.get<string>('DB_HOST')?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),
    OfertasModule,
    OffersModule,
    TutorsModule,
    DisponibilidadModule,
    ExperienciasModule,
    PerfilModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
