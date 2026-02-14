# HU17 - Búsqueda y Paginación de Ofertas

## Resumen
Implementación de funcionalidad de búsqueda de ofertas de tutoría con paginación, permitiendo buscar por título de oferta o nombre del tutor.

## Endpoint Implementado
```
GET /api/ofertas/search
```

### Query Parameters
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| searchTerm | string | No | - | Término de búsqueda (título de oferta o nombre de tutor) |
| page | number | No | 1 | Número de página (mínimo 1) |
| limit | number | No | 10 | Cantidad de resultados por página (debe ser positivo) |

### Response
```typescript
{
  offers: OfferResponseDto[],
  totalResults: number,
  currentPage: number,
  itemsPerPage: number,
  totalPages: number
}
```

### OfferResponseDto
```typescript
{
  id: string,
  title: string,
  price: number,
  modality: string,
  description: string,
  tags: string[],
  rating: number,
  reviewsCount: number,
  tutor: {
    id: string,
    name: string,
    photo: string
  },
  createdAt: Date | string
}
```

## Archivos Creados

### 1. Entidades
- **src/tutors/entities/tutor.entity.ts**: Entidad Tutor con relación OneToMany a Oferta
  - Campos: id, name, photoUrl, email, bio
  - Relación bidireccional con Oferta

### 2. DTOs
- **src/ofertas/dto/offers-query.dto.ts**: DTO para query params
  - Validaciones: @IsString(), @IsOptional(), @Min(1), @IsPositive()
  - Transformación automática de tipos con @Type(() => Number)
  - Documentación Swagger con @ApiPropertyOptional

- **src/ofertas/dto/paginated-offers-response.dto.ts**: DTOs de respuesta
  - PaginatedOffersResponse: Wrapper con metadatos de paginación
  - OfferResponseDto: Datos de oferta con tutor embebido
  - TutorResponseDto: Información básica del tutor
  - Documentación completa con @ApiProperty

### 3. Servicio
- **src/ofertas/ofertas.service.ts**: Agregado método searchOffers()
  - Búsqueda insensible a mayúsculas con LOWER() y LIKE
  - Left join con tabla de tutores
  - WHERE con OR: busca en title O tutor.name
  - Ordenamiento por createdAt DESC
  - Paginación con skip/take
  - Mapeo de entidades a DTOs

### 4. Controller
- **src/ofertas/ofertas.controller.ts**: Nuevo endpoint GET /api/ofertas/search
  - ValidationPipe con transform: true
  - Documentación Swagger completa
  - Manejo de respuestas 200, 400, 500

### 5. Module
- **src/ofertas/ofertas.module.ts**: Actualizado
  - Agregada entidad Tutor a TypeOrmModule.forFeature([Oferta, Tutor])

## Archivos Modificados

### 1. Entidad Oferta
- **src/ofertas/domain/entities/oferta.entity.ts**
  - Agregado: @ManyToOne(() => Tutor, (tutor) => tutor.ofertas)
  - Agregado: @JoinColumn({ name: 'tutorId' })
  - Agregado: @Index(['tutorId'])
  - Nuevos campos: rating (float), reviewsCount (int)

## Tests Implementados

### E2E Tests (test/ofertas-search.e2e-spec.ts)
✅ 9 tests pasando:

**Scenario 1: Search with matching results**
- Búsqueda por término "matemáticas" en título
- Búsqueda por nombre de tutor "Juan"

**Scenario 2: Search with no results**
- Retorna array vacío cuando no hay coincidencias

**Scenario 3: Get all offers with pagination**
- Sin searchTerm retorna todas las ofertas paginadas

**Scenario 4: Pagination**
- Paginación correcta en página 2
- Valores default (page=1, limit=10)

**Scenario 5: Invalid query parameters**
- Valida page >= 1
- Valida limit > 0
- Rechaza valores negativos con 400 Bad Request

## Funcionalidades

### Búsqueda
1. **Por título de oferta**: Busca coincidencias parciales en el campo `title`
2. **Por nombre de tutor**: Busca coincidencias parciales en el campo `tutor.name`
3. **Insensible a mayúsculas**: Usa LOWER() en ambas partes de la comparación
4. **Búsqueda parcial**: Usa LIKE con wildcards `%searchTerm%`

### Paginación
- **Page**: Comienza en 1 (no en 0)
- **Limit**: Cantidad de resultados por página
- **Cálculo de skip**: `(page - 1) * limit`
- **Total pages**: `Math.ceil(totalResults / limit)`

### Ordenamiento
- Por defecto: `createdAt DESC` (más recientes primero)

### Validaciones
- `page` debe ser >= 1 (@Min(1))
- `limit` debe ser > 0 (@IsPositive())
- Transformación automática de strings a números

## Integración con Swagger

### Documentación del Endpoint
- @ApiOperation con summary y description
- @ApiQuery para cada query parameter
- @ApiResponse para código 200, 400, 500
- Ejemplos de respuesta con @ApiProperty

### Visualización
El endpoint aparece en Swagger UI en:
```
http://localhost:3000/api#/ofertas/OfertasController_searchOffers
```

## Compatibilidad con HU01 y HU02

✅ **HU01** (Crear oferta): No afectado  
✅ **HU02** (Ofertas por tutor): No afectado  
- Todos los tests existentes siguen pasando
- No hay breaking changes
- Los endpoints HU02 (/api/tutor/:tutorId/ofertas) funcionan independientemente

## Verificación de Tests

### Tests Unitarios
```bash
npm test -- src/ofertas/ofertas.service.spec.ts
```
✅ 6/6 tests pasando (HU02)

### Tests E2E
```bash
# HU02 - Ofertas por tutor
npx jest --config ./test/jest-e2e.json test/ofertas.e2e-spec.ts
✅ 8/8 tests pasando

# HU17 - Búsqueda de ofertas
npx jest --config ./test/jest-e2e.json test/ofertas-search.e2e-spec.ts
✅ 9/9 tests pasando
```

## Uso del Endpoint

### Ejemplo 1: Búsqueda por término
```bash
GET /api/ofertas/search?searchTerm=matemáticas&page=1&limit=10
```

### Ejemplo 2: Todas las ofertas paginadas
```bash
GET /api/ofertas/search?page=1&limit=20
```

### Ejemplo 3: Búsqueda por tutor
```bash
GET /api/ofertas/search?searchTerm=Juan&page=1&limit=5
```

### Ejemplo 4: Sin parámetros (defaults)
```bash
GET /api/ofertas/search
# Equivalente a: page=1&limit=10
```

## Notas Técnicas

### TypeORM QueryBuilder
- Uso de `leftJoinAndSelect` para cargar la relación tutor
- Búsqueda con `LOWER()` para insensibilidad a mayúsculas
- `andWhere` con parámetros nombrados para prevenir SQL injection

### Mapeo de Entidades
- Conversión de `Oferta` entity a `OfferResponseDto`
- Conversión de price a float con `parseFloat()`
- Mapeo de relación tutor con sus campos embebidos

### Validación y Transformación
- `ValidationPipe` con `transform: true` y `whitelist: true`
- `@Type(() => Number)` para convertir query params string a number
- Validaciones automáticas con class-validator

## Estado del Proyecto

✅ HU17 completamente implementado  
✅ Swagger integrado  
✅ Tests passing (23/23 total)  
✅ Compatibilidad con HU01 y HU02 mantenida  
✅ TypeORM configurado con relaciones bidireccionales  
✅ DTOs con validación completa  
✅ Documentación Swagger completa
