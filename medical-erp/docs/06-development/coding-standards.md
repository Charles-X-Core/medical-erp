# Coding Standards

---
Document ID: DEV-001
Status: Draft
Version: 1.0.0
Owner: Development
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [ARCH-001, ARCH-004]
---

## 1. General Principles

| Principle | Description |
|---|---|
| Self-documenting code | Code should be readable without comments |
| Composition over inheritance | Prefer composing objects over extending classes |
| Small methods | Methods should do one thing well |
| SOLID principles | Follow SOLID design principles |
| DRY | Don't Repeat Yourself |
| YAGNI | You Aren't Gonna Need It |
| KISS | Keep It Simple, Stupid |

---

## 2. Java Standards

### 2.1 Naming

| Element | Convention | Example |
|---|---|---|
| Classes | PascalCase | `PacienteController`, `AuthService` |
| Methods | camelCase | `crearPaciente()`, `buscarPorDni()` |
| Variables | camelCase | `pacienteId`, `fechaInicio` |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_COUNT`, `API_VERSION` |
| Packages | lowercase | `com.medicalerp.modules.patients` |
| Controllers | PascalCase + Controller | `PacienteController` |
| Services | PascalCase + Service | `PacienteService` |
| Repositories | PascalCase + Repository | `PacienteRepository` |
| DTOs | PascalCase + Request/Response | `PacienteRequest`, `PacienteResponse` |
| Entities | PascalCase | `Paciente`, `Consulta` |
| Enums | PascalCase | `EstadoCita`, `RolUsuario` |

### 2.2 Class Structure

```java
// 1. Package declaration
package com.medicalerp.modules.patients;

// 2. Imports (organized)
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 3. Class declaration with documentation
/**
 * Service for patient management.
 * Handles CRUD operations and business logic.
 */
@Service
@RequiredArgsConstructor
public class PacienteService {

    // 4. Constants
    private static final String ESTADO_ACTIVO = "activo";

    // 5. Dependencies (injected via constructor)
    private final PacienteRepository pacienteRepository;
    private final PacienteMapper pacienteMapper;

    // 6. Public methods
    public PacienteResponse crear(PacienteRequest request) {
        // Implementation
    }

