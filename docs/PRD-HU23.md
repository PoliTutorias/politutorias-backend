# PRD — HU23-Rechazar solicitud de tutoría

> **Versión:** 1.0 | **Estado:** En definición | **Fecha:** 24 de Mayo, 2024

---

## Metadatos

| Campo                   | Valor                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **Historia de Usuario** | HU23                                                                                      |
| **Título**              | Rechazar solicitud de tutoría                                                             |
| **Tipo de cambio**      | `feat`                                                                                    |
| **HU relacionada**      | HU33 (Cancelación de tutoría) <!-- inferido -->                                           |
| **Rama**                | `feat/hu23-rechazar-solicitud`                                                            |
| **Observación clave**   | Validación estricta de 300 caracteres en comentarios y restricción de estado `PENDIENTE`. |

---

## 1. Resumen Ejecutivo

La funcionalidad de **Rechazar solicitud de tutoría** permite a los tutores gestionar de manera eficiente su flujo de trabajo, descartando aquellas propuestas de tutoría que no pueden o no desean impartir. A través de una interfaz intuitiva (modal), el tutor podrá seleccionar un motivo de rechazo estandarizado o proporcionar una razón personalizada.

Este proceso asegura que el sistema mantenga la integridad de los datos al mover la solicitud de la bandeja de "Pendientes" a "Respondidas", notificando indirectamente al estudiante y actualizando los indicadores de gestión del tutor en tiempo real mediante Server Actions y revalidación de rutas.

---

## 2. Contexto y Problema

### 2.1 Contexto del negocio

Actualmente, el tutor recibe múltiples solicitudes de estudiantes en su bandeja de entrada. Para mantener una comunicación clara y una bandeja organizada, el tutor necesita una forma de cerrar el ciclo de vida de una solicitud que no será procesada, sin que esta quede en un estado ambiguo de "pendiente" indefinidamente.

### 2.2 Problema a resolver

- Falta de un mecanismo formal para declinar solicitudes de tutoría.
- Inexistencia de retroalimentación para el estudiante sobre por qué una solicitud no fue aceptada.
- Acumulación de solicitudes inactivas en la bandeja de "Pendientes".

---

## 3. Objetivos

### 3.1 Objetivo principal

Implementar el flujo completo (Frontend y Backend) para que un tutor pueda rechazar una solicitud de tutoría asignada, garantizando la persistencia del motivo del rechazo.

### 3.2 Objetivos específicos

- Proveer un modal de rechazo con opciones predefinidas.
- Validar la propiedad de la solicitud (solo el tutor asignado puede rechazarla).
- Garantizar que solo solicitudes en estado `PENDIENTE` puedan ser rechazadas.
- Actualizar la interfaz de usuario y los contadores de estado de forma reactiva.

---

## 4. Alcance

### 4.1 Incluido en esta HU

- **Backend:** Endpoint `PATCH /api/solicitudes/:id/reject`, DTO de validación, lógica de servicio y actualización de entidad en DB.
- **Frontend:** Modal de rechazo, integración con `rechazarSolicitudAction`, manejo de estados del formulario (Zod) y `revalidatePath`.
- **Seguridad:** Verificación de rol de tutor y propiedad del recurso mediante JWT.

### 4.2 Fuera del alcance

| Elemento / Sección         | Motivo de exclusión                                               |
| -------------------------- | ----------------------------------------------------------------- |
| Notificaciones Push/Email  | Se manejará en una HU de notificaciones global. <!-- inferido --> |
| Contrapropuesta de horario | El rechazo es una acción terminal para esta solicitud.            |

---

## 5. Historia de Usuario

> **Como** tutor,
> **quiero** rechazar una solicitud de tutoría,
> **para** descartar las tutorías que no me convienen o no puedo impartir de manera formal.

---

## 6. Criterios de Aceptación

### Escenario 1: Rechazo con Motivo Predefinido Exitoso

|              |                                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **Dado que** | El tutor ha iniciado sesión y tiene una solicitud en estado `PENDIENTE`.                                                          |
| **Cuando**   | Selecciona un motivo predefinido (ej: "Enfermedad") y confirma el rechazo.                                                        |
| **Entonces** | El sistema actualiza el estado a `RECHAZADA`, registra la fecha en `respondedAt` y mueve la solicitud a la pestaña "Respondidas". |

### Escenario 2: Rechazo con Motivo 'Otro' y Comentario

|              |                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------- |
| **Dado que** | El tutor selecciona la opción "Otro" en el modal.                                                  |
| **Cuando**   | Ingresa un comentario opcional y confirma.                                                         |
| **Entonces** | El sistema guarda el `rejectionReason` como "Otro" y el `rejectionComment` con el texto ingresado. |

