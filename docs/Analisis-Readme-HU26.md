Aquí tienes la base para el proceso de TDD, analizando la `HU26 - Filtrar ofertas por modalidad` y sus acuerdos, con énfasis en el contrato y la detección de riesgos.

---

## 1. Contrato HTTP Acordado (Inmutable)

- **Método**: `GET`
- **Ruta**: `/api/ofertas`
- **Request esperado**:
  - **Parámetros de Consulta**:
    - `modalidad`: Opcional. Un string que puede contener uno o varios valores (`PRESENCIAL`, `VIRTUAL`, `AMBOS`) separados por comas.
      - **Ejemplos válidos**: `?modalidad=PRESENCIAL`, `?modalidad=VIRTUAL,AMBOS`, `?modalidad=AMBOS`
      - **Ejemplo de ausencia**: `/api/ofertas` (sin `modalidad` significa "Todas")
  - **Cuerpo**: No aplica (GET request).
- **Response exitoso (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "string",
        "titulo": "string",
        "descripcion": "string (opcional)",
        "modalidad": "PRESENCIAL" | "VIRTUAL" | "AMBOS",
        "precioHora": 18.50,
        "areaConocimiento": "string (opcional)",
        "nivel": "string (opcional)",
        "tutor": {
          "id": "string",
          "nombre": "string",
          "fotoUrl": "string (URL, opcional)"
        },
        "calificacionPromedio": 4.7 (opcional),
        "numResenas": 45 (opcional),
        "fechaCreacion": "string (ISO 8601)"
      }
    ],
    "total": 2
  }
  ```
- **Response de error**:
  - **400 Bad Request (Parámetros de consulta inválidos)**:
    ```json
    {
      "statusCode": 400,
      "message": [
        "Each modality must be one of the following values: PRESENCIAL, VIRTUAL, AMBOS"
      ],
      "error": "Bad Request"
    }
    ```
  - **500 Internal Server Error (Error interno)**:
    ```json
    {
      "statusCode": 500,
      "message": "Error interno al filtrar ofertas.",
      "error": "Internal Server Error"
    }
    ```
- **Códigos HTTP**: `200 OK`, `400 Bad Request`, `500 Internal Server Error`

---

## 2. Reglas de Dominio

1.  **Filtrado de Ofertas por Modalidad**:
    - Una oferta puede tener una modalidad: `PRESENCIAL`, `VIRTUAL` o `AMBOS`.
    - Cuando se solicita filtrar por `Presencial` (desde el frontend), se deben incluir ofertas con modalidad `PRESENCIAL` o `AMBOS`.
    - Cuando se solicita filtrar por `Virtual` (desde el frontend), se deben incluir ofertas con modalidad `VIRTUAL` o `AMBOS`.
    - Cuando se solicita filtrar por `Ambos` (desde el frontend), se deben incluir únicamente ofertas con modalidad `AMBOS`.
    - Cuando no se especifica un filtro de modalidad (equivalente a "Todas" desde el frontend), se deben devolver todas las ofertas disponibles sin restricción de modalidad.
2.  **Atributos de Oferta**: Cada oferta debe incluir un identificador único, título, descripción (opcional), modalidad, precio por hora, área de conocimiento (opcional), nivel (opcional), y una referencia al tutor asociado.
3.  **Atributos de Tutor (Básicos para Oferta)**: Para cada oferta, se deben proporcionar datos básicos del tutor asociado: identificador, nombre y URL de foto (opcional).
4.  **Calificación y Reseñas**: Las ofertas deben mostrar la calificación promedio del tutor y el número de reseñas (opcionales).
5.  **Orden de Resultados**: Las ofertas deben ser retornadas ordenadas por `fechaCreacion` de forma descendente.
6.  **Conteo Total**: La respuesta debe incluir el número total de ofertas que cumplen con el filtro.

---

## 3. Invariantes del Dominio

1.  La `modalidad` de una oferta siempre debe ser uno de los valores definidos: `PRESENCIAL`, `VIRTUAL` o `AMBOS`.
2.  Cada `Oferta` debe estar asociada a un `Tutor` válido.
3.  El `id` de una oferta y el `id` de un tutor deben ser únicos dentro de sus respectivas entidades.
4.  El `precioHora` de una oferta debe ser un valor numérico positivo.
5.  La `calificacionPromedio` de un tutor debe ser un valor numérico entre 0.0 y 5.0 (inclusive).
6.  `numResenas` debe ser un número entero no negativo.

---

## 4. Reglas de Validación Técnica (DTO-level)

### `GetOfertasFilterDto` (Request Query Parameters)

- **`modalidad`**:
  - `IsOptional()`: El campo es opcional.
  - `@Transform(({ value }) => value.split(',').map((item: string) => item.toUpperCase()))`: Si presente, el valor de la query param (ej. `PRESENCIAL,AMBOS`) se dividirá por comas y cada elemento se convertirá a mayúsculas, resultando en un array de strings (ej. `['PRESENCIAL', 'AMBOS']`).
  - `@IsArray()`: El valor resultante debe ser un array.
  - `@IsString({ each: true })`: Cada elemento del array debe ser una cadena de texto.
  - `@IsIn(Object.values(ModalidadEnum), { each: true })`: Cada elemento del array debe ser uno de los valores válidos (`PRESENCIAL`, `VIRTUAL`, `AMBOS`).

### `OfertaDto` (Response Body, elemento `data`)

- **`id`**: `IsString()`, `IsNotEmpty()`.
- **`titulo`**: `IsString()`, `IsNotEmpty()`.
- **`descripcion`**: `IsString()`, `IsOptional()`.
- **`modalidad`**: `IsEnum(OfferModality)` (debe ser `PRESENCIAL`, `VIRTUAL` o `AMBOS`).
- **`precioHora`**: `IsNumber()`, `IsNotEmpty()`.
- **`areaConocimiento`**: `IsString()`, `IsOptional()`.
- **`nivel`**: `IsString()`, `IsOptional()`.
- **`tutor`**: `ValidateNested()`, `Type(() => TutorBasicDto)`.
  - **`tutor.id`**: `IsString()`, `IsNotEmpty()`.
  - **`tutor.nombre`**: `IsString()`, `IsNotEmpty()`.
  - **`tutor.fotoUrl`**: `IsUrl()`, `IsOptional()`.
- **`calificacionPromedio`**: `IsNumber()`, `IsOptional()`.
- **`numResenas`**: `IsNumber()`, `IsOptional()`.
- **`fechaCreacion`**: `IsString()`, `IsNotEmpty()`.

### `OfertasListResponseDto` (Response Body)

- **`data`**: `IsArray()`, `ValidateNested({ each: true })`, `Type(() => OfertaDto)`.
- **`total`**: `IsNumber()`, `IsOptional()`.

---

## 5. Restricciones de Persistencia

### `OfertaEntity`

- **`id`**: Columna primaria, tipo UUID, generada automáticamente.
- **`titulo`**: Columna de texto (max 255), no nula.
- **`descripcion`**: Columna de texto, nullable.
- **`modalidad`**: Columna de tipo `enum` (valores `PRESENCIAL`, `VIRTUAL`, `AMBOS`), con un valor por defecto `VIRTUAL`.
- **`precioHora`**: Columna decimal (precisión 5, escala 2).
- **`areaConocimiento`**: Columna de texto (max 100), nullable.
- **`nivel`**: Columna de texto (max 50), nullable.
- **`tutor`**: Relación `ManyToOne` con `TutorEntity`, carga ansiosa (`eager: true`), clave foránea `tutorId`.
- **`fechaCreacion`**: Columna de fecha, generada automáticamente en la creación (`CreateDateColumn`).

### `TutorEntity`

- **`id`**: Columna primaria, tipo UUID, generada automáticamente.
- **`nombre`**: Columna de texto (max 100).
- **`fotoUrl`**: Columna de texto, nullable.
- **`contacto`**: Columna de texto (max 255), nullable.
- **`calificacionPromedio`**: Columna decimal (precisión 2, escala 1), con valor por defecto `0.0`.
- **`numResenas`**: Columna entera, con valor por defecto `0`.
- **`ofertas`**: Relación `OneToMany` con `OfertaEntity`.

---

## 6. Escenarios Testeables (Given/When/Then)

1.  **Escenario: Filtrar por modalidad "Presencial" (frontend)**
    - **GIVEN**: Existen ofertas con modalidad `PRESENCIAL`, `VIRTUAL` y `AMBOS` en la base de datos.
    - **WHEN**: Se realiza una petición GET a `/api/ofertas?modalidad=PRESENCIAL,AMBOS`.
    - **THEN**:
      - La respuesta es `200 OK`.
      - La respuesta contiene un array `data` con solo las ofertas cuya modalidad es `PRESENCIAL` o `AMBOS`.
      - La respuesta contiene el campo `total` con el conteo correcto de ofertas filtradas.
      - Cada objeto `OfertaDto` en `data` cumple con la estructura definida.

2.  **Escenario: Filtrar por modalidad "Virtual" (frontend)**
    - **GIVEN**: Existen ofertas con modalidad `PRESENCIAL`, `VIRTUAL` y `AMBOS` en la base de datos.
    - **WHEN**: Se realiza una petición GET a `/api/ofertas?modalidad=VIRTUAL,AMBOS`.
    - **THEN**:
      - La respuesta es `200 OK`.
      - La respuesta contiene un array `data` con solo las ofertas cuya modalidad es `VIRTUAL` o `AMBOS`.
      - La respuesta contiene el campo `total` con el conteo correcto de ofertas filtradas.

3.  **Escenario: Filtrar por modalidad "Ambos" (frontend)**
    - **GIVEN**: Existen ofertas con modalidad `PRESENCIAL`, `VIRTUAL` y `AMBOS` en la base de datos.
    - **WHEN**: Se realiza una petición GET a `/api/ofertas?modalidad=AMBOS`.
    - **THEN**:
      - La respuesta es `200 OK`.
      - La respuesta contiene un array `data` con solo las ofertas cuya modalidad es `AMBOS`.
      - La respuesta contiene el campo `total` con el conteo correcto de ofertas filtradas.

4.  **Escenario: No aplicar filtro de modalidad (frontend "Todas")**
    - **GIVEN**: Existen ofertas con modalidad `PRESENCIAL`, `VIRTUAL` y `AMBOS` en la base de datos.
    - **WHEN**: Se realiza una petición GET a `/api/ofertas` (sin el parámetro `modalidad`).
    - **THEN**:
      - La respuesta es `200 OK`.
      - La respuesta contiene un array `data` con todas las ofertas existentes.
      - La respuesta contiene el campo `total` con el conteo total de ofertas.

5.  **Escenario: No hay ofertas que coincidan con el filtro**
    - **GIVEN**: No existen ofertas con modalidad `PRESENCIAL` ni `AMBOS` en la base de datos.
    - **WHEN**: Se realiza una petición GET a `/api/ofertas?modalidad=PRESENCIAL,AMBOS`.
    - **THEN**:
      - La respuesta es `200 OK`.
      - La respuesta contiene un array `data` vacío.
      - La respuesta contiene el campo `total` con valor `0`.

6.  **Escenario: Parámetro `modalidad` con valor inválido**
    - **GIVEN**: El sistema está operativo.
    - **WHEN**: Se realiza una petición GET a `/api/ofertas?modalidad=INVALIDO`.
    - **THEN**:
      - La respuesta es `400 Bad Request`.
      - La respuesta contiene un mensaje de error indicando que los valores de modalidad son inválidos.

7.  **Escenario: Parámetro `modalidad` con una combinación de valores válidos e inválidos**
    - **GIVEN**: El sistema está operativo.
    - **WHEN**: Se realiza una petición GET a `/api/ofertas?modalidad=PRESENCIAL,MAL_VALOR,AMBOS`.
    - **THEN**:
      - La respuesta es `400 Bad Request`.
      - La respuesta contiene un mensaje de error indicando que los valores de modalidad son inválidos.

8.  **Escenario: Error interno durante la consulta a la base de datos**
    - **GIVEN**: El servicio de ofertas intenta realizar una consulta a la base de datos que falla por un problema interno.
    - **WHEN**: Se realiza una petición GET a `/api/ofertas?modalidad=VIRTUAL`.
    - **THEN**:
      - La respuesta es `500 Internal Server Error`.
      - La respuesta contiene un mensaje de error genérico de "Error interno al filtrar ofertas.".

---

## 7. Riesgos que podrían romper el handshake con frontend

1.  **Inconsistencia en `calificacionPromedio` y `numResenas`**:
    - **Riesgo**: El `OfertaDto` de respuesta espera los campos `calificacionPromedio` y `numResenas` directamente en el objeto de oferta. Sin embargo, la `OfertaEntity` no los contiene; estos campos están en la `TutorEntity` anidada. La función `plainToInstance(OfertaDto, ofertas, { excludeExtraneousValues: true })` no mapeará ni aplanará estos campos desde `tutor.calificacionPromedio` y `tutor.numResenas` a la raíz del `OfertaDto`.
    - **Impacto**: El frontend recibirá un `OfertaDto` sin `calificacionPromedio` y `numResenas` en la ubicación esperada, rompiendo la visualización de la calificación en la UI.

2.  **Formato de `fechaCreacion`**:
    - **Riesgo**: `OfertaDto` espera `fechaCreacion` como `string` (formato ISO 8601). Aunque `CreateDateColumn` de TypeORM maneja fechas, es crucial que la conversión a string sea explícita y consistente en el mapeo a `OfertaDto` para evitar problemas de serialización/deserialización en el frontend.
    - **Impacto**: El frontend podría no interpretar correctamente el campo de fecha, causando errores de parseo o visualización.

3.  **Manejo de la transformación de Query Params**:
    - **Riesgo**: La lógica de `GetOfertasFilterDto` con `@Transform` para dividir por comas y convertir a mayúsculas es crítica. Si esta transformación falla o no se aplica correctamente (ej. por un `ValidationPipe` mal configurado), el servicio podría recibir valores inesperados.
    - **Impacto**: Los filtros no funcionarían como se espera o se lanzarían errores 400 inesperados.

4.  **Coherencia de Enum entre Backend y Frontend**:
    - **Riesgo**: Aunque los `enum` están definidos y alineados (`ModalidadEnum`, `OfferModality`), cualquier cambio en los valores string subyacentes (ej. `PRESENCIAL` vs `Presencial`) en cualquiera de las capas (frontend `filterOfertasAction`, DTOs de request, entidades de DB) rompería el filtrado.
    - **Impacto**: Los filtros no retornarían los resultados esperados o fallarían con errores de validación.

5.  **Estructura y Códigos de Error**:
    - **Riesgo**: Si el formato de respuesta para errores `400` o `500` se desvía del contrato JSON acordado (ej. diferentes nombres de campos, ausencia de `statusCode`), el manejo de errores del frontend podría fallar silenciosamente o mostrar mensajes incorrectos.
    - **Impacto**: Mala experiencia de usuario al no gestionar adecuadamente los errores.

6.  **Conteo `total` y Paginación/Estado de UI**:
    - **Riesgo**: El `OfertasListResponseDto` incluye un campo `total`. Si este campo no se calcula o retorna correctamente, cualquier componente de paginación o UI que dependa de este conteo para mostrar el estado ("X de Y resultados") funcionará de manera errónea.
    - **Impacto**: Información incorrecta para el usuario y mal funcionamiento de componentes de UI.

---
