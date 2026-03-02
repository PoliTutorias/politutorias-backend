1. Contrato HTTP Acordado (Inmutable)
Método: POST
Ruta: /api/tutor/datos-basicos
Request esperado:

{
  "nombreCompleto": "string",
  "numeroWhatsapp": "string",
  "facultad": "string" (enum Facultades),
  "semestreActual": "string" (enum Semestres),
  "biografiaCorta": "string"
}
Headers: Authorization: Bearer <your-jwt-token>, Content-Type: application/json
Response exitoso:

{
  "success": true,
  "message": "Datos básicos registrados con éxito",
  "data": {
    "id": "uuid",
    "userId": "string",
    "nombreCompleto": "string",
    "numeroWhatsapp": "string",
    "facultad": "string",
    "semestreActual": "string",
    "biografiaCorta": "string",
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  }
}
Response de error:
400 Bad Request (Validación DTO):

{
  "statusCode": 400,
  "message": ["Mensaje de validación 1", "Mensaje de validación 2", ...],
  "error": "Bad Request"
}
401 Unauthorized (Sin JWT o JWT inválido):

{
  "statusCode": 401,
  "message": "Unauthorized"
}
500 Internal Server Error (Errores no controlados):

{
  "statusCode": 500,
  "message": "Error interno del servidor al registrar datos básicos."
}
Códigos HTTP: 201 Created (éxito), 400 Bad Request (validación), 401 Unauthorized (autenticación), 500 Internal Server Error (fallo inesperado).
Mensajes acordados:
Éxito: "Datos básicos registrados con éxito"
Errores de validación: Mensajes específicos definidos en class-validator (ej. "El nombre es obligatorio.").
No autorizado: "Unauthorized"
Error interno: "Error interno del servidor al registrar datos básicos."
2. Reglas de Dominio
Cada perfil de tutor debe estar asociado a un único ID de usuario (userId).
Si un usuario autenticado no tiene un perfil de tutor previamente registrado, se debe crear uno nuevo con los datos proporcionados.
Si un usuario autenticado ya tiene un perfil de tutor, sus datos básicos existentes deben ser actualizados con la nueva información. No se debe crear un nuevo perfil.
El sistema debe registrar la fecha de creación y la fecha de la última actualización del perfil del tutor.
3. Invariantes del Dominio
Un userId nunca puede tener más de un TutorEntity asociado.
Un TutorEntity siempre debe tener un userId asociado.
El id de un TutorEntity es inmutable una vez generado.
Los campos createdAt y updatedAt deben reflejar con precisión los momentos de creación y la última modificación del registro, respectivamente.
4. Reglas de Validación Técnica (DTO-level)
Aplicadas al RegistrarDatosBasicosDto:

nombreCompleto:
Debe ser una cadena de texto.
No puede estar vacío. (AC2)
Longitud mínima: 3 caracteres. (AC3)
Longitud máxima: 60 caracteres. (AC4)
Solo puede contener letras y espacios. (AC5)
numeroWhatsapp:
Debe contener solo dígitos (cadena numérica). (AC8)
No puede estar vacío. (AC2)
Longitud mínima: 10 dígitos. (AC6)
Longitud máxima: 13 dígitos. (AC7)
facultad:
Debe ser un valor válido del enumerado Facultades.
No puede estar vacío. (AC2)
semestreActual:
Debe ser un valor válido del enumerado Semestres.
No puede estar vacío. (AC2)
biografiaCorta:
Debe ser una cadena de texto.
No puede estar vacía. (AC2)
Longitud mínima: 20 caracteres. (AC9)
Longitud máxima: 300 caracteres. (AC10)
5. Restricciones de Persistencia
Aplicadas a la TutorEntity y su configuración en base de datos:

id: Clave primaria, tipo UUID, generada automáticamente.
userId:
Campo obligatorio.
Debe ser único en la tabla tutors (garantizando un perfil de tutor por usuario).
nombreCompleto: Longitud máxima de 60 caracteres.
numeroWhatsapp:
Longitud máxima de 13 caracteres.
Debe ser único en la tabla tutors (garantizando que no hay dos tutores con el mismo número de WhatsApp).
facultad: Debe ser uno de los valores definidos en el enumerado Facultades.
semestreActual: Debe ser uno de los valores definidos en el enumerado Semestres.
biografiaCorta: Longitud máxima de 300 caracteres.
createdAt: Se establece automáticamente al crear el registro.
updatedAt: Se actualiza automáticamente en cada modificación del registro.
6. Escenarios Testeables (Given/When/Then)
Escenarios de Éxito (Comportamiento esperable)
Registro de nuevo perfil de tutor (Upsert - Create)

GIVEN: Un usuario autenticado con userId U1 y sin perfil de tutor existente.
WHEN: Se envía un POST /api/tutor/datos-basicos con un RegistrarDatosBasicosDto válido.
THEN:
Se crea un nuevo TutorEntity asociado a U1 en la base de datos.
Los campos del TutorEntity (nombreCompleto, numeroWhatsapp, facultad, semestreActual, biografiaCorta) coinciden con los datos del DTO.
El id del TutorEntity es un UUID válido, y createdAt y updatedAt están establecidos (y son iguales).
La respuesta HTTP es 201 Created.
La estructura de la respuesta JSON (success: true, message, data) es la acordada, y data contiene el TutorEntity creado.
Actualización de perfil de tutor existente (Upsert - Update)

GIVEN: Un usuario autenticado con userId U2 y un perfil de tutor existente en la base de datos.
WHEN: Se envía un POST /api/tutor/datos-basicos con un RegistrarDatosBasicosDto válido (con datos potencialmente nuevos o iguales).
THEN:
El TutorEntity existente asociado a U2 se actualiza en la base de datos con los nuevos datos del DTO.
NO se crea un nuevo TutorEntity.
El campo updatedAt del TutorEntity es posterior a su createdAt original y a su updatedAt anterior.
La respuesta HTTP es 201 Created.
La estructura de la respuesta JSON (success: true, message, data) es la acordada, y data contiene el TutorEntity actualizado.
Escenarios de Error (Validaciones y Contrato)
Acceso no autorizado (JWT ausente/inválido)

GIVEN: Una petición HTTP.
WHEN: Se envía un POST /api/tutor/datos-basicos SIN un token JWT en el encabezado Authorization o con un token inválido.
THEN:
La respuesta HTTP es 401 Unauthorized.
La estructura de la respuesta JSON es la acordada para 401 Unauthorized.
Validación de DTO - Campo obligatorio ausente

GIVEN: Un usuario autenticado con userId U3.
WHEN: Se envía un POST /api/tutor/datos-basicos con un RegistrarDatosBasicosDto donde nombreCompleto está ausente o vacío.
THEN:
La respuesta HTTP es 400 Bad Request.
La estructura de la respuesta JSON es la acordada para errores de validación, incluyendo el mensaje "El nombre es obligatorio.".
No se realizan cambios en la base de datos.
Validación de DTO - Longitud mínima no cumplida

GIVEN: Un usuario autenticado con userId U4.
WHEN: Se envía un POST /api/tutor/datos-basicos con nombreCompleto con menos de 3 caracteres.
THEN:
La respuesta HTTP es 400 Bad Request.
La estructura de la respuesta JSON es la acordada para errores de validación, incluyendo el mensaje "El nombre debe tener al menos 3 caracteres.".
No se realizan cambios en la base de datos.
Validación de DTO - Formato incorrecto

GIVEN: Un usuario autenticado con userId U5.
WHEN: Se envía un POST /api/tutor/datos-basicos con nombreCompleto conteniendo caracteres no permitidos (ej. números).
THEN:
La respuesta HTTP es 400 Bad Request.
La estructura de la respuesta JSON es la acordada para errores de validación, incluyendo el mensaje "El nombre solo puede contener letras y espacios.".
No se realizan cambios en la base de datos.
Validación de DTO - Valor de Enum inválido

