# API Errors

---
Document ID: API-003
Status: Draft
Version: 1.0.0
Owner: API
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [API-001, SEC-004]
---

## 1. Error Response Format

### 1.1 Standard Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": [
      {
        "field": "email",
        "message": "Email es requerido",
        "rejected_value": null
      }
    ],
    "timestamp": "2026-07-28T10:00:00Z",
    "path": "/api/pacientes"
  }
}
```

### 1.2 Error Fields

| Field | Type | Description |
|---|---|---|
| code | string | Machine-readable error code |
| message | string | Human-readable error message |
| details | array | Field-level validation errors (optional) |
| timestamp | string | ISO 8601 timestamp |
| path | string | Request path |

---

## 2. HTTP Status Codes

| Code | Usage | Description |
|---|---|---|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 204 | No Content | Delete successful |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## 3. Error Codes

### 3.1 Authentication Errors

| Code | HTTP | Description |
|---|---|---|
| UNAUTHORIZED | 401 | Authentication required |
| TOKEN_EXPIRED | 401 | Token has expired |
| TOKEN_INVALID | 401 | Token is malformed |
| TOKEN_MISSING | 401 | No token provided |
| INVALID_CREDENTIALS | 401 | Email or password incorrect |
| USER_INACTIVE | 401 | User account is deactivated |
| USER_NOT_FOUND | 401 | User not found |
| REGISTRATION_DISABLED | 401 | **Public registration is disabled** |

> **⚠️ SECURITY:** `REGISTRATION_DISABLED` is returned if anyone attempts to access a registration endpoint.
> There is NO public registration in this system.

### 3.2 Authorization Errors

| Code | HTTP | Description |
|---|---|---|
| FORBIDDEN | 403 | Insufficient permissions |
| ROLE_REQUIRED | 403 | Specific role required |
| ADMIN_REQUIRED | 403 | Admin role required |
| DOCTOR_REQUIRED | 403 | Doctora role required |
| SELF_MODIFY_FORBIDDEN | 403 | Cannot modify own account |
| USER_MANAGEMENT_FORBIDDEN | 403 | Only admin can manage users |

### 3.3 User Management Errors

| Code | HTTP | Description |
|---|---|---|
| DUPLICATE_EMAIL | 409 | Email already registered |
| INVALID_ROLE | 400 | Role not valid |
| CANT_DEACTIVATE_SELF | 400 | Cannot deactivate own account |
| CANT_CHANGE_OWN_ROLE | 400 | Cannot change own role |
| ALREADY_ACTIVE | 400 | User is already active |
| ALREADY_INACTIVE | 400 | User is already inactive |
| ADMIN_CANNOT_BE_DEACTIVATED | 400 | Admin account cannot be deactivated |
| LAST_ADMIN | 400 | Cannot deactivate the last admin user |

### 3.4 Validation Errors

| Code | HTTP | Description |
|---|---|---|
| VALIDATION_ERROR | 400 | Input validation failed |
| REQUIRED_FIELD | 400 | Required field missing |
| INVALID_FORMAT | 400 | Field format invalid |
| INVALID_LENGTH | 400 | Field length invalid |
| INVALID_VALUE | 400 | Field value invalid |
| INVALID_DATE | 400 | Date format invalid |
| INVALID_EMAIL | 400 | Email format invalid |
| INVALID_PHONE | 400 | Phone format invalid |
| INVALID_DNI | 400 | DNI format invalid |
| PASSWORD_WEAK | 400 | Password does not meet requirements |

### 3.5 Resource Errors

| Code | HTTP | Description |
|---|---|---|
| NOT_FOUND | 404 | Resource not found |
| PACIENTE_NOT_FOUND | 404 | Patient not found |
| HISTORIA_NOT_FOUND | 404 | Medical history not found |
| CONSULTA_NOT_FOUND | 404 | Consultation not found |
| CITA_NOT_FOUND | 404 | Appointment not found |
| DOCUMENTO_NOT_FOUND | 404 | Document not found |
| USUARIO_NOT_FOUND | 404 | User not found |
| TIPO_CITA_NOT_FOUND | 404 | Appointment type not found |

### 3.6 Conflict Errors

| Code | HTTP | Description |
|---|---|---|
| DUPLICATE | 409 | Resource already exists |
| DUPLICATE_EMAIL | 409 | Email already registered |
| DUPLICATE_DNI | 409 | DNI already registered |
| DUPLICATE_HISTORIA | 409 | Patient already has medical history |
| APPOINTMENT_CONFLICT | 409 | Time slot not available |
| SCHEDULE_CONFLICT | 409 | Schedule conflict |

### 3.7 Business Logic Errors

| Code | HTTP | Description |
|---|---|---|
| INVALID_STATE | 400 | Invalid resource state |
| CONSULTA_SIGNED | 400 | Cannot modify signed consultation |
| DOCUMENTO_SIGNED | 400 | Cannot modify signed document |
| PAST_DATE | 400 | Cannot schedule in the past |
| PAST_APPOINTMENT | 400 | Cannot cancel past appointment |
| PATIENT_HAS_HISTORY | 400 | Cannot delete patient with history |
| CANT_DEACTIVATE_SELF | 400 | Cannot deactivate own account |

### 3.8 Rate Limit Errors

| Code | HTTP | Description |
|---|---|---|
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| LOGIN_RATE_LIMIT | 429 | Too many login attempts |
| CONTACT_RATE_LIMIT | 429 | Too many contact messages |

### 3.9 Server Errors

| Code | HTTP | Description |
|---|---|---|
| INTERNAL_ERROR | 500 | Internal server error |
| DATABASE_ERROR | 500 | Database connection error |
| PDF_GENERATION_ERROR | 500 | PDF generation failed |
| EMAIL_ERROR | 500 | Email sending failed |
| FILE_ERROR | 500 | File operation failed |

---

## 4. Validation Errors

### 4.1 Single Field Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": [
      {
        "field": "email",
        "message": "Email es requerido",
        "rejected_value": null
      }
    ],
    "timestamp": "2026-07-28T10:00:00Z",
    "path": "/api/pacientes"
  }
}
```

