# PRD — HU-43-Registrar-tutoría-completada

> **Versión:** 1.0 | **Estado:** En definición | **Fecha:** 22 de mayo de 2024

---

## Metadatos

| Campo                   | Valor                                                               |
| ----------------------- | ------------------------------------------------------------------- |
| **Historia de Usuario** | HU-43                                                               |
| **Título**              | Registrar la tutoría completada                                     |
| **Tipo de cambio**      | `feat`                                                              |
| **HU relacionada**      | HU-39 (Historial de tutorías), HU-10 (Calificación)                 |
| **Rama**                | `feat/registrar-tutoria-completada`                                 |
| **Observación clave**   | Solo el tutor asignado a la tutoría puede marcarla como completada. |

---

## 1. Resumen Ejecutivo

Esta funcionalidad permite a los tutores gestionar el ciclo de vida de sus sesiones de tutoría directamente desde su historial. El objetivo principal es proporcionar un mecanismo sencillo para que el tutor confirme que una sesión programada efectivamente se llevó a cabo, cambiando su estado a "Completada".

El sistema permite realizar esta acción de forma rápida mediante un botón en la tarjeta de la tutoría o de forma detallada a través de un modal de información. Al completar una tutoría, se disparan actualizaciones en las métricas del tutor y se habilita la visualización de retroalimentación (en caso de que el estudiante ya haya calificado).

---

## 2. Contexto y Problema

### 2.1 Contexto del negocio

Dentro del ecosistema de la plataforma, el historial de tutorías es el centro de control para el tutor. Actualmente, las tutorías permanecen en estado "Programado" o "Sin Confirmar" indefinidamente a menos que el tutor realice una acción explícita. Sin este registro, el sistema no puede calcular métricas de desempeño ni habilitar flujos de pago o reputación.

### 2.2 Problema a resolver

- Inexistencia de un cierre formal de la sesión de tutoría por parte del prestador del servicio (tutor).
- Dificultad para distinguir entre sesiones pendientes y sesiones ya realizadas en la interfaz del historial.
- Falta de datos precisos para el contador de "Tutorías completadas" en el perfil del tutor.

---

## 3. Objetivos

### 3.1 Objetivo principal

Implementar la lógica de negocio y los componentes de interfaz necesarios para que un tutor registre la finalización de una tutoría, garantizando la integridad de los datos y la seguridad del acceso.

### 3.2 Objetivos específicos

- Exponer un endpoint seguro (`PATCH`) para la actualización de estado.
- Proveer una vista de detalle (`GET`) que diferencie entre tutorías editables y de solo lectura.
- Asegurar que un tutor no pueda modificar el estado de tutorías que no le pertenecen.
- Actualizar automáticamente la interfaz de usuario (contador y etiquetas) tras la acción de completar.

---

## 4. Alcance

### 4.1 Incluido en esta HU

- Desarrollo de endpoint `PATCH /api/tutorias/{id}/completar` con validación de autoría.
- Desarrollo de endpoint `GET /api/tutorias/{id}` para obtención de detalles enriquecidos.
- Componente `BotonCompletada` (en tarjeta y modal) con estados de carga.
- Lógica de revalidación de caché en el frontend para actualizar contadores.
- Integración con el servicio de métricas para incrementar el conteo de sesiones del tutor.

### 4.2 Fuera del alcance

| Elemento / Sección          | Motivo de exclusión                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| Edición de fecha/hora       | La HU solo cubre cambio de estado, no reprogramación.                                                 |
| Registro de inasistencia    | Se menciona en diagramas pero la lógica de "No-show" pertenece a otra HU específica.                  |
| Calificación del estudiante | El tutor no califica al estudiante en esta fase; solo visualiza si el estudiante lo calificó (HU-10). |

---

## 5. Historia de Usuario

> **Como** Tutor autenticado,
> **quiero** marcar una tutoría programada como "completada",
> **para** que mi historial refleje mi actividad real y se actualicen mis métricas de desempeño.

---

## 6. Criterios de Aceptación

### Escenario 1: Registro rápido desde la tarjeta del historial

|              |                                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Dado que** | El tutor está en la página `/tutor/historial` y visualiza una tarjeta de tutoría en estado "SIN_CONFIRMAR"                                                               |
| **Cuando**   | Hace clic en el botón "Completada" (borde verde) de la tarjeta                                                                                                           |
| **Entonces** | El sistema actualiza el estado en la BD, la tarjeta cambia su etiqueta a "COMPLETADA", desaparecen los botones de acción y el contador global de tutorías se incrementa. |

### Escenario 2: Visualización de detalles y registro desde Modal

|              |                                                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **Dado que** | El tutor hace clic en el área general de una tarjeta "SIN_CONFIRMAR"                                                         |
| **Cuando**   | Se abre el modal `DetalleTutoriaModal` y el tutor pulsa "Completada" dentro del modal                                        |
| **Entonces** | El sistema procesa la actualización, cierra el modal automáticamente y refresca la lista del historial con los nuevos datos. |

### Escenario 3: Seguridad y Propiedad de Datos

