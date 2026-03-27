# PRD — HU-39-Ver historial de tutorías impartidas

> **Versión:** 1.0 | **Estado:** En definición | **Fecha:** 24 de Mayo de 2024

---

## Metadatos

| Campo                   | Valor                                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Historia de Usuario** | HU-39                                                                                                                            |
| **Título**              | Ver historial de tutorías impartidas                                                                                             |
| **Tipo de cambio**      | `feat`                                                                                                                           |
| **HU relacionada**      | HU-10 (Autenticación del Tutor), HU-25 (Gestión de Tutorías) <!-- inferido -->                                                   |
| **Rama**                | `feat/hu39-historial-tutorias`                                                                                                   |
| **Observación clave**   | El sistema debe garantizar que un tutor solo visualice sus propias tutorías mediante el filtrado por `tutorId` extraído del JWT. |

---

## 1. Resumen Ejecutivo

Esta funcionalidad permite a los tutores registrados en la plataforma acceder a un registro histórico de todas las sesiones de tutoría que han impartido. El objetivo es proporcionar una herramienta de seguimiento que incluya métricas clave de rendimiento (total de clases, materias y estudiantes únicos) y un listado detallado con soporte para paginación.

El sistema expone información crítica como el estado de la tutoría (Completada, Inasistencia), la modalidad (Presencial, Virtual) y el ingreso generado por cada sesión. Esta vista es fundamental para que el tutor gestione su historial laboral y financiero dentro de la aplicación.

---

## 2. Contexto y Problema

### 2.1 Contexto del negocio

Actualmente, los tutores no tienen una forma centralizada de revisar sus sesiones pasadas. Al finalizar una tutoría, la información queda almacenada en la base de datos pero no es accesible para el usuario, lo que dificulta el control de pagos y la preparación de futuras sesiones con los mismos estudiantes.

### 2.2 Problema a resolver

- Falta de visibilidad sobre el volumen de trabajo realizado.
- Dificultad para recordar detalles de sesiones pasadas (mensajes de estudiantes, precios acordados).
- Inexistencia de indicadores rápidos sobre el alcance del tutor (cuántos estudiantes ha impactado).

---

## 3. Objetivos

### 3.1 Objetivo principal

Implementar una vista de historial de tutorías que permita al tutor visualizar su actividad pasada de forma organizada, paginada y detallada.

### 3.2 Objetivos específicos

- Visualizar métricas acumuladas (Tutorías, Materias, Estudiantes).
- Listar tutorías con estados claros (Completada, Inasistencia).
- Permitir la navegación paginada para evitar sobrecarga de datos.
- Mostrar el detalle extendido de una tutoría en un modal sin recargar la página.

---

## 4. Alcance

### 4.1 Incluido en esta HU

- **Backend:** Endpoints para listado paginado y detalle por ID.
- **Seguridad:** Validación de propiedad del recurso (Ownership check).
- **Frontend:** Página de historial, tarjetas de métricas, lista de tutorías y modal de detalle.
- **Transformación de datos:** Mapeo de enums de base de datos a etiquetas amigables en español.

### 4.2 Fuera del alcance

| Elemento / Sección                      | Motivo de exclusión                                                       |
| --------------------------------------- | ------------------------------------------------------------------------- |
| Edición de tutorías pasadas             | Las tutorías históricas son registros inmutables por integridad de datos. |
| Exportación a PDF/Excel                 | Se considera una funcionalidad para una HU futura de reportería.          |
| Filtros avanzados (por fecha o materia) | La HU actual solo contempla paginación básica.                            |

---

## 5. Historia de Usuario

> **Como** tutor autenticado,
> **quiero** acceder a una sección de historial de mis tutorías impartidas,
> **para** revisar mi desempeño, ingresos generados y detalles de sesiones anteriores.

---

## 6. Criterios de Aceptación

### Escenario 1: Visualización del resumen de métricas

|              |                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Dado que** | El tutor ha impartido varias tutorías en el pasado                                                               |
| **Cuando**   | Navega a la ruta `/tutor/historial`                                                                              |
| **Entonces** | El sistema muestra 3 tarjetas superiores: "Tutorías completadas", "Materias impartidas" y "Estudiantes totales". |

### Escenario 2: Listado paginado de tutorías

|              |                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------- |
| **Dado que** | El tutor tiene más de 5 tutorías registradas                                              |
| **Cuando**   | Se carga la página inicial o se cambia de página en los controles                         |
| **Entonces** | El sistema muestra solo 5 registros por vez y permite navegar entre páginas (2, 3, etc.). |

### Escenario 3: Ver detalle de una tutoría

