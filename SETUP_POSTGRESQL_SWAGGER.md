# Poli Tutorías Backend - Guía de Configuración PostgreSQL y Swagger

## 🗄️ Configuración de PostgreSQL con Docker

### 1. Levantar la base de datos PostgreSQL

```bash
# Levantar el contenedor de PostgreSQL
npm run docker:up

# Verificar que el contenedor esté corriendo
docker ps
```

### 2. Variables de entorno

El archivo `.env` ya está configurado con los siguientes valores:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=mysecretpassword
DB_NAME=PoliTutoriasDB
PORT=3000
NODE_ENV=development
```

### 3. Iniciar la aplicación

```bash
# Modo desarrollo con hot-reload
npm run start:dev
```

La aplicación se conectará automáticamente a PostgreSQL y creará las tablas necesarias (gracias a `synchronize: true`).

---

## 📚 Documentación con Swagger

### Acceder a Swagger UI

Una vez que la aplicación esté corriendo, accede a:

🔗 **http://localhost:3000/api/docs**

### Endpoints disponibles

#### POST `/api/ofertas` - Crear oferta de tutoría

**Request Body:**
```json
{
  "title": "Cálculo Vectorial",
  "price": 10,
  "modality": "Presencial",
  "categories": ["Matemáticas"],
  "description": "Se enseñará cálculo vectorial, incluyendo integrales de línea y superficie."
}
```

**Respuestas:**
- ✅ **201 Created**: Oferta creada exitosamente
- ❌ **400 Bad Request**: Datos de entrada inválidos
- ❌ **409 Conflict**: Ya existe una oferta con el mismo título para el tutor
- ❌ **500 Internal Server Error**: Error del servidor

---

## 🔍 Verificar en TablePlus

### 1. Configurar conexión en TablePlus

1. Abrir TablePlus
2. Crear nueva conexión PostgreSQL
3. Configurar con estos datos:
   - **Host:** localhost
   - **Port:** 5432
   - **User:** postgres
   - **Password:** mysecretpassword
   - **Database:** PoliTutoriasDB

### 2. Verificar tablas

Deberías ver la tabla `ofertas` con esta estructura:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Primary Key |
| title | varchar(80) | Título de la oferta |
| price | decimal(10,2) | Precio por hora |
| modality | varchar(50) | Modalidad (Presencial/Virtual) |
| categories | text[] | Array de categorías |
| description | varchar(250) | Descripción |
| tutorId | uuid | ID del tutor |
| createdAt | timestamp | Fecha de creación |
| updatedAt | timestamp | Fecha de actualización |

### 3. Constraint único

Existe un constraint `UQ_tutorId_title` que impide que un tutor tenga dos ofertas con el mismo título.

---

## 🧪 Probar la API

### Opción 1: Swagger UI (Recomendado)
1. Ve a http://localhost:3000/api/docs
2. Expande el endpoint POST `/api/ofertas`
3. Click en "Try it out"
4. Modifica el JSON de ejemplo
5. Click en "Execute"

### Opción 2: Terminal con curl

```bash
curl -X POST http://localhost:3000/api/ofertas \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Cálculo Vectorial",
    "price": 10,
    "modality": "Presencial",
    "categories": ["Matemáticas"],
    "description": "Se enseñará cálculo vectorial, incluyendo integrales de línea y superficie."
  }'
```

### Opción 3: PowerShell

```powershell
$body = @{
    title = "Cálculo Vectorial"
    price = 10
    modality = "Presencial"
    categories = @("Matemáticas")
    description = "Se enseñará cálculo vectorial, incluyendo integrales de línea y superficie."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/ofertas" -Method Post -Body $body -ContentType "application/json"
```

---

## 🛠️ Scripts útiles

```bash
# Levantar PostgreSQL
npm run docker:up

# Ver logs de PostgreSQL
npm run docker:logs

# Detener PostgreSQL
npm run docker:down

# Iniciar aplicación en desarrollo
npm run start:dev

# Ejecutar tests
npm run test
npm run test:e2e
```

---

## ✅ Checklist de validación

- [ ] PostgreSQL corriendo en Docker (`docker ps`)
- [ ] Aplicación iniciada (`npm run start:dev`)
- [ ] Swagger accesible en http://localhost:3000/api/docs
- [ ] Tabla `ofertas` creada en la base de datos (TablePlus)
- [ ] Crear oferta desde Swagger funciona
- [ ] Datos visibles en TablePlus
- [ ] Tests E2E pasan (`npm run test:e2e`)

---

## 🐛 Troubleshooting

### El contenedor de PostgreSQL no inicia
```bash
# Ver logs
docker-compose logs db

# Recrear el contenedor
docker-compose down
docker-compose up -d
```

### Error de conexión a PostgreSQL
- Verificar que el contenedor esté corriendo: `docker ps`
- Verificar variables de entorno en `.env`
- Verificar que el puerto 5432 no esté ocupado

### Swagger no muestra los endpoints
- Verificar que la aplicación esté corriendo
- Limpiar caché del navegador
- Acceder a http://localhost:3000/api/docs

---

## 📝 Notas importantes

- ⚠️ `synchronize: true` solo debe usarse en desarrollo
- 🔒 Cambiar las contraseñas antes de producción
- 🗃️ Los datos se persisten en `./postgres/`
- 🧹 Para limpiar datos: elimina la carpeta `postgres/`
