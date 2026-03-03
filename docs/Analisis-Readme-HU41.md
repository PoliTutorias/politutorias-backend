1. Contrato HTTP Acordado (Inmutable)
Método: POST
Ruta: /api/disponibilidad
Request esperado:

{
  "tutorId": "string", // ID del tutor (enviado por el cliente, pero el backend usará el del JWT)
  "blocks": [
    {
      "day": "string", // e.g., 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'
      "hour": "string" // e.g., '07:00', '08:00', ..., '20:00' (formato HH:MM)
    }
  ]
}
Headers requeridos:

Authorization: Bearer <your-jwt-token>
Content-Type: application/json
Response exitoso (201 Created):

{
  "message": "Disponibilidad registrada exitosamente para el tutor.",
  "tutorId": "uuid-del-tutor-desde-jwt",
  "blocks": [
    {
      "id": "uuid-block-1",
      "day": "Lun",
      "hour": "09:00"
    }
    // ... otros bloques guardados
  ]
}
Response de error:
400 Bad Request (Datos de disponibilidad inválidos):

{
  "statusCode": 400,
  "message": "Se debe seleccionar al menos un horario disponible.",
  "error": "Bad Request"
}
// O para errores de validación en campos individuales:
{
  "statusCode": 400,
  "message": ["El día debe ser una cadena de texto."],
  "error": "Bad Request"
}
401 Unauthorized (No autorizado):

{
  "statusCode": 401,
  "message": "Unauthorized"
}
500 Internal Server Error (Error interno del servidor):

{
  "statusCode": 500,
  "message": "Error interno al guardar la disponibilidad.",
  "error": "Internal Server Error"
}
Códigos HTTP:
201 Created (Éxito)
400 Bad Request (Validación de DTO)
401 Unauthorized (Autenticación JWT fallida)
500 Internal Server Error (Error en la lógica de negocio o persistencia)
2. Reglas de Dominio
La disponibilidad de un tutor se define como un conjunto de bloques horarios, cada uno compuesto por un día de la semana y una hora específica.
Al registrar la disponibilidad, se reemplaza completamente cualquier disponibilidad previamente establecida para ese tutor.
La disponibilidad debe asociarse estrictamente al tutor autenticado que realiza la solicitud.
Un tutor debe seleccionar al menos un bloque horario para registrar su disponibilidad.
Cada bloque horario es único para un tutor en un día y hora dados.
3. Invariantes del Dominio
Integridad del Tutor: Cada registro de disponibilidad debe estar asociado a un tutorId válido y existente.
Unicidad del Bloque: No puede existir más de un bloque de disponibilidad para el mismo tutorId, day y hour simultáneamente.
Formato de Bloque: Cada bloque de disponibilidad debe tener un day y un hour con un formato consistente y predefinido.
No Vacío: La colección de bloques de disponibilidad de un tutor no puede estar vacía si se considera "registrada".
4. Reglas de Validación Técnica (DTO-level)
Aplicadas al CreateAvailabilityDto y AvailabilityBlockDto:

tutorId (en CreateAvailabilityDto):
Debe ser una cadena de texto (@IsString).
No debe estar vacío (@IsNotEmpty).
blocks (en CreateAvailabilityDto):
Debe ser un array (@IsArray).
Debe contener al menos un elemento (@ArrayMinSize(1)).
Cada elemento del array debe ser un objeto AvailabilityBlockDto válido (@ValidateNested({ each: true }) y @Type(() => AvailabilityBlockDto)).
day (en AvailabilityBlockDto):
Debe ser una cadena de texto (@IsString).
No debe estar vacío (@IsNotEmpty).
hour (en AvailabilityBlockDto):
Debe ser una cadena de texto (@IsString).
No debe estar vacío (@IsNotEmpty).
5. Restricciones de Persistencia
Aplicadas a la AvailabilityEntity en la base de datos:

id: Clave primaria generada automáticamente (UUID).
tutorId: UUID (VARCHAR de longitud adecuada para UUID).
day: Cadena de texto con longitud máxima de 3 caracteres (ej. 'Lun', 'Mar').
hour: Cadena de texto con longitud máxima de 5 caracteres (ej. '07:00', '12:30').
createdAt: Timestamp de creación, generado automáticamente.
updatedAt: Timestamp de última actualización, generado automáticamente.
Índice único: Combinación de tutorId, day y hour debe ser única (@Index(['tutorId', 'day', 'hour'], { unique: true })). Esto asegura la invariante de unicidad del bloque.
6. Escenarios Testeables (Given/When/Then)
(Solo comportamiento observable desde el backend)

Escenarios de Éxito:

ESC-1: Registro exitoso de nueva disponibilidad.

Given: Un tutor autenticado con tutorId uuid-tutor-A y un CreateAvailabilityDto válido con una lista de bloques (ej. [{day: "Lun", hour: "09:00"}]).
When: Se recibe una petición POST /api/disponibilidad con el DTO y el JWT de uuid-tutor-A.
Then:
La disponibilidad previa de uuid-tutor-A en la base de datos es eliminada.
Los nuevos bloques de disponibilidad se persisten para uuid-tutor-A.
La respuesta es 201 Created con message: "Disponibilidad registrada exitosamente para el tutor.", tutorId: "uuid-tutor-A" y la lista de blocks con sus IDs generados.
ESC-2: Actualización exitosa de disponibilidad existente.

