# Coding Conventions Reference

---
Document ID: AGT-CON
Status: Approved
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: false
Depends On: [CONSTITUTION, DEV-001, REF-006]
---

## Workflow

Conventions MUST be followed at every step of `.agent/workflow.md`.

## Java Conventions

### Naming

| Element | Convention | Example |
|---|---|---|
| Classes | PascalCase | `PacienteService` |
| Methods | camelCase | `findAll()` |
| Variables | camelCase | `pacienteId` |
| Constants | SCREAMING_SNAKE | `MAX_RESULTS` |
| Packages | lowercase | `com.medicalerp.patient` |

### Imports

```java
// Order:
// 1. Java standard library
// 2. Third-party libraries
// 3. Project classes

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medicalerp.patient.entity.Paciente;
import com.medicalerp.patient.repository.PacienteRepository;
```

### Formatting

- **Indentation**: 4 spaces (no tabs)
- **Line length**: Max 120 characters
- **Braces**: Opening brace on same line
- **Blank lines**: One blank line between methods
- **Whitespace**: Space after keywords, around operators

```java
public class PacienteService {
    
    private final PacienteRepository repository;
    
    public PacienteService(PacienteRepository repository) {
        this.repository = repository;
    }
    
    public Optional<Paciente> findById(Long id) {
        return repository.findById(id);
    }
}
```

## Spring Boot Conventions

### Controller

```java
@RestController
@RequestMapping("/api/v1/pacientes")
@RequiredArgsConstructor
public class PacienteController {
    
    private final PacienteService service;
    
    @PostMapping
    @PreAuthorize("hasRole('DOCTORA')")
    public ResponseEntity<ApiResponse<PacienteResponse>> create(
            @Valid @RequestBody PacienteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(request));
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA')")
    public ResponseEntity<ApiResponse<PacienteResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }
}
```

**Rules:**
- Use `@RestController` for REST APIs
- Use `@RequestMapping` for base path
- Use `@RequiredArgsConstructor` for constructor injection
- Use `@Valid` for request validation
- Use `@PreAuthorize` for authorization
- Return `ResponseEntity` with `ApiResponse` wrapper

### Service

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PacienteService {
    
    private final PacienteRepository repository;
    private final PacienteMapper mapper;
    
    @Transactional
    public PacienteResponse create(PacienteRequest request) {
        validateBusinessRules(request);
        Paciente entity = mapper.toEntity(request);
        Paciente saved = repository.save(entity);
        return mapper.toResponse(saved);
    }
    
    public PacienteResponse getById(Long id) {
        Paciente entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", id));
        return mapper.toResponse(entity);
    }
    
    private void validateBusinessRules(PacienteRequest request) {
        // Validation logic
    }
}
```

**Rules:**
- Use `@Service` annotation
- Use `@Transactional(readOnly = true)` at class level
- Use `@Transactional` on methods that modify data
- Inject dependencies via constructor
- Separate business logic from data access
- Throw custom exceptions (ResourceNotFoundException, etc.)

### Repository

```java
@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Long> {
    
    Optional<Paciente> findByDni(String dni);
    
    boolean existsByDni(String dni);
    
    @Query("SELECT p FROM Paciente p WHERE p.estado = :estado")
    Page<Paciente> findByEstado(@Param("estado") String estado, Pageable pageable);
}
```

**Rules:**
- Use `@Repository` annotation
- Extend `JpaRepository<Entity, ID>`
- Use Spring Data JPA query methods
- Use `@Query` for complex queries
- Return `Optional` for single results
- Return `Page` for paginated results

### Entity

```java
@Entity
@Table(name = "pacientes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Paciente {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "apellido_paterno", nullable = false, length = 100)
    private String apellidoPaterno;
    
    @Column(name = "apellido_materno", length = 100)
    private String apellidoMaterno;
    
    @Column(name = "nombres", nullable = false, length = 200)
    private String nombres;
    
    @Column(name = "dni", nullable = false, unique = true, length = 20)
    private String dni;
    
    @Column(name = "estado", nullable = false, length = 20)
    private String estado;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

**Rules:**
- Use `@Entity` and `@Table` annotations
- Use Lombok annotations (`@Getter`, `@Setter`, `@Builder`)
- Map to snake_case database columns
- Include audit columns (createdAt, updatedAt)
- Use `@PrePersist` and `@PreUpdate` for timestamps
- Define column constraints (nullable, length, unique)

### DTO

```java
// Request DTO
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PacienteRequest {
    
    @NotBlank(message = "Apellido paterno es requerido")
    @Size(max = 100, message = "Apellido paterno máximo 100 caracteres")
    private String apellidoPaterno;
    
    @Size(max = 100, message = "Apellido materno máximo 100 caracteres")
    private String apellidoMaterno;
    
    @NotBlank(message = "Nombres es requerido")
    @Size(max = 200, message = "Nombres máximo 200 caracteres")
    private String nombres;
    
    @NotBlank(message = "DNI es requerido")
    @Pattern(regexp = "^\\d{8}$", message = "DNI debe tener 8 dígitos")
    private String dni;
}

// Response DTO
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PacienteResponse {
    private Long id;
    private String apellidoPaterno;
    private String apellidoMaterno;
    private String nombres;
    private String dni;
    private String estado;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

// Mapper
@Mapper(componentModel = "spring")
public interface PacienteMapper {
    
    Paciente toEntity(PacienteRequest request);
    
    PacienteResponse toResponse(Paciente entity);
    
    void updateEntity(@MappingTarget Paciente entity, PacienteRequest request);
}
```

**Rules:**
- Use separate Request and Response DTOs
- Use validation annotations on Request DTOs
- Use MapStruct for mapping
- Include only necessary fields in Response DTOs
- Never expose entities directly in API

## SQL Conventions

### Formatting

```sql
-- Use uppercase for SQL keywords
SELECT 
    p.id,
    p.apellido_paterno,
    p.nombres,
    p.dni
FROM pacientes p
WHERE p.estado = 'activo'
ORDER BY p.apellido_paterno, p.nombres;
```

### Rules

- **Keywords**: UPPERCASE (SELECT, FROM, WHERE)
- **Tables/Columns**: lowercase snake_case
- **Indentation**: 4 spaces
- **Line breaks**: One column per line for readability
- **Comments**: Use `--` for single-line comments
- **Aliases**: Use short, meaningful aliases (p for pacientes)

### Indexes

```sql
-- Create index
CREATE INDEX idx_pacientes_dni ON pacientes(dni);

-- Create unique constraint
ALTER TABLE pacientes 
ADD CONSTRAINT uk_pacientes_dni UNIQUE (dni);

-- Create foreign key
ALTER TABLE citas 
ADD CONSTRAINT fk_citas_paciente_id 
FOREIGN KEY (paciente_id) REFERENCES pacientes(id);
```

## References

- `docs/06-development/coding-standards.md` — Full coding standards (DEV-001)
- `docs/99-reference/naming.md` — Naming conventions (REF-006)
- `docs/04-database/db-conventions.md` — Database conventions (DB-002)
- `docs/05-api/rest-conventions.md` — API conventions (API-001)
