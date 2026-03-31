import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DisponibilidadModule } from './disponibilidad/disponibilidad.module';
import { AvailabilityEntity } from './disponibilidad/entities/availability.entity';
import { ExperienciaEntity } from './experiencias/entities/experiencia.entity';
import { ExperienciasModule } from './experiencias/experiencias.module';
import { MateriaEntity } from './materias/entities/materia.entity';
import { Oferta } from './ofertas/domain/entities/oferta.entity';
import { OfertaEntity } from './ofertas/entities/oferta.entity';
import { OfertasModule } from './ofertas/ofertas.module';
import { OffersModule } from './offers/offers.module';
import { PerfilProfesionalEntity } from './perfil/entities/perfil-profesional.entity';
import { PerfilModule } from './perfil/perfil.module';
import { SolicitudEntity } from './solicitudes/entities/solicitud.entity';
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { Tutor } from './tutors/entities/tutor.entity';
import { TutorsModule } from './tutors/tutors.module';

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
          OfertaEntity,
          Tutor,
          AvailabilityEntity,
          ExperienciaEntity,
          PerfilProfesionalEntity,
          MateriaEntity,
          SolicitudEntity,
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
    SolicitudesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
