# PoliTutorías Backend

Backend de **PoliTutorías**, construido con NestJS y TypeORM, para gestionar tutorías académicas, ofertas, solicitudes, agenda y reseñas.

## Tecnologías principales

- Node.js + TypeScript
- NestJS
- PostgreSQL
- TypeORM
- Swagger

## Requisitos

- Node.js 20+
- Yarn 1.x
- PostgreSQL 16 (local o Docker)

## Configuración local

1. Instala dependencias:

```bash
yarn install
```

2. Crea el archivo de entorno:

```bash
cp .env.template .env
```

3. Completa las variables de `.env`:

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
PORT=3000
NODE_ENV=development
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
```

## Base de datos con Docker (opcional)

```bash
yarn docker:up
```

> El `docker-compose.yml` expone PostgreSQL en el puerto local `5434`.

Para detener el contenedor:

```bash
yarn docker:down
```

## Ejecutar el proyecto

```bash
# desarrollo
yarn start:dev

# producción
yarn build
yarn start:prod
```

Aplicación: `http://localhost:3000`

## Documentación API

Swagger está disponible en:

`http://localhost:3000/api/docs`

## Scripts útiles

```bash
yarn lint
yarn test
yarn test:e2e
yarn test:cov
yarn seed
```

## Módulos principales

- `auth`: autenticación y autorización
- `ofertas` / `offers`: gestión y consulta de ofertas
- `tutors`: perfil del tutor
- `disponibilidad`: franjas de disponibilidad
- `experiencias` y `perfil`: perfil profesional
- `solicitudes`: solicitudes de tutoría
- `tutorias` y `reviews`: tutorías y reseñas
- `agenda` y `agenda-estudiante`: sesiones y agenda
- `storage`: almacenamiento de archivos en S3

## Recursos adicionales

- Guía de PostgreSQL + Swagger: `SETUP_POSTGRESQL_SWAGGER.md`
- Documentación funcional: carpeta `docs/`
