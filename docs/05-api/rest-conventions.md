# REST API Conventions

---
Document ID: API-001
Status: Draft
Version: 1.0.0
Owner: API
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [ARCH-001, SEC-002, SEC-003]
---

## 1. URL Structure

### 1.1 Base URL

| Environment | Base URL |
|---|---|
| Development | `http://localhost:8080/api` |
| Production | `https://clinica.com/api` |

### 1.2 Resource URLs

```
/api/{resource}                    → Collection
/api/{resource}/{id}               → Single resource
/api/{resource}/{id}/{sub}         → Sub-resource
/api/{resource}/{id}/{sub}/{subId} → Sub-resource by ID
```

### 1.3 URL Examples

| Pattern | Example | Description |
|---|---|---|
| Collection | `/api/pacientes` | List all patients |
| Single | `/api/pacientes/123` | Get patient 123 |
| Sub-resource | `/api/pacientes/123/consultas` | Consultations for patient 123 |
| Search | `/api/pacientes/buscar?q=maria` | Search patients |

### 1.4 URL Rules

| Rule | Example | Notes |
|---|---|---|
| Lowercase | `/api/pacientes` | Not `/api/Pacientes` |
| Plural nouns | `/api/pacientes` | Not `/api/paciente` |
| Hyphens for multi-word | `/api/historias-clinicas` | Not `/api/historiasClinicas` |
| No trailing slash | `/api/pacientes` | Not `/api/pacientes/` |
| No file extensions | `/api/pacientes` | Not `/api/pacientes.json` |

---

## 2. HTTP Methods

| Method | Purpose | Idempotent | Safe | Success Code |
|---|---|---|---|---|
| GET | Read resource(s) | Yes | Yes | 200 OK |
| POST | Create resource | No | No | 201 Created |
| PUT | Full update | Yes | No | 200 OK |
| PATCH | Partial update | Yes | No | 200 OK |
| DELETE | Remove resource | Yes | No | 204 No Content |

### 2.1 Method Rules

| Method | Body | Response |
|---|---|---|
| GET | No | Resource or list |
| POST | Yes (JSON) | Created resource |
| PUT | Yes (JSON) | Updated resource |
| PATCH | Yes (JSON) | Updated resource |
| DELETE | No | Empty (204) |

---

## 3. Response Format

### 3.1 Success Response (Single Resource)

```json
{
  "data": {
    "id": 123,
    "nombre": "María García",
    "email": "maria@email.com"
  },
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

### 3.2 Success Response (Collection)

```json
{
  "data": [
    {
      "id": 123,
      "nombre": "María García",
      "email": "maria@email.com"
    },
    {
      "id": 124,
      "nombre": "Juan López",
      "email": "juan@email.com"
    }
  ],
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z",
  "pagination": {
    "page": 0,
    "size": 20,
    "total_elements": 150,
    "total_pages": 8
  }
}
```

### 3.3 Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": [
      {
        "field": "email",
        "message": "Email es requerido"
      }
    ],
    "timestamp": "2026-07-28T10:00:00Z"
  }
}
```

---

## 4. Pagination

### 4.1 Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| page | int | 0 | Page number (0-indexed) |
| size | int | 20 | Items per page |
| sort | string | created_at,desc | Sort field and direction |

### 4.2 Request Example

```
GET /api/pacientes?page=0&size=20&sort=nombres,asc
```

### 4.3 Response Example

```json
{
  "data": [...],
  "pagination": {
    "page": 0,
    "size": 20,
    "total_elements": 150,
    "total_pages": 8
  }
}
```

### 4.4 Pagination Rules

| Rule | Value |
|---|---|
| Max page size | 100 |
| Default page size | 20 |
| Page starts at | 0 |
| Sort format | `field,asc` or `field,desc` |

---

## 5. Filtering

### 5.1 Query Parameters