|              |                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dado que** | El tutor visualiza una tarjeta en el listado                                                                                                |
| **Cuando**   | Hace clic en la tarjeta                                                                                                                     |
| **Entonces** | Se abre un modal con la información completa: Estudiante, materia, fecha, hora, modalidad, precio, ubicación/link y mensaje del estudiante. |

---

## 7. Contrato de Datos (API)

### 1. Obtener Historial Paginado

`GET /api/tutorias/historial?page=1&limit=5`

**Response (HistoryResponseDto):**

```jsonc
{
  "summary": {
    "totalCompleted": 25,
    "totalSubjects": 4,
    "totalStudents": 18,
  },
  "paginatedData": {
    "items": [
      {
        "id": "uuid-123",
        "studentName": "Juan Pérez",
        "subjectName": "Cálculo Diferencial",
        "date": "2024-05-20",
        "status": "Completada", // Mapeado de COMPLETED
        "pricePerHour": "$15/h",
      },
    ],
    "total": 25,
    "page": 1,
    "lastPage": 5,
  },
}
```

### 2. Obtener Detalle por ID

`GET /api/tutorias/:id`

**Response (TutorialDetailDto):**

```jsonc
{
  "id": "uuid-123",
  "student": {
    "name": "Juan Pérez",
    "avatar": "url-image",
  },
  "subject": "Cálculo Diferencial",
  "date": "20 de mayo, 2024",
  "time": "14:00 - 15:00",
  "modality": "Virtual",
  "meetingLink": "https://zoom.us/j/...",
  "pricePerHour": "$15/h",
  "studentMessage": "Necesito ayuda con derivadas parciales.",
}
```

---

## 8. Arquitectura de Componentes

### Árbol de Componentes (Frontend)

```text
HistorialTutoriasPage (Server Component)
├── MetricCardsDisplay (Client Component) - Muestra totalizadores
├── TutorialHistoryList (Client Component) - Contenedor de lista
│   └── TutorialCard (Client Component) - Fila de la tabla/lista
└── PaginationControls (Client Component) - Botones de navegación
└── TutorialDetailModal (Client Component) - Vista detalle (Portal/Dialog)
```

### Flujo de Datos

1. El **Server Component** invoca una **Server Action**.
2. La Action añade el Token JWT de las cookies y llama al **Backend (NestJS)**.
3. El **Controller** valida el token y extrae el `tutorId`.
4. El **Service** ejecuta una consulta `TypeORM` con `JOIN` hacia `Student` y `Subject`, filtrando por el ID del tutor.
5. Los datos se transforman mediante DTOs y regresan al Frontend.

---

## 9. Casos de Error

| Situación                        | Comportamiento esperado                                                       |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Tutor intenta acceder a ID ajeno | El backend retorna `404 Not Found` o `403 Forbidden`.                         |
| ID de tutoría no existe          | El sistema muestra un mensaje "La tutoría no existe" en el modal.             |
| Error de red en paginación       | Se muestra un mensaje de error tipo "Toast" y no se actualiza la lista.       |
| Sesión expirada                  | El Guard de NestJS retorna `401 Unauthorized` y el frontend redirige a login. |

---

## 10. Pruebas

### 10.1 Funcionales (E2E)

| ID   | Descripción                                            | Resultado esperado                                                          |
| ---- | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| T-01 | Verificar que el conteo de métricas coincida con la DB | Los números en las tarjetas deben ser correctos.                            |
| T-02 | Navegar a la página 2                                  | La lista debe actualizarse con nuevos registros.                            |
| T-03 | Abrir y cerrar modal de detalle                        | El modal debe mostrar los datos correctos y cerrarse al dar clic en la "X". |

### 10.2 Unitarias

| Componente / Clase        | Caso de prueba                                              |
| ------------------------- | ----------------------------------------------------------- |
| `TutorialsService`        | Debe filtrar resultados estrictamente por `tutorId`.        |
| `TutorialsService`        | Debe mapear el enum `NO_SHOW` a la cadena `"Inasistencia"`. |
| `TutorHistoryQueryParams` | Debe fallar si `page` es menor a 1.                         |

---

## 11. Notas al Revisor

- **Seguridad:** No se confía en un `tutorId` enviado en el cuerpo de la petición; siempre se obtiene del `@Req() user` para evitar suplantación.
- **Rendimiento:** Se utiliza paginación a nivel de base de datos (`take` y `skip` en TypeORM) para manejar historiales de gran volumen sin degradar el performance.
- **UI:** La modalidad virtual debe mostrar el `meetingLink`, mientras que la presencial debe mostrar `location`. Esto se maneja mediante renderizado condicional en el `TutorialDetailModal`.
- **Enums:** Se han definido `TutorialStatus` y `TutorialModality` en el backend para evitar strings mágicos en la lógica de negocio. <!-- inferido -->

---
