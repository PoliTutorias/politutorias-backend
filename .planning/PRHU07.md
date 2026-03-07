**Titulo:**
[HU07] Implementar consulta de disponibilidad del tutor (Backend)

**Resumen:**
Este Pull Request implementa la funcionalidad backend para que un tutor autenticado pueda consultar su disponibilidad horaria registrada. Se añadió un endpoint `GET /api/disponibilidad` protegido por `JwtAuthGuard` que retorna los bloques de disponibilidad del tutor en formato `{ day, hour }`. Se ha seguido las políticas de ramas y commits definidas, y todos los linters y tests pasan correctamente.

**Historias de Usuario cubiertas:**
- HU07 - Consultar mi disponibilidad

**Tareas implementadas:**
- Tarea 7: Implementar endpoint `GET /api/disponibilidad` en `DisponibilidadController` con `JwtAuthGuard` y lógica de autorización de tutor.
- Tarea 8: Implementar lógica de consulta y mapeo en `DisponibilidadService.findByTutorId` para retornar los bloques de disponibilidad.

**Criterios de Aceptación Cumplidos:**
- **CA1 (Visualización de Horario Registrado):** El endpoint `GET /api/disponibilidad` retorna correctamente los bloques de disponibilidad del tutor autenticado en formato `{ blocks: [{ day, hour }] }`. El endpoint está protegido por `JwtAuthGuard` y extrae el `tutorId` del token JWT. Los bloques se ordenan por día y hora (`ASC`). En caso de error interno, se lanza `InternalServerErrorException` con el mensaje `'Error al consultar la disponibilidad.'`.
- **CA2 (Navegación a Panel de Control):** No aplica al backend — es funcionalidad exclusiva del frontend.

**Archivos Clave modificados/creados:**
- `src/disponibilidad/disponibilidad.controller.ts` — Añadido endpoint `GET /api/disponibilidad` con decoradores `@Get()`, `@UseGuards(JwtAuthGuard)`, `@ApiOperation`, `@ApiResponse`. El método `findByTutor` extrae el `tutorId` del request y delega a `DisponibilidadService.findByTutorId`.
- `src/disponibilidad/disponibilidad.service.ts` — Añadido método `findByTutorId(tutorId: string)` que consulta el repositorio de `AvailabilityEntity` filtrando por `tutorId` y ordenando por `day ASC, hour ASC`.
- `src/disponibilidad/disponibilidad.module.ts` — Registrado `DisponibilidadService` en los providers del módulo y exportado para inyección en el controller.
- `src/ofertas/ofertas.service.spec.ts` — Corregido mock de `AvailabilityEntity.find` en los tests de HU17 para retornar `[]` por defecto, evitando fallos por iteración sobre `undefined`.

**Notas:**
- El endpoint reutiliza la entidad `AvailabilityEntity` y el repositorio ya existente del módulo de disponibilidad.
- Se utilizó `catch {}` (sin variable de binding) en el controller para cumplir con la regla `@typescript-eslint/no-unused-vars` del linter.
- El endpoint está documentado con decoradores de Swagger (`@ApiOperation`, `@ApiResponse`) incluyendo ejemplo de respuesta exitosa con bloques `{ day: 'Lun', hour: '09:00' }`.
- Todos los tests pasan: **9/9 suites, 70/70 tests** con `yarn test:cov`.
- El linter pasa sin errores con `yarn lint`.