|              |                                                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **Dado que** | Un usuario intenta acceder al endpoint de completar de una tutoría que existe pero no le pertenece                           |
| **Cuando**   | Se envía la petición `PATCH`                                                                                                 |
| **Entonces** | El sistema debe retornar un error `404 Not Found` o `403 Forbidden` para no revelar información ni permitir la modificación. |

### Escenario 4: Integración con Calificaciones (HU-10)

|              |                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Dado que** | Una tutoría ya tiene estado "COMPLETADA" y el estudiante ya dejó una calificación                                         |
| **Cuando**   | El tutor abre el modal de detalle                                                                                         |
| **Entonces** | El sistema debe mostrar la sección de calificación con las estrellas y el comentario del estudiante en modo solo lectura. |

---

## 7. Contrato de Datos (API)

### Endpoints

- **PATCH** `/api/tutorias/:id/completar`
  - **Seguridad:** Requiere `JwtAuthGuard`.
  - **Respuesta (200 OK):** `TutorialEntity` actualizada.

- **GET** `/api/tutorias/:id`
  - **Seguridad:** Requiere `JwtAuthGuard`.
  - **Respuesta (200 OK):** `TutoriaDetalleDto`.

### Estructura de Datos (DTO de Detalle)

```jsonc
{
  "id": "uuid-string",
  "estudiante": {
    "id": "uuid-string",
    "nombre": "Juan Pérez",
  },
  "materia": "Matemáticas Avanzadas",
  "fecha": "2026-02-25",
  "hora": "11:00",
  "tipo": "Presencial", // o "Virtual"
  "precioPorHora": 25.0,
  "lugar": "Biblioteca Central", // opcional si es virtual
  "mensajeEstudiante": "Necesito ayuda con integrales", // opcional
  "estado": "SIN_CONFIRMAR", // "SIN_CONFIRMAR" | "COMPLETADA" | "CANCELADA" | "INASISTENCIA"
  "calificacionEstudiante": 5, // opcional (HU-10)
  "comentarioEstudiante": "Excelente explicación", // opcional (HU-10)
}
```

---

## 8. Arquitectura de Componentes

### Estructura Frontend (Next.js)

```text
/tutor/historial (Page)
├── ContadorTutoriasCompletadas (Component - React Server Component)
└── ListaTutorias
    └── TutoriaCard (Client Component)
        ├── EtiquetaEstado (Visual)
        ├── BotonCompletadaCard (Action)
        └── DetalleTutoriaModal (Radix/UI Modal)
            ├── SeccionInfoEstudiante
            ├── BotonCompletadaModal
            ├── BotonInasistenciaModal
            └── SeccionCalificacionEstudiante (Condicional HU-10)
```

### Flujo de Datos

1. El **Server Action** `marcarTutoriaCompletadaAction` invoca al Backend de NestJS.
2. El **TutoriasService** valida que el `tutorId` del JWT coincida con el de la tutoría en DB.
3. Se actualiza el `status` a `completed`.
4. El Frontend usa `revalidatePath('/tutor/historial')` para forzar la actualización de los datos del servidor (contadores y lista).

---

## 9. Casos de Error

| Situación                                     | Comportamiento esperado                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------- |
| Tutoría no existe                             | Retornar `404 Not Found`.                                                               |
| Tutoría pertenece a otro tutor                | Retornar `404 Not Found` (por seguridad para no confirmar existencia).                  |
| Intentar completar una tutoría ya "CANCELADA" | Retornar `400 Bad Request` con mensaje "Solo se pueden completar tutorías programadas". |
| Error de conexión con DB                      | Retornar `500 Internal Server Error`.                                                   |

---

## 10. Pruebas

### 10.1 Funcionales (E2E)

| ID   | Descripción                                  | Resultado esperado                                                             |
| ---- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| T-01 | Tutor marca como completada desde la tarjeta | La tarjeta se actualiza visualmente sin recargar toda la página.               |
| T-02 | Verificación de contador                     | El número de tutorías completadas en el header/resumen sube en +1.             |
| T-03 | Acceso a detalle de completada               | Al abrir el modal de una ya completada, el botón "Completada" no debe existir. |

### 10.2 Unitarias

| Componente / Clase       | Caso de prueba                                                             |
| ------------------------ | -------------------------------------------------------------------------- |
| `TutoriasService`        | Debe lanzar `NotFoundException` si el `tutorId` no es el dueño.            |
| `TutoriasService`        | Debe permitir el cambio de estado solo si el estado actual es `SCHEDULED`. |
| `mapToTutoriaDetalleDto` | Debe formatear la fecha a `YYYY-MM-DD` y la hora a `HH:MM`.                |

---

## 11. Notas al Revisor

- **Consistencia de Enums:** Se ha alineado el backend para usar los mismos estados que la HU-39 (`SCHEDULED`, `COMPLETED`, `NO_SHOW`), pero el DTO los traduce a los strings que el frontend ya consume (`SIN_CONFIRMAR`, `COMPLETADA`, etc.).
- **Métricas:** El incremento de métricas está centralizado en el `TutoriasService` para asegurar que cada vez que una tutoría se guarde como completada, el contador se actualice.
- **Fechas:** Se recomienda el uso de `dayjs` en el backend para manejar la zona horaria y formatos de fecha consistentes con el frontend. <!-- verificar con el equipo -->
