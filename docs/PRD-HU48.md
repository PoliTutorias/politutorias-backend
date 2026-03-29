# PRD — HU-48-Registrar-inasistencia-del-estudiante

> **Versión:** 1.0 | **Estado:** En definición | **Fecha:** 24 de mayo de 2024

---

## Metadatos

| Campo                   | Valor                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Historia de Usuario** | HU-48                                                                                                          |
| **Título**              | Registrar inasistencia del estudiante                                                                          |
| **Tipo de cambio**      | `feat`                                                                                                         |
| **HU relacionada**      | HU-39 (Detalle), HU-43 (Completar)                                                                             |
| **Rama**                | `feat/HU48-registrar-inasistencia`                                                                             |
| **Observación clave**   | Solo se puede reportar inasistencia si la tutoría está en estado `SCHEDULED` y pertenece al tutor autenticado. |

---

## 1. Resumen Ejecutivo

Esta funcionalidad permite a los tutores marcar formalmente una tutoría como "Inasistencia" (`no-show`) cuando un estudiante no se presenta a la sesión programada. El objetivo es mantener la integridad de la información en el historial de tutorías, diferenciando las sesiones completadas de aquellas donde el servicio no se prestó por ausencia del alumno.

La implementación abarca desde la actualización del estado en la base de datos PostgreSQL mediante un endpoint seguro en NestJS, hasta la interacción en el frontend con modales de confirmación y actualizaciones en tiempo real de la interfaz mediante Server Actions y revalidación de rutas en Next.js.

---

## 2. Contexto y Problema

### 2.1 Contexto del negocio

Actualmente, el sistema permite programar y completar tutorías. Sin embargo, no existe un flujo para gestionar los casos donde el estudiante falta. Sin esta distinción, las métricas de cumplimiento y el historial del tutor no reflejan la realidad operativa, afectando potencialmente la reputación del estudiante o la gestión de cobros/pagos.

### 2.2 Problema a resolver

- Inexistencia de un estado de "Inasistencia" en el flujo de vida de la tutoría.
- Falta de mecanismos de validación para evitar que un tutor modifique tutorías ajenas.
- Necesidad de confirmación por parte del tutor para evitar cambios accidentales de estado.

---

## 3. Objetivos

### 3.1 Objetivo principal

Implementar el flujo completo para que un tutor reporte la inasistencia de un estudiante desde su historial de tutorías.

### 3.2 Objetivos específicos

- Crear un endpoint `POST` protegido que actualice el estado a `no-show`.
- Implementar modales de confirmación tanto en la vista de lista (tarjeta) como en el detalle de la tutoría.
- Asegurar que las tutorías marcadas como "Inasistencia" pasen a un modo de solo lectura.
- Garantizar la consistencia de datos con las entidades y enums existentes.

---

## 4. Alcance

### 4.1 Incluido en esta HU

- Actualización de la entidad `Tutorial` para soportar el estado `no-show`.
- Endpoint `POST /api/tutorias/:id/inasistencia` con validación de propiedad y estado.
- Lógica de Server Action para invocar el backend y revalidar el path `/tutor/historial`.
- Componentes de UI: `ConfirmModal` y estados visuales en `TutoriaCard`.
- Mapeo de datos en el servicio para transformar enums de base de datos a etiquetas de interfaz (`INASISTENCIA`).

### 4.2 Fuera del alcance

| Elemento / Sección                       | Motivo de exclusión                                               |
| ---------------------------------------- | ----------------------------------------------------------------- |
| Notificaciones automáticas al estudiante | Se tratará en una HU de notificaciones global. <!-- inferido -->  |
| Penalizaciones económicas                | Requiere integración con pasarela de pagos, fuera de este sprint. |
| Reprogramación desde inasistencia        | El flujo de inasistencia es terminal para la sesión actual.       |

---

## 5. Historia de Usuario

> **Como** Tutor,
> **quiero** registrar la inasistencia de un estudiante,
> **para** que el estado de la tutoría refleje que el estudiante no se presentó y mantener mi historial actualizado.

---

## 6. Criterios de Aceptación

### Escenario 1: Mostrar Modal de Confirmación desde Tarjeta

|              |                                                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Dado que** | El tutor está en la página de `/tutor/historial` y visualiza una tutoría con estado "SIN_CONFIRMAR" (`SCHEDULED`)       |
| **Cuando**   | Hace clic en el botón o acción de 'Inasistencia' en la tarjeta                                                          |
| **Entonces** | El sistema debe mostrar un modal de confirmación con el mensaje "¿Estás seguro de que deseas reportar la inasistencia?" |

### Escenario 2: Reportar Inasistencia Exitosamente