### 4.2 Multiple Field Errors

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": [
      {
        "field": "apellido_paterno",
        "message": "Apellido paterno es requerido",
        "rejected_value": null
      },
      {
        "field": "nombres",
        "message": "Nombres es requerido",
        "rejected_value": null
      },
      {
        "field": "email",
        "message": "Email formato inválido",
        "rejected_value": "invalid-email"
      }
    ],
    "timestamp": "2026-07-28T10:00:00Z",
    "path": "/api/pacientes"
  }
}
```

### 4.3 Validation Rules

| Field | Rules | Error Code |
|---|---|---|
| email | Required, valid format | REQUIRED_FIELD, INVALID_EMAIL |
| dni | Required if tipo_documento != 'sin_doc', unique | REQUIRED_FIELD, DUPLICATE_DNI |
| telefono | Optional, valid format | INVALID_PHONE |
| fecha_nacimiento | Optional, valid date, not future | INVALID_DATE |
| nombre | Required, 2-255 chars | REQUIRED_FIELD, INVALID_LENGTH |
| password | Required, 8+ chars, uppercase, lowercase, number | REQUIRED_FIELD, INVALID_LENGTH |

---

## 5. Global Exception Handler

### 5.1 Spring @ControllerAdvice

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        ErrorResponse error = ErrorResponse.builder()
            .code("NOT_FOUND")
            .message(ex.getMessage())
            .timestamp(Instant.now())
            .build();
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException ex) {
        ErrorResponse error = ErrorResponse.builder()
            .code("VALIDATION_ERROR")
            .message("Error de validación")
            .details(ex.getDetails())
            .timestamp(Instant.now())
            .build();
        
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(DuplicateResourceException ex) {
        ErrorResponse error = ErrorResponse.builder()
            .code("DUPLICATE")
            .message(ex.getMessage())
            .timestamp(Instant.now())
            .build();
        
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        ErrorResponse error = ErrorResponse.builder()
            .code("FORBIDDEN")
            .message("No tiene permisos para realizar esta acción")
            .timestamp(Instant.now())
            .build();
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        ErrorResponse error = ErrorResponse.builder()
            .code("INTERNAL_ERROR")
            .message("Error interno del servidor")
            .timestamp(Instant.now())
            .build();
        
        // Log the exception
        log.error("Unexpected error", ex);
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

### 5.2 Error Response Builder

```java
@Data
@Builder
public class ErrorResponse {
    private String code;
    private String message;
    private List<FieldError> details;
    private Instant timestamp;
    private String path;
    
