# PRD — HU-33 - Ver solicitudes de tutoría enviadas

> **Versión:** 1.0 | **Estado:** En definición | **Fecha:** 24 de Mayo de 2024

---

## Metadatos

| Campo                   | Valor                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Historia de Usuario** | HU-33                                                                                                                           |
| **Título**              | Ver solicitudes de tutoría enviadas                                                                                             |
| **Tipo de cambio**      | `feat`                                                                                                                          |
| **HU relacionada**      | HU-Tutor (Gestión de solicitudes recibidas) <!-- inferido -->                                                                   |
| **Rama**                | `feat/HU33-ver-solicitudes-enviadas`                                                                                            |
| **Observación clave**   | Se implementa una lógica de mapeo donde el estado frontend `RESPONDIDA` agrupa los estados de backend `ACEPTADA` y `RECHAZADA`. |

---

## 1. Resumen Ejecutivo

La funcionalidad "Ver solicitudes de tutoría enviadas" permite a los estudiantes realizar un seguimiento detallado de todas las peticiones de apoyo académico que han extendido a diversos tutores dentro de la plataforma. El objetivo principal es centralizar en una sola vista el historial de interacciones, permitiendo al usuario conocer el estado actual de sus trámites (Pendiente, Aceptada, Rechazada, Expirada) de manera ágil y organizada.

Esta característica es crítica para la retención del usuario, ya que reduce la incertidumbre tras enviar una solicitud. Además de la visualización, el sistema permite la gestión activa de las solicitudes mediante la cancelación de servicios, asegurando que el estudiante mantenga el control sobre sus compromisos y horarios.

---

## 2. Contexto y Problema

### 2.1 Contexto del negocio

Actualmente, los estudiantes envían solicitudes pero carecen de un panel centralizado para monitorearlas. Al avanzar en el flujo de usuario hacia una fase de post-solicitud, es necesario que el estudiante pueda verificar si un tutor ha respondido para proceder con el pago o la asistencia a la sesión.

### 2.2 Problema a resolver

- **Falta de visibilidad:** El estudiante no tiene registro de a cuántos tutores ha contactado.
- **Incertidumbre de estados:** No hay claridad sobre por qué una solicitud fue rechazada o dónde debe conectarse si fue aceptada.
- **Imposibilidad de desistir:** Los usuarios no pueden cancelar solicitudes por errores o imprevistos de forma autónoma.

---

## 3. Objetivos

### 3.1 Objetivo principal

Proporcionar una interfaz administrativa para el estudiante donde pueda listar, filtrar y gestionar el detalle de sus solicitudes de tutoría enviadas.

### 3.2 Objetivos específicos

- Implementar un sistema de filtrado por estados (Todas, Pendientes, Respondidas, Expiradas).
- Desplegar la información clave de la tutoría (Tutor, Materia, Fecha, Modalidad, Precio) en tarjetas de fácil lectura.
- Habilitar un modal dinámico que muestre información específica según el estado (ej: enlaces para tutorías aceptadas, motivos para rechazos).
- Permitir la cancelación de solicitudes en estados `PENDIENTE` o `ACEPTADA`.

---

## 4. Alcance

### 4.1 Incluido en esta HU

- **Backend:** Endpoints para listado paginado, detalle por ID y patch de cancelación.
- **Frontend:** Página de "Mis Solicitudes", componentes de filtrado (Tabs), tarjetas de resumen y componente de paginación.
- **Lógica de estados:** Manejo de estados `PENDIENTE`, `ACEPTADA`, `RECHAZADA`, `EXPIRADA` y `CANCELADA`.
- **Seguridad:** Validación de propiedad de la solicitud (un estudiante solo ve sus propias solicitudes).

### 4.2 Fuera del alcance

| Elemento / Sección               | Motivo de exclusión                                                     |
| -------------------------------- | ----------------------------------------------------------------------- |
| Gestión de Solicitudes Recibidas | Corresponde al rol del Tutor (otra HU).                                 |
| Pago de Tutoría                  | Se manejará en una HU de integración con pasarela de pagos.             |
| Edición de Solicitud             | Solo se permite lectura y cancelación; no edición de mensajes o fechas. |

---

## 5. Historia de Usuario

> **Como** estudiante,
> **quiero** ver las solicitudes que he enviado,
> **para** saber qué servicios he solicitado y conocer su estado actual.

---

## 6. Criterios de Aceptación

### Escenario 1: Visualización y Filtrado de la Lista

|              |                                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Dado que** | El estudiante tiene 16 solicitudes en total y está en la página "Mis Solicitudes"                                                                                        |
| **Cuando**   | Visualiza la lista por defecto                                                                                                                                           |
| **Entonces** | Debe ver las primeras 5 solicitudes, ordenadas por fecha de creación desc., con un componente de paginación `< 1 2 3 4 >` y etiquetas de estado con colores distintivos. |

### Escenario 2: Detalle de Solicitud Aceptada

