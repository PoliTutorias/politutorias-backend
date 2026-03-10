# Product Requirements Document
## HU-32 · Ver Detalles de la Oferta
**PoliTutorías – Plataforma de Gestión de Tutorías**

---

| Campo | Valor |
|---|---|
| **ID Historia** | HU-32 |
| **Estimación** | 5 Story Points |
| **Versión** | 1.0 |
| **Estado** | En Desarrollo |
| **Módulo** | Ofertas de Tutoría |
| **Fecha** | 2026 |
| **Autor** | Equipo Producto |
| **Revisado por** | Tech Lead |

---

## 1. Historia de Usuario

| Campo | Descripción |
|---|---|
| **Rol** | Estudiante de la plataforma PoliTutorías |
| **Acción** | Quiero ver los detalles completos de una oferta de tutoría |
| **Beneficio** | Para tomar una decisión informada sobre contratar al tutor |
| **Declaración completa** | *Como estudiante, quiero ver los detalles de una oferta para tomar una decisión informada.* |

---

## 2. Descripción Funcional

Esta historia de usuario cubre la pantalla de detalle de una oferta de tutoría. Cuando el estudiante hace clic sobre una tarjeta de oferta en el listado de tutorías, el sistema muestra una vista completa con toda la información relevante de la oferta para facilitar la toma de decisión.

La pantalla se accede directamente desde la sección de búsqueda de tutorías y permite al estudiante visualizar el contenido de la oferta sin necesidad de autenticación adicional.

---

## 3. Alcance y Delimitaciones

### ✅ 3.1 Incluido en esta HU

- Pantalla de detalle de oferta accesible al hacer clic en una tarjeta de oferta
- Cabecera con botón **'Volver'** (izquierda) y logo **'PoliTutorías'** (derecha)
- Sección principal: icono de libro + título de la materia, modalidad, descripción de la clase
- Sección de **Categorías** con tags visuales
- Sección de **Disponibilidad Semanal** con horarios por día
- Panel lateral con **Precio por hora**
- Funcionalidad del botón 'Volver' para regresar al listado

### ❌ 3.2 Excluido de esta HU (por observación explícita)

- Sección **"Sobre el Tutor"** (nombre, carrera, semestre, rating, descripción)
- Sección **"Experiencia"** del tutor
- Botón / sección **"Contactar por WhatsApp"**
- Sistema de reseñas o calificaciones visible en esta pantalla
- Funcionalidad de agendamiento o contratación directa desde esta vista

---

## 4. Referencia de Prototipo

| Campo | Detalle |
|---|---|
| **Frame** | E. Detalle Oferta |
| **Flujo de entrada** | Estudiante hace clic en TarjetaOferta desde `/ofertas` |
| **Ruta** | `/ofertas/[id]` → `DetallesOfertaPage` |
| **Flujo de salida** | Clic en 'Volver' → regresa a `/ofertas` |

**Estructura visual de referencia:**

```
┌─────────────────────────────────────────────────────────────┐
│  CABECERA:  [ ← Volver ]              [ PoliTutorías logo ] │
├──────────────────────────────────────┬──────────────────────┤
│  SECCIÓN PRINCIPAL (2/3)             │  PANEL LATERAL (1/3) │
│  📖 Título Oferta  |  Modalidad      │                      │
│  Descripción de la clase...          │  Precio por hora     │
│  Categorías: [tag1] [tag2]           │  $10.00              │
│  Disponibilidad Semanal:             │                      │
│    Lunes      14:00 - 15:00          │                      │
│    Miércoles  14:00 - 15:00          │                      │
│    Viernes    09:00 - 10:00          │                      │
└──────────────────────────────────────┴──────────────────────┘
```

---

## 5. Criterios de Aceptación

### Escenario 1 – Visualización de Detalles de Oferta

| | |
|---|---|
| **DADO QUE** | El estudiante está en la sección de búsqueda de tutorías (`/ofertas`) |
| **CUANDO** | Hace clic en una tarjeta de oferta |
| **ENTONCES** | Se carga la pantalla de detalle mostrando: |

- Cabecera: botón **'Volver'** a la izquierda y logo **'PoliTutorías'** a la derecha
- Icono de libro junto al título de la materia (ej. `Cálculo Vectorial`)
- Modalidad de la clase (ej. `Virtual y Presencial`)
- Descripción de la clase
- Sección **'Categorías'** con tags: `Matemática` y `Formación Básica`
- Sección **'Disponibilidad Semanal'**: Lunes 14:00–15:00, Miércoles 14:00–15:00, Viernes 09:00–10:00
- Panel lateral con **'Precio por hora'**: `$10`

### Escenario 2 – Regreso a la Lista de Ofertas

| | |
|---|---|
| **DADO QUE** | El estudiante está visualizando los detalles de una oferta de tutoría |
| **CUANDO** | Hace clic en el botón **'Volver'** en la cabecera superior izquierda |
| **ENTONCES** | Es redirigido a la pantalla principal de listado de ofertas (`/ofertas`) |

---

## 6. Datos de Prueba / Ejemplo

| Campo | Valor de Ejemplo |
|---|---|
| **Título de la oferta** | Cálculo Vectorial |
| **Modalidad** | Virtual y Presencial |
| **Categorías** | Matemática, Formación Básica |
| **Disponibilidad** | Lunes 14:00–15:00 · Miércoles 14:00–15:00 · Viernes 09:00–10:00 |
| **Precio por hora** | $10.00 |

---

## 7. Reglas de Negocio

- **RN-01:** La pantalla de detalle es de solo lectura; el estudiante no puede editar información.
- **RN-02:** Si el ID de la oferta no existe, el sistema debe mostrar una página de error 404.
- **RN-03:** No se requiere autenticación para visualizar los detalles de una oferta (endpoint público).
- **RN-04:** Las secciones *"Sobre el Tutor"*, *"Experiencia"* y *"Contactar por WhatsApp"* **NO deben renderizarse** en esta vista.
- **RN-05:** El precio se muestra en dólares (USD) con dos decimales.
- **RN-06:** Los horarios de disponibilidad se muestran en formato `HH:MM - HH:MM`.

---

## 8. Dependencias y Relaciones

| Tipo | Referencia | Descripción |
|---|---|---|
| Prerrequisito | HU-Listado de Ofertas | La lista de ofertas debe existir para navegar al detalle |
| API Backend | `GET /api/ofertas/:id` | Endpoint que retorna el `DetallesOfertaDto` |
| Componente | `TarjetaOferta` | Componente de entrada que dispara la navegación |
| Ruta Next.js | `/ofertas/[id]/page.tsx` | Server Component que obtiene los datos y renderiza la vista |

---

## 9. Notas y Observaciones Adicionales

> ⚠️ **Observación de la HU (Restricción del Equipo de Producto)**
>
> Se debe descartar la sección completa *"Sobre el Tutor"*, *"Experiencia"* y *"Contactar por WhatsApp"*.
> El enfoque estricto de esta pantalla es mostrar únicamente los datos de la oferta:
> - Título de la oferta
> - Modalidad
> - Categoría
> - Disponibilidad Semanal
> - Precio por hora

El backend debe retornar los datos del tutor en el DTO (`DetallesOfertaDto`) ya que otras HUs pueden necesitarlos, pero el frontend de esta HU los descarta en la capa de presentación.

El componente `TarjetaOferta` es el punto de entrada y debe pasar el `offerId` al navegar hacia `/ofertas/[id]`.