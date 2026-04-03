import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DEV_JWT_TOKEN } from './auth/jwt.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Poli Tutorías API')
    .setDescription(
      'API para la gestión de tutorías académicas.\n\n' +
        '## Autenticación\n\n' +
        'Para probar endpoints protegidos:\n' +
        '1. Haz clic en el botón **Authorize** 🔒 (arriba a la derecha)\n' +
        '2. En el campo **Value**, pega el siguiente token de desarrollo:\n\n' +
        '```\n' +
        DEV_JWT_TOKEN +
        '\n```\n\n' +
        '3. Haz clic en **Authorize** y luego en **Close**',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addTag('ofertas', 'Gestión de ofertas de tutoría')
    .addTag('offers', 'Búsqueda y listado de ofertas (HU03)')
    .addTag('tutors', 'Gestión del perfil de tutor (HU34)')
    .addTag('experiencias', 'Registro de experiencias del tutor (HU42)')
    .addTag(
      'perfil',
      'Perfil profesional del tutor — materias y experiencias (HU42)',
    )
    .addTag('solicitudes', 'Enviar solicitud de tutoría (HU-06)')
    .addTag('reviews', 'Reseñas de tutorías completadas (HU10)')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}
void bootstrap();
