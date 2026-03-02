## 1. Contrato HTTP Acordado (Inmutable)

- **Método**: `GET`
- **Ruta**: `/api/ofertas`
- **Request esperado**:
  - **Parámetros de Query**:
    - `minPrice`: `number` (opcional). Debe ser un número válido y mayor o igual a `0`.
    - `maxPrice`: `number` (opcional). Debe ser un número válido y estrictamente positivo (`> 0`).
  - **Cuerpo de la Petición**: No aplica.
- **Response exitoso (200 OK)**:
  ```json
  {
    "ofertas": [
      {
        "id": "string (UUID)",
        "titulo": "string",
        "carrera": "string | null",
        "modalidad": "string",
        "descripcion": "string",
        "lugarReunion": "string | null",
        "precio": "number (decimal con 2 decimales)",
        "tutor": {
          "id": "string (UUID)",
          "nombre": "string",
          "fotoUrl": "string | null",
          "contacto": "string | null"
        },
        "imagenRepresentativaUrl": "string | null",
        "createdAt": "string (ISO 8601 Date)",
        "updatedAt": "string (ISO 8601 Date)"
      }
    ],
    "total": "number (entero no negativo)"
  }
  ```
  _Nota: El objeto `tutor` dentro de cada oferta es obligatorio y debe seguir la estructura especificada._
- **Response de error**:
  - **400 Bad Request**:
    ```json
    {
      "statusCode": 400,
      "message": ["string (mensaje de validación)", "..."],
      "error": "Bad Request"
    }
    ```
    _Mensajes esperados: "minPrice debe ser un número válido.", "minPrice no puede ser negativo.", "maxPrice debe ser un número válido.", "maxPrice debe ser un número positivo."_
  - **500 Internal Server Error**:
    ```json
    {
      "statusCode": 500,
      "message": "Error interno al filtrar ofertas.",
      "error": "Internal Server Error"
    }
    ```
- **Códigos HTTP**: `200 OK`, `400 Bad Request`, `500 Internal Server Error`.
- **Mensajes acordados**:
  - `200 OK`: El cuerpo de la respuesta contiene el array `ofertas` (puede ser vacío) y `total` (número).
  - `400 Bad Request`: Mensajes de error específicos de validación para `minPrice` y `maxPrice`.
  - `500 Internal Server Error`: `Error interno al filtrar ofertas.`

---

## 2. Reglas de Dominio

1.  **Filtrado por Rango de Precio**: Las ofertas se filtran basándose en su `precio` con respecto a los parámetros `minPrice` y `maxPrice` (ambos inclusivos).
    - Si se proporciona `minPrice` y `maxPrice`, se recuperan ofertas donde `minPrice <= precio <= maxPrice`.
    - Si solo se proporciona `minPrice`, se recuperan ofertas donde `precio >= minPrice`.
    - Si solo se proporciona `maxPrice`, se recuperan ofertas donde `precio <= maxPrice`.
    - Si no se proporciona ningún parámetro de precio, se recuperan todas las ofertas.
2.  **Agregación de Datos del Tutor**: Cada oferta devuelta debe incluir la información completa del `TutorEntity` asociado.
3.  **Total de Resultados**: La respuesta debe incluir el número total de ofertas que cumplen con los criterios de filtro, además de la lista de ofertas.

---

## 3. Invariantes del Dominio

1.  El `precio` de una oferta siempre debe ser un número decimal no negativo.
2.  Cada `OfertaEntity` debe estar asociada a un `TutorEntity` válido.
3.  Los campos `id` de `OfertaEntity` y `TutorEntity` deben ser identificadores únicos (UUIDs).
4.  La respuesta del endpoint (`GET /api/ofertas`) siempre debe contener un array `ofertas` (puede ser vacío) y un `total` de tipo `number` (entero no negativo).

---

## 4. Reglas de Validación Técnica (DTO-level)

Aplicadas al DTO `FilterQueryParams`:

1.  **`minPrice`**:
    - Debe ser numérico (`IsNumber`).
    - Debe ser opcional (`IsOptional`).
    - Debe ser mayor o igual a cero (`Min(0)`).
    - Debe ser transformable a número (`Type(() => Number)`).
2.  **`maxPrice`**:
    - Debe ser numérico (`IsNumber`).
    - Debe ser opcional (`IsOptional`).
    - Debe ser estrictamente positivo (`IsPositive`).
    - Debe ser transformable a número (`Type(() => Number)`).

---

## 5. Restricciones de Persistencia

1.  **`OfertaEntity`**:
    - `id`: Clave primaria, tipo UUID.
    - `titulo`: `varchar(255)`, no nulo.
    - `precio`: `decimal(5, 2)`, no nulo.
    - `tutorId`: Clave foránea que referencia a `TutorEntity.id`, no nulo.
    - `createdAt`, `updatedAt`: Campos de fecha, generados automáticamente.
    - `tutor`: Relación `ManyToOne` con `TutorEntity`, cargada eager (`eager: true`).
2.  **`TutorEntity`**:
    - `id`: Clave primaria, tipo UUID.
    - `nombre`: `varchar(100)`, no nulo.
3.  **Integridad referencial**: Debe existir un `TutorEntity` para cada `OfertaEntity` registrada.

---

## 6. Escenarios Testeables (Given/When/Then)

(Solo comportamiento observable desde el backend)

1.  **Escenario: Filtrado por `minPrice` y `maxPrice` válidos.**
    - **Given**: Un conjunto de ofertas con diversos precios.
    - **When**: Se realiza una petición GET a `/api/ofertas?minPrice=10&maxPrice=20`.
    - **Then**: La respuesta HTTP es `200 OK` y contiene solo las ofertas cuyo `precio` está entre 10 y 20 (ambos inclusive), junto con el `total` correcto.

2.  **Escenario: Filtrado solo por `minPrice` válido.**
    - **Given**: Un conjunto de ofertas con diversos precios.
    - **When**: Se realiza una petición GET a `/api/ofertas?minPrice=15`.
    - **Then**: La respuesta HTTP es `200 OK` y contiene solo las ofertas cuyo `precio` es mayor o igual a 15, junto con el `total` correcto.

3.  **Escenario: Filtrado solo por `maxPrice` válido.**
    - **Given**: Un conjunto de ofertas con diversos precios.
    - **When**: Se realiza una petición GET a `/api/ofertas?maxPrice=10`.
    - **Then**: La respuesta HTTP es `200 OK` y contiene solo las ofertas cuyo `precio` es menor o igual a 10, junto con el `total` correcto.

4.  **Escenario: Sin parámetros de filtro de precio.**
    - **Given**: Un conjunto de ofertas con diversos precios.
    - **When**: Se realiza una petición GET a `/api/ofertas`.
    - **Then**: La respuesta HTTP es `200 OK` y contiene todas las ofertas existentes, junto con el `total` de todas las ofertas.

5.  **Escenario: No se encuentran ofertas que coincidan con el filtro.**
    - **Given**: Un conjunto de ofertas con precios conocidos.
    - **When**: Se realiza una petición GET a `/api/ofertas?minPrice=100&maxPrice=200` donde no hay ofertas en ese rango.
    - **Then**: La respuesta HTTP es `200 OK` y contiene un array `ofertas` vacío y `total: 0`.

6.  **Escenario: `minPrice` es un valor no numérico.**
    - **Given**: Un parámetro de query `minPrice` con un valor como "abc".
    - **When**: Se realiza una petición GET a `/api/ofertas?minPrice=abc`.
    - **Then**: La respuesta HTTP es `400 Bad Request` y el mensaje de error indica que `minPrice` debe ser un número válido.

