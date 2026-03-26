# 🧪 Guía de Pruebas Manuales - HU-39: Ver Historial de Tutorías Impartidas

> **Objetivo**: Validar manualmente los endpoints de historial de tutorías usando Swagger UI

---

## 📋 Pre-requisitos

### 1️⃣ Iniciar el servidor

```bash
npm run start:dev
```

Espera a que veas:

```
[Nest] INFO [NestApplication] Nest application successfully started
```

### 2️⃣ Acceder a Swagger

Abre tu navegador en:

```
http://localhost:3000/api/docs
```

### 3️⃣ Datos de prueba necesarios

Necesitarás:

- ✅ **JWT Token** de un tutor autenticado
- ✅ **Solicitudes en estado COMPLETADA/ACEPTADA** en la base de datos

---

## 🔐 PASO 1: Obtener Token JWT

### Opción A: Login como Tutor

1. En Swagger, busca el endpoint **`POST /auth/login/tutor`**
2. Click en **"Try it out"**
3. Usa estas credenciales de prueba:

```json
{
  "email": "tutor@example.com",
  "password": "password123"
}
```

> ⚠️ **Nota**: Usa las credenciales de un tutor que exista en tu base de datos. Si no tienes datos de prueba, ejecuta el seed:
>
> ```bash
> npm run seed
> ```

4. Click en **"Execute"**
5. Copia el **`access_token`** de la respuesta

**Respuesta esperada (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-del-usuario",
    "email": "tutor@example.com",
    "role": "tutor"
  }
}
```

### Opción B: Usar token existente

Si ya tienes un token válido, úsalo directamente.

---

## 🔓 PASO 2: Autorizar en Swagger

1. En la parte superior de Swagger UI, click en el botón **🔓 Authorize**
2. En el campo **"Value"**, escribe:

   ```
   Bearer <tu-token-aquí>
   ```

   **Ejemplo**:

   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YjNkMGI...
   ```

3. Click en **"Authorize"**
4. Click en **"Close"**

✅ Ahora todos los endpoints usarán tu token automáticamente.

---

## ✅ PASO 3: Probar Endpoint - GET /api/tutorias/historial

### Escenario 1: Obtener historial con valores por defecto

1. Busca el endpoint **`GET /api/tutorias/historial`** en la sección **Tutorías**
2. Click en **"Try it out"**
3. **Deja los parámetros vacíos** (usará defaults: page=1, limit=5)
4. Click en **"Execute"**

**Respuesta esperada (200 OK):**

```json
{
  "summary": {
    "totalCompleted": 12,
    "totalSubjects": 3,
    "totalStudents": 8
  },
  "paginatedData": {
    "items": [
      {
        "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
        "studentName": "Juan Pérez",
        "subjectName": "Cálculo Diferencial",
        "date": "2024-05-20",
        "status": "Completada",
        "pricePerHour": "$15/h"
      },
      {
        "id": "b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e",
        "studentName": "María García",
        "subjectName": "Álgebra Lineal",
        "date": "2024-05-18",
        "status": "Aceptada",
        "pricePerHour": "$20/h"
      }
      // ... hasta 5 items (limit por defecto)
    ],
    "total": 12,
    "page": 1,
    "lastPage": 3
  }
}
```

**✅ Validaciones**:

- ✅ Status code: **200 OK**
- ✅ `summary` tiene 3 campos numéricos: totalCompleted, totalSubjects, totalStudents
- ✅ `paginatedData.items` tiene máximo 5 elementos
- ✅ `paginatedData.total` es un número
- ✅ `paginatedData.page` es 1
- ✅ `paginatedData.lastPage` = Math.ceil(total / limit)
- ✅ Cada item tiene: id, studentName, subjectName, date, status, pricePerHour

---

### Escenario 2: Paginación con parámetros personalizados

1. Busca **`GET /api/tutorias/historial`**
2. Click en **"Try it out"**
3. Ingresa parámetros:
   - **page**: `2`
   - **limit**: `3`
4. Click en **"Execute"**

**Respuesta esperada (200 OK):**

```json
{
  "summary": {
    "totalCompleted": 12,
    "totalSubjects": 3,
    "totalStudents": 8
  },
  "paginatedData": {
    "items": [
      // 3 items (del 4 al 6)
    ],
    "total": 12,
    "page": 2,
    "lastPage": 4
  }
}
```

**✅ Validaciones**:

- ✅ Status code: **200 OK**
- ✅ `paginatedData.page` es **2**
- ✅ `paginatedData.items.length` <= **3**
- ✅ `lastPage` = Math.ceil(12 / 3) = **4**
- ✅ Los items son diferentes a los de la página 1

---

### Escenario 3: Validación - page < 1 (debe fallar)

1. Busca **`GET /api/tutorias/historial`**
2. Click en **"Try it out"**
3. Ingresa parámetros:
   - **page**: `0`
   - **limit**: `5`
4. Click en **"Execute"**

**Respuesta esperada (400 Bad Request):**

```json
{
  "statusCode": 400,
  "message": ["page must not be less than 1"],
  "error": "Bad Request"
}
```

