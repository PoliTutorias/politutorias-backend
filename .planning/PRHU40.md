**Titulo:**
[HU40] Implementar historial de tutorías recibidas por el estudiante

**Resumen:**
Este Pull Request implementa la funcionalidad backend para que un estudiante autenticado pueda visualizar el historial de las tutorías que ha recibido, así como ver el detalle de una, incluyendo su valoración (reseña). Se implementaron dos nuevos endpoints (`GET /api/tutorias/estudiante/historial` y `GET /api/tutorias/estudiante/:id`) protegidos únicamente por `JwtAuthGuard` y se creó la entidad `Review` para manejar las calificaciones de las tutorías completadas. Se verificó que todas las políticas de linters y coverage se cumplan satisfactoriamente (pasando la revisión de los flujos de CI/CD).

**Historias de Usuario cubiertas:**
- HU40 - Historial de tutorías recibidas

**Tareas implementadas:**
- Tarea 29: Crear entidad `Review` con relación OneToOne a `SolicitudEntity`.
- Tarea 30: Definir los DTOs para la vista estudiantil (`HistorialEstudianteQueryDto`, `TutoriaDetalleEstudianteDTO`, etc.).
- Tarea 34: Registrar `ReviewEntity` en `TutoriasModule` e inyectar el seeder correspondiente (`historial-estudiante.seed.ts`).
- Tarea 32: Implementar el método `findHistorialByStudent()` en `TutoriasService` filtrando por las tutorías en estado `COMPLETADA` y `NO_SHOW`.
- Tarea 33: Implementar el método de detalle `findOneTutoriaDetalle()` en `TutoriasService` para retornar datos del tutor, la sesión y la reseña si existiese.
- Tarea 31: Implementar endpoints y decoradores Swagger en `TutoriasController`.

**Criterios de Aceptación Cumplidos:**
- **CA1 (Visualización de Historial Pagina):** El endpoint `GET /api/tutorias/estudiante/historial` retorna las tutorías del estudiante que están en estado completada o inasistencia de forma ordenada y paginada (retornando la info del tutor aplicable, tema, costo y estado respectivo).
- **CA2 (Visualización de Detalle y Reseña):** El endpoint `GET /api/tutorias/estudiante/:id` carga con relación a la información de la oferta, su respectivo tutor generándole un avatar, todos los datos de la fecha/enlaces de la reunión y la reseña asociada (de haber sido calificada la sesión).
- **CA (Privacidad/Autorización):** Los endpoints extraen el `studentId` indirectamente a partir del token JWT para proteger el acceso a otras tutorías ajenas y lanza error `404` si hay un desajuste.

**Archivos Clave modificados/creados:**
- `src/tutorias/entities/review.entity.ts` — Entidad de base de datos de reseñas (rating + comment) ligada al `id` de solicitud.
- `src/tutorias/dto/historial-estudiante-query.dto.ts` y relacionados — DTOs con su debida descripción en Swagger y transformaciones numéricas/paginación para la lista y el detalle del estudiante.
- `src/tutorias/tutorias.service.ts` — Inyección de los repositorios de `Tutor` y `ReviewEntity`. Creación de funciones QueryBuilder para hacer un LeftJoin optimizado buscando `findHistorialByStudent`.
- `src/tutorias/tutorias.controller.ts` — Mapeo de nuevas rutas bajo el controlador base, utilizando `@UseGuards(JwtAuthGuard)` exclusivamente para que funcione sin necesidad del perfil del Tutor.
- `src/database/seeds/historial-estudiante.seed.ts` — Información dummy para alimentar tutorías marcadas como completadas/inasistencia preparadas para listarse en esta interfaz al realizar pruebas en el front.

**Notas:**
- Se configuró la ruta del controlador *antes* del comodín de identificaciones (`:id`) para evitar conflictos en las sub-rutas anidades.
- Todos los Unit Tests en `tutorias.service.spec.ts` referenciando las inserciones de las nuevas dependencias en el Factory Module fueron refactorizados y pasan exitosamente el TDD garantizando compatibilidad retroactiva. 
- Los Linters han corrido de manera exitosa y el backend ya es completamente apto para construirse y desplegarse a las respectivas etapas del Pipeline de Github Actions AWS.