    @Data
    @Builder
    public static class FieldError {
        private String field;
        private String message;
        private Object rejectedValue;
    }
}
```

---

## 6. Module-specific Errors

### 6.1 Security Module

| Code | HTTP | Description |
|---|---|---|
| INVALID_CREDENTIALS | 401 | Email o contraseña incorrectos |
| USER_INACTIVE | 401 | Cuenta desactivada |
| DUPLICATE_EMAIL | 409 | Email ya registrado |
| INVALID_ROLE | 400 | Rol no válido |
| SELF_DEACTIVATE_FORBIDDEN | 400 | No puede desactivarse a sí mismo |

### 6.2 Patients Module

| Code | HTTP | Description |
|---|---|---|
| PACIENTE_NOT_FOUND | 404 | Paciente no encontrado |
| DUPLICATE_DNI | 409 | DNI ya registrado |
| PATIENT_HAS_HISTORY | 400 | No se puede eliminar paciente con historial |

### 6.3 Agenda Module

| Code | HTTP | Description |
|---|---|---|
| AGENDA_NOT_FOUND | 404 | Agenda no encontrada |
| SCHEDULE_CONFLICT | 409 | Conflicto de horario |
| INVALID_TIME_RANGE | 400 | Rango de tiempo inválido |
| BLOCK_NOT_FOUND | 404 | Bloqueo no encontrado |

### 6.4 Appointments Module

| Code | HTTP | Description |
|---|---|---|
| CITA_NOT_FOUND | 404 | Cita no encontrada |
| APPOINTMENT_CONFLICT | 409 | Horario no disponible |
| PAST_DATE | 400 | No se puede agendar en el pasado |
| PAST_APPOINTMENT | 400 | No se puede cancelar cita pasada |
| INVALID_STATE | 400 | Estado de cita inválido |

### 6.5 Consultations Module

| Code | HTTP | Description |
|---|---|---|
| CONSULTA_NOT_FOUND | 404 | Consulta no encontrada |
| CONSULTA_SIGNED | 400 | No se puede modificar consulta firmada |
| HISTORY_NOT_FOUND | 404 | Historia clínica no encontrada |
| ONLY_DOCTOR | 403 | Solo doctora puede crear consultas |

### 6.6 Documents Module

| Code | HTTP | Description |
|---|---|---|
| DOCUMENTO_NOT_FOUND | 404 | Documento no encontrado |
| DOCUMENTO_SIGNED | 400 | No se puede modificar documento firmado |
| PDF_NOT_GENERATED | 400 | PDF no generado aún |
| SIGNATURE_REQUIRED | 400 | Firma requerida para archivar |

### 6.7 Contact Module

| Code | HTTP | Description |
|---|---|---|
| CONTACT_NOT_FOUND | 404 | Mensaje no encontrado |
| SPAM_DETECTED | 400 | Mensaje detectado como spam |
| RATE_LIMIT_EXCEEDED | 429 | Demasiadas solicitudes |

---

## 7. Error Examples

### 7.1 Validation Error (Patient Creation)

**Request:**

```json
POST /api/pacientes
{
  "apellido_paterno": null,
  "nombres": "A",
  "email": "invalid-email"
}
```

**Response (400 Bad Request):**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": [
      {
        "field": "apellido_paterno",
        "message": "Apellido paterno es requerido",
        "rejected_value": null
      },
      {
        "field": "nombres",
        "message": "Nombres debe tener entre 2 y 255 caracteres",
        "rejected_value": "A"
      },
      {
        "field": "email",
        "message": "Email formato inválido",
        "rejected_value": "invalid-email"
      }
    ],
    "timestamp": "2026-07-28T10:00:00Z",
    "path": "/api/pacientes"
  }
}
```

### 7.2 Authentication Error (Invalid Credentials)

**Request:**

```json
POST /api/auth/login
{
  "email": "maria@clinica.com",
  "password": "wrong-password"
}
```

**Response (401 Unauthorized):**

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email o contraseña incorrectos",
    "timestamp": "2026-07-28T10:00:00Z",
    "path": "/api/auth/login"
  }
}
```

### 7.3 Conflict Error (Duplicate DNI)

**Request:**

```json
POST /api/pacientes
{
  "apellido_paterno": "García",
  "nombres": "María",
  "dni": "12345678",
  "tipo_documento": "dni"
}
```

**Response (409 Conflict):**

```json
{
  "error": {
    "code": "DUPLICATE_DNI",
    "message": "El DNI 12345678 ya está registrado",
    "timestamp": "2026-07-28T10:00:00Z",
    "path": "/api/pacientes"
  }
}
```

### 7.4 Forbidden Error (Insufficient Permissions)

**Request:**

```
DELETE /api/pacientes/123
Authorization: Bearer {token}  // Token for enfermera role
```

**Response (403 Forbidden):**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "No tiene permisos para eliminar pacientes",
    "timestamp": "2026-07-28T10:00:00Z",
    "path": "/api/pacientes/123"
  }
}
```

### 7.5 Not Found Error

**Request:**

```
GET /api/pacientes/999999
Authorization: Bearer {token}
```

**Response (404 Not Found):**

```json
{
  "error": {
    "code": "PACIENTE_NOT_FOUND",
    "message": "Paciente con ID 999999 no encontrado",
    "timestamp": "2026-07-28T10:00:00Z",
    "path": "/api/pacientes/999999"
  }
}
```

### 7.6 Rate Limit Error

**Request:**

```
POST /api/contact
```

**Response (429 Too Many Requests):**

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Demasiadas solicitudes. Intente de nuevo en 60 segundos.",
    "retry_after": 60,
    "timestamp": "2026-07-28T10:00:00Z",
    "path": "/api/contact"
  }
}
```

---

## 8. Error Handling Best Practices

### 8.1 For Developers

| Practice | Description |
|---|---|
| Use specific codes | Prefer DUPLICATE_DNI over generic DUPLICATE |
| Include details | Add field-level errors for validation |
| Log server errors | Always log 500 errors with stack trace |
| Don't leak internals | Never expose stack traces to clients |

### 8.2 For Clients

| Practice | Description |
|---|---|
| Check error code | Use code, not message, for logic |
| Handle all codes | Don't assume specific errors |
| Show user message | Use message field for UI display |
| Retry on 500 | Server errors may be transient |

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