**✅ Validaciones**:

- ✅ Status code: **400 Bad Request**
- ✅ Mensaje indica que page debe ser >= 1

---

### Escenario 4: Validación - limit > 100 (debe fallar)

1. Busca **`GET /api/tutorias/historial`**
2. Click en **"Try it out"**
3. Ingresa parámetros:
   - **page**: `1`
   - **limit**: `101`
4. Click en **"Execute"**

**Respuesta esperada (400 Bad Request):**

```json
{
  "statusCode": 400,
  "message": ["limit must not be greater than 100"],
  "error": "Bad Request"
}
```

**✅ Validaciones**:

- ✅ Status code: **400 Bad Request**
- ✅ Mensaje indica que limit debe ser <= 100

---

### Escenario 5: Sin autenticación (debe fallar)

1. Click en el botón **🔓 Authorize** en la parte superior
2. Click en **"Logout"** para quitar el token
3. Busca **`GET /api/tutorias/historial`**
4. Click en **"Try it out"** → **"Execute"**

**Respuesta esperada (401 Unauthorized):**

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**✅ Validaciones**:

- ✅ Status code: **401 Unauthorized**

> ⚠️ **Importante**: Vuelve a autorizar con el token para continuar las pruebas.

---

## ✅ PASO 4: Probar Endpoint - GET /api/tutorias/:id

### Escenario 1: Obtener detalle de una tutoría válida

**Pre-requisito**: Necesitas el **ID** de una tutoría del historial.

1. Ejecuta primero **`GET /api/tutorias/historial`** para obtener IDs
2. Copia el **`id`** de uno de los items (ej: `a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d`)
3. Busca el endpoint **`GET /api/tutorias/{id}`**
4. Click en **"Try it out"**
5. Pega el ID en el campo **id**
6. Click en **"Execute"**

**Respuesta esperada (200 OK):**

```json
{
  "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "student": {
    "name": "Juan Pérez",
    "avatar": "https://ui-avatars.com/api/?name=Juan+P%C3%A9rez&background=0D8ABC&color=fff&size=128&bold=true&rounded=true"
  },
  "subject": "Cálculo Diferencial",
  "date": "20 de mayo, 2024",
  "time": "14:00 - 15:00",
  "modality": "Virtual",
  "meetingLink": "https://zoom.us/j/123456789",
  "location": null,
  "pricePerHour": "$15/h",
  "studentMessage": "Necesito ayuda con derivadas parciales."
}
```

**✅ Validaciones**:

- ✅ Status code: **200 OK**
- ✅ Tiene todos los campos: id, student, subject, date, time, modality, pricePerHour, studentMessage
- ✅ `student` tiene `name` y `avatar`
- ✅ `student.avatar` es una URL de UI Avatars (contiene "ui-avatars.com")
- ✅ Si `modality` = "Virtual": `meetingLink` tiene valor, `location` es null
- ✅ Si `modality` = "Presencial": `location` tiene valor, `meetingLink` es null
- ✅ `date` tiene formato legible: "20 de mayo, 2024"
- ✅ `time` tiene formato: "HH:MM - HH:MM"
- ✅ `pricePerHour` tiene formato: "$XX/h"

---

### Escenario 2: ID no existe (debe fallar)

1. Busca **`GET /api/tutorias/{id}`**
2. Click en **"Try it out"**
3. Usa un UUID que **NO exista**:
   ```
   99999999-9999-9999-9999-999999999999
   ```
4. Click en **"Execute"**

**Respuesta esperada (404 Not Found):**

```json
{
  "statusCode": 404,
  "message": "La tutoría no existe",
  "error": "Not Found"
}
```

**✅ Validaciones**:

- ✅ Status code: **404 Not Found**
- ✅ Mensaje: "La tutoría no existe"

---

### Escenario 3: Ownership Check - Intentar acceder a tutoría de otro tutor

**Pre-requisito**: Necesitas el ID de una tutoría que **NO pertenezca al tutor autenticado**.

1. **Opción A**: Si tienes acceso a la BD, copia un `id` de una solicitud con diferente `tutorId`
2. **Opción B**: Pide a un compañero el ID de una de sus tutorías
3. Busca **`GET /api/tutorias/{id}`**
4. Click en **"Try it out"**
5. Pega el ID ajeno
6. Click en **"Execute"**

**Respuesta esperada (404 Not Found):**

```json
{
  "statusCode": 404,
  "message": "La tutoría no existe",
  "error": "Not Found"
}
```

**✅ Validaciones**:

- ✅ Status code: **404 Not Found** (por seguridad, no retorna 403 para no revelar existencia del recurso)
- ✅ Mensaje: "La tutoría no existe"

> 🔒 **Seguridad**: El endpoint retorna 404 (no 403) para IDs ajenos, evitando revelar la existencia de la tutoría.

---

### Escenario 4: Sin autenticación (debe fallar)

1. Click en **🔓 Authorize** → **Logout**
2. Busca **`GET /api/tutorias/{id}`**
3. Click en **"Try it out"**
4. Usa cualquier ID válido
5. Click en **"Execute"**