7.  **Escenario: `minPrice` es un valor negativo.**
    - **Given**: Un parámetro de query `minPrice` con un valor como "-5".
    - **When**: Se realiza una petición GET a `/api/ofertas?minPrice=-5`.
    - **Then**: La respuesta HTTP es `400 Bad Request` y el mensaje de error indica que `minPrice` no puede ser negativo.

8.  **Escenario: `maxPrice` es un valor no numérico.**
    - **Given**: Un parámetro de query `maxPrice` con un valor como "xyz".
    - **When**: Se realiza una petición GET a `/api/ofertas?maxPrice=xyz`.
    - **Then**: La respuesta HTTP es `400 Bad Request` y el mensaje de error indica que `maxPrice` debe ser un número válido.

9.  **Escenario: `maxPrice` es cero o un valor negativo.**
    - **Given**: Un parámetro de query `maxPrice` con un valor como "0" o "-10".
    - **When**: Se realiza una petición GET a `/api/ofertas?maxPrice=0`.
    - **Then**: La respuesta HTTP es `400 Bad Request` y el mensaje de error indica que `maxPrice` debe ser un número positivo.

10. **Escenario: Un error interno del servidor ocurre durante la consulta de ofertas.**
    - **Given**: El servicio de ofertas lanza una `InternalServerErrorException` (ej. por un problema de conexión a la base de datos).
    - **When**: Se realiza una petición GET a `/api/ofertas`.
    - **Then**: La respuesta HTTP es `500 Internal Server Error` y el mensaje de error es `Error interno al filtrar ofertas.`.

---

## 7. Riesgos que podrían romper el handshake con frontend

1.  **Inconsistencia en la Validación de Rango (`minPrice` vs `maxPrice`)**:
    - **Riesgo**: La `Server Action` del frontend valida que `minPrice <= maxPrice`. Sin embargo, el DTO del backend (`FilterQueryParams`) no incluye esta validación cruzada. Si el frontend (por un bug, o si se llama directamente al backend) envía `minPrice` mayor que `maxPrice` (ej. `minPrice=20&maxPrice=10`), el backend lo procesaría, resultando en un array de ofertas vacío sin un error explícito de `400 Bad Request` para el rango inválido. Esto podría llevar a una UX confusa ("No se encontraron ofertas" en lugar de "El rango de precio es inválido").
2.  **Carga Incompleta del `TutorEntity`**:
    - **Riesgo**: Aunque el diagrama de secuencia y el `OfertasService` actual incluyen `relations: ['tutor']` y la `OfertaEntity` tiene `eager: true` para la relación, una futura refactorización o un error en la configuración de TypeORM podría provocar que el objeto `tutor` dentro de la respuesta `ofertas` sea `null` o contenga solo el `id` del tutor, rompiendo la estructura esperada por el frontend.
3.  **Serialización de `precio`**:
    - **Riesgo**: El contrato especifica `precio` como un `number`. Sin embargo, en algunos entornos o con ciertas configuraciones de ORM/base de datos, los campos `decimal` pueden ser serializados como `string` en el JSON de respuesta para preservar la precisión. Si esto ocurriera, el frontend que espera un `number` podría experimentar errores de tipo.
4.  **Mensajes de Error Específicos**:
    - **Riesgo**: El contrato de `400 Bad Request` incluye mensajes específicos para las validaciones de `minPrice` y `maxPrice`. Cualquier cambio en estos mensajes por parte del backend (debido a actualizaciones de librerías, refactorización de validadores, etc.) podría afectar la forma en que el frontend los consume o los muestra al usuario.
5.  **URL Base de la API (`NEXT_PUBLIC_API_URL`)**:
    - **Riesgo**: La `Server Action` del frontend depende de la variable de entorno `process.env.NEXT_PUBLIC_API_URL`. Una configuración incorrecta de esta variable en el entorno de despliegue del frontend resultaría en fallos de comunicación con el backend (errores de red o `404 Not Found`), lo que se percibiría como un fallo del sistema aunque el backend funcione correctamente.