| Parameter | Type | Example | Description |
|---|---|---|---|
| {field} | string | `nombre=María` | Exact match |
| {field}_like | string | `nombre_like=María` | Partial match |
| {field}_gt | number | `edad_gt=18` | Greater than |
| {field}_gte | number | `edad_gte=18` | Greater than or equal |
| {field}_lt | number | `edad_lt=65` | Less than |
| {field}_lte | number | `edad_lte=65` | Less than or equal |
| {field}_in | string | `estado_in=activo,inactivo` | In list |
| {field}_between | string | `fecha_between=2026-01-01,2026-12-31` | Between values |

### 5.2 Request Examples

```
# Exact match
GET /api/pacientes?estado=activo

# Partial match
GET /api/pacientes?nombre_like=María

# Range filter
GET /api/citas?fecha_gte=2026-07-01&fecha_lte=2026-07-31

# Multiple values
GET /api/pacientes?estado_in=activo,inactivo

# Combined filters
GET /api/pacientes?estado=activo&sexo=F&fecha_nacimiento_gte=1990-01-01
```

---

## 6. Sorting

### 6.1 Query Parameter

| Parameter | Format | Example |
|---|---|---|
| sort | `field,direction` | `sort=nombres,asc` |

### 6.2 Direction Values

| Value | Description |
|---|---|
| asc | Ascending (A-Z, 0-9, oldest-first) |
| desc | Descending (Z-A, 9-0, newest-first) |

### 6.3 Multiple Sort Fields

```
GET /api/pacientes?sort=apellido_paterno,asc&sort=nombres,asc
```

### 6.4 Sortable Fields

| Resource | Sortable Fields |
|---|---|
| pacientes | nombres, apellido_paterno, created_at, estado |
| citas | fecha, hora, estado, created_at |
| consultas | fecha, created_at |
| documentos | tipo, created_at, estado |

---

## 7. Versioning

### 7.1 Strategy

| Property | Value |
|---|---|
| Type | URL path versioning |
| Format | `/api/v{version}/...` |
| Current | v1 |
| Header | None required |

### 7.2 Version Examples

```
/api/v1/pacientes
/api/v1/citas
/api/v2/pacientes  (future)
```

### 7.3 Version Rules

| Rule | Description |
|---|---|
| Breaking changes | New version required |
| Non-breaking changes | Same version |
| Deprecation | Header: `Deprecation: true` |
| Sunset | Header: `Sunset: 2027-01-01` |

---

## 8. Content Types

### 8.1 Request Headers

| Header | Value | Required |
|---|---|---|
| Content-Type | `application/json` | For POST/PUT/PATCH |
| Accept | `application/json` | Recommended |
| Authorization | `Bearer {token}` | For protected endpoints |

### 8.2 Response Headers

| Header | Value | Description |
|---|---|---|
| Content-Type | `application/json` | Always |
| X-Total-Count | 150 | Total items (for collections) |
| X-Page-Count | 8 | Total pages (for collections) |
| X-Current-Page | 0 | Current page (for collections) |
| X-Per-Page | 20 | Items per page |

---

## 9. Authentication

### 9.1 Token Usage

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### 9.2 Protected Endpoints

All endpoints except the following require authentication:

| Endpoint | Method | Public |
|---|---|---|
| /api/auth/login | POST | Yes |
| /api/contact | POST | Yes |
| /api/health | GET | Yes |

### 9.3 Token Expiration

| Error Code | HTTP Status | Description |
|---|---|---|
| TOKEN_EXPIRED | 401 | Token has expired |
| TOKEN_INVALID | 401 | Token is malformed |
| TOKEN_MISSING | 401 | No token provided |

---

## 10. Rate Limiting

### 10.1 Limits

| Endpoint Type | Limit | Window |
|---|---|---|
| Public (no auth) | 30 requests | 1 minute |
| Authenticated | 100 requests | 1 minute |
| Login | 5 attempts | 1 minute |

### 10.2 Response Headers

| Header | Description |
|---|---|
| X-RateLimit-Limit | Max requests per window |
| X-RateLimit-Remaining | Remaining requests |
| X-RateLimit-Reset | Unix timestamp when window resets |