Given: Un tutor autenticado con tutorId uuid-tutor-B que ya tiene disponibilidad registrada (ej. [{day: "Mar", hour: "10:00"}]) y un CreateAvailabilityDto válido con una nueva lista de bloques (ej. [{day: "Mié", hour: "11:00"}, {day: "Jue", hour: "12:00"}]).
When: Se recibe una petición POST /api/disponibilidad con el DTO y el JWT de uuid-tutor-B.
Then:
La disponibilidad previa de uuid-tutor-B ({day: "Mar", hour: "10:00"}) es eliminada.
Los nuevos bloques ({day: "Mié", hour: "11:00"}, {day: "Jue", hour: "12:00"}) se persisten para uuid-tutor-B.
La respuesta es 201 Created con el mensaje de éxito y la nueva lista de bloques.
ESC-3: Prioridad del tutorId del JWT sobre el DTO.

Given: Un tutor autenticado con tutorId uuid-tutor-C (del JWT) y un CreateAvailabilityDto válido que contiene un tutorId diferente (ej. uuid-tutor-X).
When: Se recibe una petición POST /api/disponibilidad con el DTO y el JWT de uuid-tutor-C.
Then:
La disponibilidad se registra exclusivamente para uuid-tutor-C.
La disponibilidad previa de uuid-tutor-C es eliminada (si existe).
La disponibilidad de uuid-tutor-X no es afectada.
La respuesta es 201 Created con el tutorId: "uuid-tutor-C".
Escenarios de Error (Cliente):

ESC-4: Petición sin autenticación JWT.

Given: Un CreateAvailabilityDto válido.
When: Se recibe una petición POST /api/disponibilidad sin un token JWT válido o sin el header Authorization.
Then: La respuesta es 401 Unauthorized.
ESC-5: DTO con array de blocks vacío.

Given: Un tutor autenticado y un CreateAvailabilityDto con blocks: [].
When: Se recibe una petición POST /api/disponibilidad.
Then: La respuesta es 400 Bad Request con el mensaje "Se debe seleccionar al menos un horario disponible.".
ESC-6: DTO con day faltante/inválido en un bloque.

Given: Un tutor autenticado y un CreateAvailabilityDto con un bloque donde day es nulo, vacío o no es una cadena.
When: Se recibe una petición POST /api/disponibilidad.
Then: La respuesta es 400 Bad Request con un mensaje de validación apropiado (ej. "El día no puede estar vacío." o "El día debe ser una cadena de texto.").
ESC-7: DTO con hour faltante/inválido en un bloque.

Given: Un tutor autenticado y un CreateAvailabilityDto con un bloque donde hour es nulo, vacío o no es una cadena.
When: Se recibe una petición POST /api/disponibilidad.
Then: La respuesta es 400 Bad Request con un mensaje de validación apropiado (ej. "La hora no puede estar vacía." o "La hora debe ser una cadena de texto.").
Escenarios de Error (Servidor):

ESC-8: Fallo interno en la persistencia de datos.
Given: Un tutor autenticado y un CreateAvailabilityDto válido.
When: Se recibe una petición POST /api/disponibilidad, y ocurre un error inesperado al intentar eliminar o guardar en la base de datos (simular fallo de TypeORM/DB).
Then: La respuesta es 500 Internal Server Error con el mensaje "Error interno al guardar la disponibilidad.".
7. Riesgos que podrían romper el handshake con frontend
Cambios en la URL o Método HTTP: Si la ruta /api/disponibilidad o el método POST se modifican.
Modificaciones en la estructura del Request Body (CreateAvailabilityDto):
Renombrar tutorId o blocks.
Cambiar los campos day o hour dentro de blocks.
Modificar los tipos de datos esperados (ej., de string a number).
Cambios en la estructura del Response Body (Éxito y Error):
Modificar las claves message, tutorId, blocks o id, day, hour dentro de los bloques en el éxito 201.
Alterar la estructura de los objetos de error (statusCode, message, error).
Inconsistencias en los Códigos HTTP: Si se utilizan códigos diferentes para el éxito (201) o para los errores comunes (400, 401, 500).
Requisitos de Autenticación JWT:
Si se elimina o cambia el JwtAuthGuard y el endpoint ya no requiere un token JWT.
Si el tutorId ya no se extrae de req.user.id o si el payload del JWT cambia y el id del usuario deja de estar disponible allí.
Si el backend comienza a confiar en el tutorId enviado en el DTO en lugar del extraído del JWT (rompería la seguridad y la expectativa del backend).
Validación de ArrayMinSize(1): Si esta validación cambia o se elimina, el frontend podría enviar arrays vacíos y el backend los aceptaría, lo cual es contrario al criterio de aceptación.
Formatos de day y hour: Aunque se validan como string, si el backend comenzara a validar formatos específicos (ej. HH:MM para hour, Lun para day) de forma más estricta o diferente a lo que el frontend envía, causaría errores 400. La longitud máxima definida en la entidad (3 y 5) es una restricción silenciosa que debe respetarse.
Mensajes de Error Específicos: El frontend podría estar interpretando mensajes de error específicos (ej., "Se debe seleccionar al menos un horario disponible.") para mostrar retroalimentación a los usuarios. Si estos mensajes cambian, la UI podría mostrar un error genérico en lugar de uno contextual.