### Escenario 3: Bloqueo por Límite de Caracteres

|              |                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------- |
| **Dado que** | El tutor está escribiendo en el campo de comentario.                                           |
| **Cuando**   | El texto alcanza los 300 caracteres.                                                           |
| **Entonces** | El sistema bloquea la entrada de más caracteres y muestra un indicador visual (ej: "300/300"). |

### Escenario 4: Cancelación del Proceso

|              |                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| **Dado que** | El modal de rechazo está abierto.                                                                    |
| **Cuando**   | El tutor hace clic en "Cancelar".                                                                    |
| **Entonces** | El modal se cierra, no se realizan cambios en la base de datos y la solicitud permanece `PENDIENTE`. |

---

## 7. Contrato de Datos (API)

### Endpoint expuesto

`PATCH /api/solicitudes/:id/reject`

### Campos utilizados por esta HU

```jsonc
{
  "reason": "Conflicto de horarios con otra tutoría", // Enum: RejectionReason
  "comment": "Tengo una clase presencial a esa misma hora.", // Opcional, máx 300 chars
}
```

### Respuesta Exitosa (200 OK)

```jsonc
{
  "success": true,
  "message": "Solicitud rechazada exitosamente.",
  "data": {
    "id": "uuid",
    "status": "RECHAZADA",
    "rejectionReason": "...",
    "rejectionComment": "...",
    "respondedAt": "2023-10-26T10:30:00.000Z",
  },
}
```

---

## 8. Arquitectura de Componentes

### Estructura de Capas (Frontend/Backend)

```text
/apps/web
  ├── actions/rechazar-solicitud.action.ts  # Server Action con validación Zod
  └── components/tutor/
      ├── SolicitudTutoriaCard.tsx          # Trigger del modal
      └── RechazarSolicitudModal.tsx        # UI de captura de motivo

/apps/api (NestJS)
  ├── solicitudes/
      ├── solicitudes.controller.ts         # Endpoint PATCH, JwtAuthGuard
      ├── solicitudes.service.ts            # Lógica: status check & ownership
      ├── dto/reject-solicitud.dto.ts       # Validation (class-validator)
      └── entities/solicitud.entity.ts      # TypeORM mapping
```

### Flujo de datos

1. El **Tutor** interactúa con el `RechazarSolicitudModal`.
2. Se ejecuta la **Server Action**, que valida el input localmente.
3. Se realiza la petición **PATCH** al backend.
4. El **Service** valida que la solicitud pertenezca al `tutorId` del JWT y que el estado sea `PENDIENTE`.
5. La **DB** persiste los cambios.
6. `revalidatePath` refresca la UI del tutor, moviendo la card de columna.

---

## 9. Casos de Error

| Situación                              | Comportamiento esperado                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Solicitud ya aceptada/rechazada        | Retorna `400 Bad Request` con mensaje "Solo se pueden rechazar solicitudes en estado PENDIENTE". |
| Tutor intenta rechazar solicitud ajena | Retorna `403 Forbidden` tras validar `tutorId` contra el registro en DB.                         |
| ID de solicitud inexistente            | Retorna `404 Not Found`.                                                                         |
| Comentario > 300 caracteres            | Bloqueo en Frontend y `400 Bad Request` en Backend (class-validator).                            |

---

## 10. Pruebas

### 10.1 Funcionales (E2E)

| ID   | Descripción                               | Resultado esperado                                                              |
| ---- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| T-01 | Rechazo exitoso con motivo "Enfermedad"   | Solicitud desaparece de Pendientes, aparece en Respondidas, contador actualiza. |
| T-02 | Intento de rechazo sin seleccionar motivo | Botón "Confirmar" permanece deshabilitado.                                      |
| T-03 | Cancelación de modal                      | La solicitud no cambia de estado.                                               |

### 10.2 Unitarias

| Componente / Clase    | Caso de prueba                                                |
| --------------------- | ------------------------------------------------------------- |
| `SolicitudesService`  | Debe lanzar `ForbiddenException` si el `tutorId` no coincide. |
| `RejectSolicitudDto`  | Debe fallar si `reason` no pertenece al Enum definido.        |
| `Zod Schema (Action)` | Debe validar que `comment` sea string y <= 300 chars.         |

---

## 11. Notas al Revisor

- Se agregó el campo `respondedAt` a la entidad para permitir auditoría y reportes de tiempo de respuesta en el futuro.
- El guardia `TutorAuthGuard` es mandatorio para evitar que un estudiante o administrador intente rechazar solicitudes a través del endpoint público.
- La lógica de negocio asegura que si el motivo no es "Otro", el `rejectionComment` se fuerce a `null` en la base de datos para evitar ruidos de datos previos.