**Respuesta esperada (401 Unauthorized):**

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**✅ Validaciones**:

- ✅ Status code: **401 Unauthorized**

---

## 📊 Checklist de Pruebas Completas

### GET /api/tutorias/historial

- [ ] ✅ **Caso exitoso**: page=1, limit=5 → 200 OK con estructura correcta
- [ ] ✅ **Paginación**: page=2, limit=3 → items correctos, lastPage correcto
- [ ] ✅ **Validación page < 1**: page=0 → 400 Bad Request
- [ ] ✅ **Validación limit > 100**: limit=101 → 400 Bad Request
- [ ] ✅ **Sin JWT**: Sin token → 401 Unauthorized
- [ ] ✅ **Métricas**: summary con totalCompleted, totalSubjects, totalStudents

### GET /api/tutorias/:id

- [ ] ✅ **Caso exitoso**: ID válido propio → 200 OK con detalle completo
- [ ] ✅ **ID no existe**: UUID inexistente → 404 Not Found
- [ ] ✅ **Ownership check**: ID de otro tutor → 404 Not Found
- [ ] ✅ **Sin JWT**: Sin token → 401 Unauthorized
- [ ] ✅ **Modalidad Virtual**: meetingLink presente, location null
- [ ] ✅ **Modalidad Presencial**: location presente, meetingLink null
- [ ] ✅ **Formatos**: date legible, time "HH:MM - HH:MM", precio "$X/h"

---

## 🐛 Troubleshooting

### Problema: "No se encontraron tutorías"

**Síntoma**: `paginatedData.items` está vacío, `total: 0`

**Causa**: El tutor autenticado no tiene solicitudes en estado COMPLETADA o ACEPTADA.

**Solución**:

1. Verifica en la BD que existan solicitudes para ese tutor:
   ```sql
   SELECT * FROM solicitudes WHERE tutorId = '<id-del-tutor>' AND estado IN ('COMPLETADA', 'ACEPTADA');
   ```
2. Si no hay datos, ejecuta el seed:
   ```bash
   npm run seed
   ```

---

### Problema: "401 Unauthorized" en todos los endpoints

**Síntoma**: Todos los requests retornan 401.

**Causa**: Token expirado o inválido.

**Solución**:

1. Ejecuta login nuevamente: `POST /auth/login/tutor`
2. Copia el nuevo token
3. Autoriza nuevamente en Swagger (🔓 Authorize)

---

### Problema: "404 Not Found" en endpoint válido

**Síntoma**: Swagger retorna 404 al intentar acceder a `/api/tutorias/historial`.

**Causa**: El servidor no está corriendo o el módulo no está registrado.

**Solución**:

1. Verifica que el servidor esté corriendo:
   ```bash
   npm run start:dev
   ```
2. Verifica que veas logs de compilación exitosa
3. Verifica que `TutoriasModule` esté en `app.module.ts`

---

## 🎯 Casos de Prueba Adicionales (Opcionales)

### Caso: Tutor sin tutorías completadas

**Setup**: Usa un tutor recién creado sin solicitudes.

**Resultado esperado**:

```json
{
  "summary": {
    "totalCompleted": 0,
    "totalSubjects": 0,
    "totalStudents": 0
  },
  "paginatedData": {
    "items": [],
    "total": 0,
    "page": 1,
    "lastPage": 0
  }
}
```

---

### Caso: Última página incompleta

**Setup**: Si total=7, limit=3, la última página (page=3) solo tendrá 1 item.

**Resultado esperado**:

```json
{
  "paginatedData": {
    "items": [
      {
        /* solo 1 item */
      }
    ],
    "total": 7,
    "page": 3,
    "lastPage": 3
  }
}
```

---

## 📸 Capturas de Pantalla Recomendadas

Para documentar las pruebas, captura:

1. ✅ **Swagger UI** mostrando los 2 endpoints de Tutorías
2. ✅ **Respuesta 200 OK** de GET /historial con datos
3. ✅ **Respuesta 200 OK** de GET /:id con detalle completo
4. ✅ **Respuesta 400 Bad Request** de validación
5. ✅ **Respuesta 404 Not Found** de ownership check
6. ✅ **Respuesta 401 Unauthorized** sin token

---

## ✅ Resultado Esperado Final

Al completar todas las pruebas:

- ✅ **12/12 casos de prueba** pasando
- ✅ Endpoints funcionan correctamente con autenticación
- ✅ Validaciones de DTOs funcionan
- ✅ Ownership check protege recursos
- ✅ Formatos de fecha/hora/moneda son legibles
- ✅ Paginación funciona correctamente
- ✅ Swagger UI documenta los endpoints completamente

---

**¡Listo para producción!** 🚀

---

## 📚 Referencias

- **PRD**: `docs/PRD-HU39.md`
- **Verificación**: `verification-report-hu39.md`
- **README Técnico**: `src/tutorias/README.md`
- **Swagger Docs**: http://localhost:3000/api/docs