|              |                                                                                                                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dado que** | El modal de confirmación está abierto                                                                                                                                                                                 |
| **Cuando**   | El tutor confirma la acción haciendo clic en "Sí, reportar inasistencia"                                                                                                                                              |
| **Entonces** | El sistema invoca el backend, cambia el estado a `no-show`, cierra el modal, revalida la vista y muestra un mensaje de éxito (Toast). La tarjeta ahora muestra la etiqueta "Inasistencia" y oculta botones de acción. |

### Escenario 3: Ver Detalles de Tutoría con Inasistencia (Solo lectura)

|              |                                                                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dado que** | Una tutoría ya tiene el estado "Inasistencia"                                                                                                 |
| **Cuando**   | El tutor abre el modal de detalles de esa tutoría                                                                                             |
| **Entonces** | El sistema muestra la información en modo lectura, el estado aparece con icono rojo de inasistencia y solo el botón "Cerrar" está habilitado. |

---

## 7. Contrato de Datos (API)

### Endpoint expuesto

`POST /api/tutorias/:id/inasistencia`

### Campos utilizados por esta HU

```jsonc
{
  "success": true,
  "message": "Inasistencia del estudiante registrada con éxito.",
  "data": {
    "id": "uuid-v4",
    "status": "no-show", // Estado actualizado en DB
    "updatedAt": "2024-05-24T...",
  },
}
```

### Mapeo de Estados (DTO)

| Valor DB (Enum) | Valor DTO (Frontend) |
| --------------- | -------------------- |
| `scheduled`     | `SIN_CONFIRMAR`      |
| `no-show`       | `INASISTENCIA`       |

---

## 8. Arquitectura de Componentes

### Estructura de Capas (Backend)

```text
src/tutorias/
├── entities/
│   └── tutorial.entity.ts (Define TutorialStatus.NO_SHOW)
├── dto/
│   ├── report-inasistencia.dto.ts
│   └── tutoria-detalle.dto.ts
├── tutorias.controller.ts (Endpoint POST con @UseGuards)
└── tutorias.service.ts (Lógica de validación y persistencia)
```

### Árbol de Componentes (Frontend)

```text
HistorialPage (Server Component)
└── TutoriaCard (Client Component)
    ├── DetalleModal (Client Component)
    └── ConfirmModal (Client Component)
        └── reportarInasistenciaSA (Server Action)
```

---

## 9. Casos de Error

| Situación                      | Comportamiento esperado                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Tutoría no encontrada          | Retorna `404 Not Found`.                                                                                 |
| Tutoría pertenece a otro tutor | Retorna `404 Not Found` (por seguridad no se confirma existencia).                                       |
| Estado no es `SCHEDULED`       | Retorna `400 BadRequest` con mensaje: "Solo se puede reportar inasistencia para tutorías sin confirmar". |
| Error de red o base de datos   | Retorna `500 Internal Server Error` y el Toast muestra mensaje de error al usuario.                      |

---

## 10. Pruebas

### 10.1 Funcionales (E2E)

| ID   | Descripción                                             | Resultado esperado                                                                     |
| ---- | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| T-01 | Intentar marcar inasistencia en tutoría ya completada   | El botón debe estar oculto o la API debe rechazarlo con 400.                           |
| T-02 | Flujo completo desde tarjeta hasta actualización visual | La tarjeta cambia su etiqueta de "Sin confirmar" a "Inasistencia" sin recargar página. |
| T-03 | Cancelar en el modal de confirmación                    | No se realiza ninguna llamada a la API y el modal se cierra.                           |

### 10.2 Unitarias

| Componente / Clase             | Caso de prueba                                                       |
| ------------------------------ | -------------------------------------------------------------------- |
| `TutoriasService`              | Debe lanzar `BadRequestException` si el estado es `completed`.       |
| `TutoriasService`              | Debe asegurar que el `tutorId` coincida con el de la entidad.        |
| `mapTutorialStatusToDtoStatus` | Debe retornar `INASISTENCIA` cuando recibe `TutorialStatus.NO_SHOW`. |

---

## 11. Notas al Revisor

- **Seguridad:** Se implementó la validación de propiedad en el `TutoriasService`. No basta con recibir el `id` de la tutoría; se filtra activamente por el `id` del tutor extraído del token JWT (`req.user.id`).
- **Consistencia:** Se utiliza la entidad `Tutorial` de TypeORM para mantener coherencia con las HU-39 y HU-43.
- **UX:** Se ha decidido que si el modal de confirmación se abre desde el detalle, al confirmar se cierren ambos modales para limpiar la interfaz y mostrar el estado actualizado en la lista principal.
- **Lógica de Negocio:** La inasistencia es irreversible una vez marcada, similar a una cancelación o finalización. <!-- verificar con el equipo -->