    // 7. Private methods
    private void validarDniUnico(String dni) {
        // Implementation
    }
}
```

### 2.3 Method Length

| Guideline | Limit |
|---|---|
| Maximum lines | 30 lines (excluding blank lines and comments) |
| Maximum parameters | 4 parameters |
| Maximum nesting | 3 levels |

**When to refactor:**
- Method exceeds 30 lines → Extract private methods
- Method has >4 parameters → Use DTO or object
- Method has >3 nesting levels → Extract conditions

### 2.4 Code Style

| Rule | Example |
|---|---|
| Braces on same line | `if (condition) {` |
| 4 spaces indentation | No tabs |
| Line length max | 120 characters |
| Blank lines between methods | 1 blank line |
| No wildcard imports | `import java.util.List` not `import java.util.*` |

---

## 3. Spring Boot Standards

### 3.1 Controllers

```java
@RestController
@RequestMapping("/api/v1/pacientes")
@RequiredArgsConstructor
@Tag(name = "Pacientes", description = "Patient management endpoints")
public class PacienteController {

    private final PacienteService pacienteService;

    @PostMapping
    @Operation(summary = "Create a new patient")
    public ResponseEntity<ApiResponse<PacienteResponse>> crear(
            @Valid @RequestBody PacienteRequest request) {
        PacienteResponse response = pacienteService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(response, "Paciente creado exitosamente"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get patient by ID")
    public ResponseEntity<ApiResponse<PacienteResponse>> obtener(@PathVariable Long id) {
        PacienteResponse response = pacienteService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
```

**Controller Rules:**
| Rule | Description |
|---|---|
| No business logic | Controllers only handle HTTP requests/responses |
| Use DTOs | Never expose entities directly |
| Use ResponseEntity | Always return proper HTTP status codes |
| Validate input | Use @Valid annotation |
| Document API | Use Swagger annotations |

### 3.2 Services

```java
@Service
@RequiredArgsConstructor
@Transactional
public class PacienteService {

    private final PacienteRepository pacienteRepository;
    private final PacienteMapper pacienteMapper;

    @Transactional
    public PacienteResponse crear(PacienteRequest request) {
        // 1. Validate business rules
        validarDniUnico(request.getDni());

        // 2. Map DTO to entity
        Paciente paciente = pacienteMapper.toEntity(request);

        // 3. Save to database
        Paciente saved = pacienteRepository.save(paciente);

        // 4. Map entity to DTO and return
        return pacienteMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PacienteResponse obtenerPorId(Long id) {
        Paciente paciente = pacienteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado"));
        return pacienteMapper.toResponse(paciente);
    }
}
```

**Service Rules:**
| Rule | Description |
|---|---|
| Business logic only | No HTTP handling |
| Use @Transactional | For database operations |
| Throw exceptions | Use custom exceptions |
| Use mappers | Never return entities |

### 3.3 Repositories

```java
@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Long> {

    // Custom query methods
    Optional<Paciente> findByDniAndTipoDocumento(String dni, String tipoDocumento);

    @Query("SELECT p FROM Paciente p WHERE p.estado = :estado ORDER BY p.nombres ASC")
    List<Paciente> findByEstado(@Param("estado") String estado);

    @Query("SELECT p FROM Paciente p WHERE p.nombres LIKE %:busqueda OR p.apellidoPaterno LIKE %:busqueda")
    List<Paciente> buscarPorNombre(@Param("busqueda") String busqueda);
}
```

**Repository Rules:**
| Rule | Description |
|---|---|
| Interface only | No implementation needed |
| Extend JpaRepository | For standard CRUD operations |
| Use @Query | For complex queries |
| Name methods descriptively | `findByDni`, `findByEstado` |

### 3.4 DTOs

```java
// Request DTO
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PacienteRequest {

    @NotBlank(message = "Apellido paterno es requerido")
    @Size(min = 2, max = 255, message = "Apellido paterno debe tener entre 2 y 255 caracteres")
    private String apellidoPaterno;

    @Size(max = 255, message = "Apellido materno no puede exceder 255 caracteres")
    private String apellidoMaterno;

    @NotBlank(message = "Nombres es requerido")
    @Size(min = 2, max = 255, message = "Nombres debe tener entre 2 y 255 caracteres")
    private String nombres;

    @Email(message = "Email formato inválido")
    private String email;
}

// Response DTO
@Data
@Builder
public class PacienteResponse {
    private Long id;
    private String apellidoPaterno;
    private String apellidoMaterno;
    private String nombres;
    private String email;
    private String estado;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

**DTO Rules:**
| Rule | Description |
|---|---|
| Use @Data | Lombok for getters/setters |
| Use @Builder | For object construction |
| Use @Valid | For input validation |
| Separate Request/Response | Never reuse same DTO |

### 3.5 Entities

```java
@Entity
@Table(name = "pacientes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Paciente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "apellido_paterno", nullable = false)
    private String apellidoPaterno;

    @Column(name = "apellido_materno")
    private String apellidoMaterno;

    @Column(name = "nombres", nullable = false)
    private String nombres;

    @Column(name = "dni", length = 20)
    private String dni;

    @Column(name = "tipo_documento", length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'dni'")
    private String tipoDocumento;

    @Column(name = "email")
    private String email;

    @Column(name = "estado", length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'activo'")
    private String estado;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (estado == null) estado = "activo";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

**Entity Rules:**
| Rule | Description |
|---|---|
| Use @Entity | Mark as JPA entity |
| Use @Table | Explicit table name |
| Use @Column | Explicit column mapping |
| Use @PrePersist/@PreUpdate | For timestamps |
| No business logic | Only data structure |

---

## 4. Documentation

### 4.1 Javadoc

```java
/**
 * Service for patient management.
 *
 * <p>This service handles all CRUD operations for patients,
 * including validation and business rules.</p>
 *
 * @author Medical ERP Team
 * @since 1.0.0
 */
@Service
@RequiredArgsConstructor
public class PacienteService {

    /**
     * Creates a new patient.
     *
     * @param request Patient data
     * @return Created patient response
     * @throws DuplicateResourceException if DNI already exists
     * @throws ValidationException if request data is invalid
     */
    @Transactional
    public PacienteResponse crear(PacienteRequest request) {
        // Implementation
    }
}
```

### 4.2 Code Comments

| Situation | Action |
|---|---|
| Complex algorithm | Add comment explaining logic |
| Business rule | Add comment explaining why |
| Workaround/hack | Add comment explaining why |
| Simple code | No comment needed |

### 4.3 API Documentation

- Use Swagger/OpenAPI annotations
- Document all endpoints
- Include request/response examples
- Document error responses

---

## 5. Error Handling

### 5.1 Exception Hierarchy

```
BaseException (abstract)
├── ResourceNotFoundException
├── ValidationException
├── DuplicateResourceException
├── AuthenticationException
├── AuthorizationException
├── BusinessException
└── InternalServerException
```

### 5.2 Custom Exceptions

```java
// Base exception
public abstract class BaseException extends RuntimeException {
    private final String code;
    
    public BaseException(String code, String message) {
        super(message);
        this.code = code;
    }
}

// Resource not found
public class ResourceNotFoundException extends BaseException {
    public ResourceNotFoundException(String resource, Long id) {
        super("NOT_FOUND", String.format("%s con ID %d no encontrado", resource, id));
    }
}

// Duplicate resource
public class DuplicateResourceException extends BaseException {
    public DuplicateResourceException(String resource, String field, String value) {
        super("DUPLICATE", String.format("%s con %s '%s' ya existe", resource, field, value));
    }
}
```

### 5.3 Global Exception Handler

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        log.error("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse.builder()
                .code(ex.getCode())
                .message(ex.getMessage())
                .timestamp(Instant.now())
                .build());
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException ex) {
        log.error("Validation error: {}", ex.getMessage());
        return ResponseEntity.badRequest()
            .body(ErrorResponse.builder()
                .code("VALIDATION_ERROR")
                .message(ex.getMessage())
                .details(ex.getDetails())
                .timestamp(Instant.now())
                .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse.builder()
                .code("INTERNAL_ERROR")
                .message("Error interno del servidor")
                .timestamp(Instant.now())
                .build());
    }
}
```

---

## 6. Code Style

### 6.1 Formatting

| Rule | Setting |
|---|---|
| Indentation | 4 spaces |
| Line length | 120 characters max |
| Braces | K&R style (same line) |
| Blank lines | 1 between methods |

### 6.2 Imports

| Rule | Example |
|---|---|
| No wildcard imports | `import java.util.List` |
| Group imports | Java, javax, org, com |
| Sort alphabetically | Within each group |

### 6.3 Lombok Usage

| Annotation | Usage |
|---|---|
| @Data | DTOs and value objects |
| @Builder | Object construction |
| @RequiredArgsConstructor | Constructor injection |
| @Slf4j | Logging |
| @ToString | Debugging (use carefully) |

**Avoid:**
| Annotation | Reason |
|---|---|
| @Getter/@Setter on entities | Use @Data instead |
| @Value | Immutable objects (use records) |
| @SneakyThrows | Hides checked exceptions |

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