### 10.3 Rate Limit Exceeded

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Demasiadas solicitudes. Intente de nuevo en 60 segundos.",
    "retry_after": 60
  }
}
```

---

## 11. Request/Response Examples

### 11.1 Create Resource (POST)

**Request:**

```
POST /api/pacientes
Content-Type: application/json
Authorization: Bearer {token}

{
  "apellido_paterno": "García",
  "apellido_materno": "López",
  "nombres": "María Elena",
  "dni": "12345678",
  "tipo_documento": "dni",
  "telefono": "999888777",
  "email": "maria@email.com",
  "fecha_nacimiento": "1990-05-15",
  "sexo": "F"
}
```

**Response (201 Created):**

```json
{
  "data": {
    "id": 123,
    "apellido_paterno": "García",
    "apellido_materno": "López",
    "nombres": "María Elena",
    "dni": "12345678",
    "tipo_documento": "dni",
    "telefono": "999888777",
    "email": "maria@email.com",
    "fecha_nacimiento": "1990-05-15",
    "sexo": "F",
    "estado": "activo",
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T10:00:00Z"
  },
  "message": "Paciente creado exitosamente",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

### 11.2 Get Resource (GET)

**Request:**

```
GET /api/pacientes/123
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 123,
    "apellido_paterno": "García",
    "apellido_materno": "López",
    "nombres": "María Elena",
    "dni": "12345678",
    "tipo_documento": "dni",
    "telefono": "999888777",
    "email": "maria@email.com",
    "fecha_nacimiento": "1990-05-15",
    "sexo": "F",
    "estado_civil": "soltera",
    "direccion": "Av. Principal 123",
    "lugar_nacimiento": "Lima",
    "lugar_procedencia": "Lima",
    "grado_instruccion": "Universitario",
    "ocupacion": "Ingeniera",
    "nombre_acompanante": "Juan García",
    "contacto_emergencia": "Pedro López",
    "telefono_emergencia": "999777666",
    "alergias": "Penicilina",
    "antecedentes_personales": "Ninguno",
    "antecedentes_familiares": "Diabetes",
    "estado": "activo",
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T10:00:00Z"
  },
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

### 11.3 Update Resource (PUT)

**Request:**

```
PUT /api/pacientes/123
Content-Type: application/json
Authorization: Bearer {token}

{
  "apellido_paterno": "García",
  "apellido_materno": "López",
  "nombres": "María Elena",
  "dni": "12345678",
  "tipo_documento": "dni",
  "telefono": "999888777",
  "email": "maria@email.com",
  "fecha_nacimiento": "1990-05-15",
  "sexo": "F",
  "estado_civil": "casada",
  "direccion": "Av. Principal 456"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 123,
    "apellido_paterno": "García",
    "apellido_materno": "López",
    "nombres": "María Elena",
    "dni": "12345678",
    "tipo_documento": "dni",
    "telefono": "999888777",
    "email": "maria@email.com",
    "fecha_nacimiento": "1990-05-15",
    "sexo": "F",
    "estado_civil": "casada",
    "direccion": "Av. Principal 456",
    "estado": "activo",
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T12:00:00Z"
  },
  "message": "Paciente actualizado exitosamente",
  "timestamp": "2026-07-28T12:00:00Z"
}
```

### 11.4 Delete Resource (DELETE)

**Request:**

```
DELETE /api/pacientes/123
Authorization: Bearer {token}
```

**Response (204 No Content):**

```
(empty body)
```

### 11.5 List Resources (GET)

**Request:**

```
GET /api/pacientes?page=0&size=20&sort=nombres,asc&estado=activo
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 123,
      "apellido_paterno": "García",
      "nombres": "María Elena",
      "dni": "12345678",
      "estado": "activo"
    },
    {
      "id": 124,
      "apellido_paterno": "López",
      "nombres": "Juan Carlos",
      "dni": "87654321",
      "estado": "activo"
    }
  ],
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z",
  "pagination": {
    "page": 0,
    "size": 20,
    "total_elements": 150,
    "total_pages": 8
  }
}
```

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
