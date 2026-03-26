# Módulo Tutorías - HU-39

## Descripción

Módulo que permite a los tutores ver el historial de tutorías impartidas con métricas resumidas y detalles individuales de cada sesión.

## Endpoints

### 1. GET `/api/tutorias/historial`

Obtiene el historial paginado de tutorías impartidas con métricas resumidas.

**Autenticación:** JWT + TutorAuthGuard

**Query Parameters:**

- `page` (opcional): Número de página (default: 1, min: 1)
- `limit` (opcional): Registros por página (default: 5, min: 1, max: 100)

**Respuesta (200 OK):**

```json
{
  "summary": {
    "totalCompleted": 25,
    "totalSubjects": 4,
    "totalStudents": 18
  },
  "paginatedData": {
    "items": [
      {
        "id": "uuid",
        "studentName": "Juan Pérez",
        "subjectName": "Cálculo Diferencial",
        "date": "2024-05-20",
        "status": "Completada",
        "pricePerHour": "$15/h"
      }
    ],
    "total": 25,
    "page": 1,
    "lastPage": 5
  }
}
```

### 2. GET `/api/tutorias/:id`

Obtiene el detalle completo de una tutoría específica.

**Autenticación:** JWT + TutorAuthGuard

**Path Parameters:**

- `id`: UUID de la tutoría

**Respuesta (200 OK):**

```json
{
  "id": "uuid",
  "student": {
    "name": "Juan Pérez",
    "avatar": null
  },
  "subject": "Cálculo Diferencial",
  "date": "20 de mayo, 2024",
  "time": "14:00 - 15:00",
  "modality": "Virtual",
  "meetingLink": "https://zoom.us/j/123456",
  "location": null,
  "pricePerHour": "$15/h",
  "studentMessage": "Necesito ayuda con límites y derivadas"
}
```

**Respuesta (404 Not Found):**

- Si la tutoría no existe
- Si la tutoría no pertenece al tutor autenticado (ownership check)

## Lógica de Negocio

### Estados considerados como "tutorías impartidas"

- `COMPLETADA`: Tutoría finalizada
- `ACEPTADA`: Tutoría confirmada (se considera impartida aunque no esté marcada como completada)

### Cálculo de Métricas

- **totalCompleted**: COUNT de solicitudes con estado COMPLETADA o ACEPTADA
- **totalSubjects**: COUNT DISTINCT de ofertas.titulo
- **totalStudents**: COUNT DISTINCT de estudianteId

### Mapeo de Modalidad

- **Virtual**: Se retorna `meetingLink`, `location` es `null`
- **Presencial**: Se retorna `location`, `meetingLink` es `null`

### Formateo de Fechas

- Fecha ISO (`2024-05-20`) → Texto legible (`20 de mayo, 2024`)
- Hora (`14:00`) → Rango de 1 hora (`14:00 - 15:00`)

### Seguridad (Ownership Check)

El servicio **SIEMPRE** valida que la tutoría pertenezca al tutor autenticado:

- `tutorId` se extrae de `req.tutor.id` (inyectado por `TutorAuthGuard`)
- Si `solicitud.tutorId !== tutorId`, se lanza `NotFoundException`

## Arquitectura

```
src/tutorias/
├── tutorias.module.ts         # Módulo NestJS con dependencias TypeORM
├── tutorias.controller.ts     # Endpoints REST con Guards
├── tutorias.service.ts        # Lógica de negocio
├── tutorias.service.spec.ts   # Tests unitarios (9 tests, 95.83% coverage)
└── dto/
    ├── history-query-params.dto.ts   # Validación de parámetros de paginación
    ├── history-response.dto.ts       # Respuesta completa del historial
    ├── history-summary.dto.ts        # Métricas resumidas
    ├── history-item.dto.ts           # Item individual del historial
    ├── paginated-history.dto.ts      # Datos paginados
    └── tutorial-detail.dto.ts        # Detalle completo de tutoría
```

## Tests

### Tests Unitarios (`tutorias.service.spec.ts`)

- ✅ 9 tests, 100% pasando
- ✅ 95.83% de cobertura de código
- Tests de:
  - Filtrado estricto por `tutorId`
  - Mapeo de estados (COMPLETADA → "Completada")
  - Cálculo correcto de `lastPage`
  - Ownership check (NotFoundException)
  - Mapeo de modalidades (Virtual/Presencial)
  - Cálculo de métricas (students, subjects)

### Tests E2E (`test/tutorias-historial.e2e-spec.ts`)

- ✅ 7/9 tests pasando
- Tests de:
  - Estructura de respuesta correcta
  - Validación de parámetros (page < 1, limit > 100)
  - Ownership check
  - 404 en registros inexistentes

## Dependencias

- **TypeORM Entities:**
  - `SolicitudEntity`: Entidad principal de tutorías
  - `Oferta`: Para obtener título de materia y precio
  - `Tutor`: Para validación de ownership
  - `UserEntity`: (preparado para futura integración de avatares)

- **Guards:**
  - `JwtAuthGuard`: Autenticación JWT
  - `TutorAuthGuard`: Valida que el usuario es tutor e inyecta `req.tutor`

## Notas de Implementación

### TDD Completo (Red → Green → Refactor)

1. **FASE RED**: Tests escritos primero (todos FALLARON inicialmente)
2. **FASE GREEN**: Implementación mínima para pasar tests
3. **FASE REFACTOR**: Código limpio, cobertura validada

### Decisiones Arquitectónicas

- **Naming en español**: `TutoriasModule` (consistente con el proyecto)
- **Reutilización de entidades**: Usa `SolicitudEntity` existente (NO crea `TutorialEntity`)
- **Patrón de paginación**: Sigue `FilterParamsDto` de `SolicitudesModule`
- **Ownership obligatorio**: SIEMPRE extrae `tutorId` de `req.tutor.id` (nunca de params/body)

### Mejoras Futuras

- [ ] Integrar avatar de estudiante (JOIN con `UserEntity`)
- [ ] Agregar filtros por fecha/materia
- [ ] Exportar historial a PDF/CSV
- [ ] Caché de métricas (Redis)