|              |                                                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dado que** | Una solicitud tiene el estado `ACEPTADA`                                                                                                                                                                |
| **Cuando**   | El estudiante hace clic en la tarjeta de la solicitud                                                                                                                                                   |
| **Entonces** | El sistema abre un modal que muestra el nombre del tutor, avatar, materia, horarios propuestos y el campo "Lugar/Enlace" (dependiendo de la modalidad), además del botón "Cancelar Tutoría" habilitado. |

### Escenario 3: Detalle de Solicitud Rechazada

|              |                                                                                                                 |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| **Dado que** | Una solicitud tiene el estado `RECHAZADA`                                                                       |
| **Cuando**   | El estudiante abre el detalle                                                                                   |
| **Entonces** | El sistema debe mostrar obligatoriamente el campo "MOTIVO DE RECHAZO" enviado por el tutor y el botón "Cerrar". |

---

## 7. Contrato de Datos (API)

### Endpoints principales

#### 1. Listar solicitudes (Paginado)

`GET /api/solicitudes?status=PENDIENTE&page=1&limit=5`

**Campos utilizados:**

```jsonc
{
  "items": [
    {
      "id": "uuid",
      "tutorAvatarUrl": "string",
      "tutorName": "string",
      "subject": "string",
      "date": "ISO8601", // Fecha representativa
      "modality": "Virtual | Presencial",
      "pricePerHour": 0.0,
      "status": "PENDIENTE | ACEPTADA | RECHAZADA | EXPIRADA | CANCELADA",
    },
  ],
  "total": 16,
  "page": 1,
  "limit": 5,
}
```

#### 2. Cancelar solicitud

`PATCH /api/solicitudes/:id/cancel`

**Request Body:**

```jsonc
{
  "reason": "Opcional: motivo de la cancelación",
}
```

---

## 8. Arquitectura de Componentes

### Estructura de Capas (Backend NestJS)

```text
src/solicitudes/
├── dto/
│   ├── solicitud-list-params.dto.ts      // Validación de query params
│   ├── solicitud-detail.dto.ts           // Estructura para modal
│   └── cancel-solicitud.dto.ts           // Validación de body para patch
├── entities/
│   └── solicitud.entity.ts               // Mapeo TypeORM (PostgreSQL)
├── solicitudes.controller.ts             // Decoradores JWT y Rutas
└── solicitudes.service.ts                // Lógica de negocio y mapeo de estados
```

### Flujo de datos

1.  **Frontend (Next.js):** Invoca un `Server Action` que consume la API de NestJS.
2.  **Controller:** Valida el JWT y extrae el `studentId`.
3.  **Service:** Realiza un `createQueryBuilder` con `leftJoinAndSelect` hacia las tablas de Tutor y Materia.
4.  **Database:** Retorna registros filtrados por `studentId` y estado.

---

## 9. Casos de Error

| Situación                       | Comportamiento esperado                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| Solicitud no encontrada         | Retornar `404 Not Found`.                                                              |
| Intento de ver solicitud ajena  | Retornar `404` o `403 Forbidden` (seguridad por ID).                                   |
| Cancelar solicitud ya rechazada | Retornar `400 BadRequest` con mensaje: "No se puede cancelar una solicitud rechazada". |
| Parámetros de página inválidos  | El `ValidationPipe` retorna `400` (mínimo página 1).                                   |

---

## 10. Pruebas

### 10.1 Funcionales (E2E)

| ID   | Descripción              | Resultado esperado                                                       |
| ---- | ------------------------ | ------------------------------------------------------------------------ |
| T-01 | Filtrar por "Respondida" | Se muestran solo solicitudes Aceptadas y Rechazadas.                     |
| T-02 | Paginación               | Al cambiar a la página 2, se cargan los siguientes 5 registros.          |
| T-03 | Cancelación              | El estado de la tarjeta cambia a `CANCELADA` tras confirmar en el modal. |

### 10.2 Unitarias

| Componente / Clase   | Caso de prueba                                                   |
| -------------------- | ---------------------------------------------------------------- |
| `SolicitudesService` | Validar que el mapeo `RESPONDIDA` incluya ambos sub-estados.     |
| `SolicitudEntity`    | Validar que los campos de moneda (precio) mantengan 2 decimales. |

---

## 11. Notas al Revisor

- **Mapeo de Estados:** Se debe verificar que la lógica de negocio en `SolicitudesService.findAll` maneje correctamente la interpretación de `RESPONDIDA`. El frontend envía este término, pero el backend debe buscar registros donde `status IN ('ACEPTADA', 'RECHAZADA')`.
- **Paginación:** Por requerimiento de la HU, el límite por defecto es de 5 registros. Si hay menos de 6, el componente de paginación no debería renderizarse o debería estar deshabilitado.
- **Seguridad:** El `studentId` nunca debe viajar en el cuerpo o query de la petición desde el cliente; se extrae estrictamente del JWT en el servidor para evitar suplantación de identidad.
- **Cancelación:** La cancelación utiliza el campo `rejectionReason` de la entidad para guardar el motivo, permitiendo reutilizar la columna existente. <!-- verificar con el equipo si se prefiere una columna separada `cancellationReason` -->