GIVEN: Un usuario autenticado con userId U6.
WHEN: Se envía un POST /api/tutor/datos-basicos con facultad o semestreActual con un valor que no existe en los enumerados Facultades o Semestres.
THEN:
La respuesta HTTP es 400 Bad Request.
La estructura de la respuesta JSON es la acordada para errores de validación, incluyendo el mensaje "Selecciona una facultad válida." o "Selecciona un semestre válido.".
No se realizan cambios en la base de datos.
Restricción de Persistencia - numeroWhatsapp duplicado (scenario no cubierto explícitamente en el contrato de error 400)

GIVEN: Un usuario autenticado U7.
AND: Otro tutor T_otro ya tiene el numeroWhatsapp W123 registrado.
WHEN: U7 intenta registrar su perfil con numeroWhatsapp: "W123".
THEN:
(Actual contrato implica) La respuesta HTTP es 500 Internal Server Error (por violación de restricción de unicidad de DB no manejada explícitamente).
** (Contrato deseable para UX)** La respuesta HTTP debería ser 400 Bad Request con un mensaje específico como "El número de WhatsApp ya está registrado por otro tutor.". (Esto requeriría un cambio al contrato de error acordado).
No se realiza el registro/actualización del perfil de U7.
Error interno del servidor (inesperado)

GIVEN: Un usuario autenticado U8 y un RegistrarDatosBasicosDto válido.
AND: Ocurre un fallo inesperado en el servicio (ej. la base de datos no está disponible, un error de lógica no capturado).
WHEN: Se envía un POST /api/tutor/datos-basicos.
THEN:
La respuesta HTTP es 500 Internal Server Error.
La estructura de la respuesta JSON es la acordada para errores internos del servidor.
No se realizan cambios consistentes en la base de datos.
(Nota: Los escenarios de validación DTO deben replicarse para cada regla del DTO para asegurar una cobertura completa.)

7. Riesgos que podrían romper el handshake con frontend
Cambios en la Ruta o Método HTTP: Modificar /api/tutor/datos-basicos o el método POST rompería la comunicación directamente.
Alteración del Contrato de Request (RegistrarDatosBasicosDto):
Cambios en nombres de campos, tipos de datos, o la semántica de los enumerados (Facultades, Semestres).
Modificaciones a las reglas de validación (MinLength, MaxLength, Matches, IsEnum, IsNotEmpty) que sean más estrictas o laxas de lo esperado por el frontend, llevando a errores 400 Bad Request inesperados o a la aceptación de datos incorrectos.
Alteración del Contrato de Response (Éxito):
Cambios en las propiedades de nivel superior (success, message, data).
Modificaciones en la estructura o el tipo de datos dentro del objeto data (la TutorEntity retornada), como renombramientos o eliminación de campos.
Cambio del mensaje de éxito "Datos básicos registrados con éxito".
Alteración del Contrato de Response (Error):
Modificaciones en la estructura del 400 Bad Request (ej. el campo message deja de ser un array de strings).
Cambio en el mensaje de 401 Unauthorized o 500 Internal Server Error.
La falta de un manejo explícito para la violación de la unicidad del numeroWhatsapp en la base de datos (unique: true en TutorEntity). Actualmente, el contrato para 400 Bad Request solo cubre errores de validación del DTO. Una violación de unicidad de DB normalmente resultaría en un 500 Internal Server Error (como se indica en el escenario 8), lo cual es inconsistente con lo que el frontend podría esperar (un 400 con un mensaje específico como "El número de WhatsApp ya está registrado"). Esto es un riesgo significativo si el frontend maneja este caso de forma diferente.
Cambios en los Códigos de Estado HTTP: Si el éxito ya no retorna 201 Created o los errores no cumplen con los códigos 400, 401, 500.
Mecanismo de Autenticación (JwtAuthGuard): Si se elimina el guard, se cambia el método de extracción del userId del token, o si el payload del JWT no contiene el id del usuario como req.user.id, la lógica de negocio subyacente fallará.
Lógica "Upsert" Inconsistente: Si el servicio, en lugar de actualizar un perfil existente, intenta crear uno nuevo (violando la unicidad de userId en la DB), o si no maneja correctamente la creación inicial, podría generar errores de base de datos o datos inconsistentes.
Incompatibilidad de Enumerados: Si los valores de los enumerados Facultades o Semestres en el backend no coinciden exactamente con los que el frontend envía, se producirán errores de validación 400.