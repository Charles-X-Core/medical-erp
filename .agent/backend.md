# Backend Agent Guide

---
Document ID: AGT-BE
Status: Approved
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: false
Depends On: [CONSTITUTION, ARCH-001, ARCH-004, DEV-001]
---

## Role

You are a backend developer working on a Spring Boot Medical ERP.

## Responsibilities

- Implement REST API endpoints following API-001 conventions
- Create and maintain JPA entities aligned with DB-001 schema
- Implement business logic in service layer following domain rules
- Write unit and integration tests following DEV-003
- Ensure security compliance with SEC-001, SEC-002, SEC-003
- Handle errors according to API-003 error codes
- Maintain code quality per DEV-001 coding standards

## Tech Stack

- Java 21
- Spring Boot 3.x
- Spring Security 6.x
- Spring Data JPA
- MySQL 8.x
- JWT (jjwt 0.12.x)
- iText 7.x
- Spring Mail

## Rules

### MUST Follow

1. **Documentation First** — Never write code before documentation exists
2. **Layered Architecture** — Controller → Service → Repository → Entity
3. **DTO Pattern** — Never expose entities directly in API responses
4. **Validation** — Validate all inputs using Jakarta Validation
5. **Error Handling** — Use GlobalExceptionHandler with API-003 error codes
6. **Security** — Apply @PreAuthorize annotations on all endpoints
7. **Testing** — Write tests for all new functionality (DEV-003)
8. **Logging** — Log important operations (SEC-004)
9. **Transactions** — Use @Transactional on service methods that modify data
10. **Naming** — Follow Java naming conventions (REF-006)

### MUST NOT

- Expose entities directly in API responses
- Write business logic in controllers
- Use raw SQL queries (use JPA/Hibernate)
- Skip input validation
- Ignore security annotations
- Write tests that depend on external services
- Commit code without documentation

## Patterns

### Controller Pattern

```java
@RestController
@RequestMapping("/api/v1/{resource}")
@RequiredArgsConstructor
public class {Resource}Controller {
    
    private final {Resource}Service service;
    
    @PostMapping
    @PreAuthorize("hasRole('DOCTORA')")
    public ResponseEntity<ApiResponse<{Resource}Response>> create(
            @Valid @RequestBody {Resource}Request request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(request));
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA')")
    public ResponseEntity<ApiResponse<{Resource}Response>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }
    
    @GetMapping
    @PreAuthorize("hasRole('DOCTORA') or hasRole('ENFERMERA')")
    public ResponseEntity<ApiResponse<Page<{Resource}Response>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(service.getAll(pageable));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA')")
    public ResponseEntity<ApiResponse<{Resource}Response>> update(
            @PathVariable Long id,
            @Valid @RequestBody {Resource}Request request) {
        return ResponseEntity.ok(service.update(id, request));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTORA')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### Service Pattern

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class {Resource}Service {
    
    private final {Resource}Repository repository;
    private final {Resource}Mapper mapper;
    
    @Transactional
    public {Resource}Response create({Resource}Request request) {
        // Validate business rules
        validateBusinessRules(request);
        
        // Map to entity
        {Resource} entity = mapper.toEntity(request);
        
        // Save
        {Resource} saved = repository.save(entity);
        
        // Map to response
        return mapper.toResponse(saved);
    }
    
    public {Resource}Response getById(Long id) {
        {Resource} entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("{Resource}", id));
        return mapper.toResponse(entity);
    }
    
    public Page<{Resource}Response> getAll(Pageable pageable) {
        return repository.findAll(pageable)
                .map(mapper::toResponse);
    }
    
    @Transactional
    public {Resource}Response update(Long id, {Resource}Request request) {
        {Resource} entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("{Resource}", id));
        
        // Validate business rules
        validateBusinessRules(request);
        
        // Update entity
        mapper.updateEntity(entity, request);
        
        // Save
        {Resource} saved = repository.save(entity);
        
        // Map to response
        return mapper.toResponse(saved);
    }
    
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("{Resource}", id);
        }
        repository.deleteById(id);
    }
    
    private void validateBusinessRules({Resource}Request request) {
        // Implement business rule validation
    }
}
```

### Repository Pattern

```java
@Repository
public interface {Resource}Repository extends JpaRepository<{Resource}, Long> {
    
    // Custom queries using Spring Data JPA
    Optional<{Resource}> findByUniqueField(String value);
    
    boolean existsByUniqueField(String value);
    
    @Query("SELECT r FROM {Resource} r WHERE r.status = :status")
    Page<{Resource}> findByStatus(@Param("status") String status, Pageable pageable);
}
```

### DTO Pattern

```java
// Request DTO
public class {Resource}Request {
    @NotBlank(message = "Field is required")
    private String field1;
    
    @Size(max = 100, message = "Field must be less than 100 characters")
    private String field2;
    
    // Getters and setters
}

// Response DTO
public class {Resource}Response {
    private Long id;
    private String field1;
    private String field2;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Getters and setters
}

// Mapper
@Mapper(componentModel = "spring")
public interface {Resource}Mapper {
    
    {Resource} toEntity({Resource}Request request);
    
    {Resource}Response toResponse({Resource} entity);
    
    void updateEntity(@MappingTarget {Resource} entity, {Resource}Request request);
}
```

## Common Tasks

### 1. Add New Entity

1. Read DOM-{entity} for domain rules
2. Read DB-001 for schema
3. Create entity class in `src/main/java/com/medicalerp/{module}/entity/`
4. Create repository interface
5. Create request/response DTOs
6. Create mapper interface
7. Create service class
8. Create controller class
9. Write unit tests for service
10. Write integration tests for controller
11. Update API-002 documentation

### 2. Add New Endpoint

1. Read API-002 for endpoint conventions
2. Read DOM-{entity} for business rules
3. Add method to controller
4. Add method to service
5. Add method to repository (if needed)
6. Add validation annotations
7. Add security annotations
8. Write unit tests
9. Write integration tests
10. Update API-002 documentation

### 3. Fix Bug

1. Reproduce the bug
2. Read related domain docs
3. Identify root cause
4. Write failing test that demonstrates the bug
5. Fix the code
6. Verify test passes
7. Update documentation if needed

### 4. Refactor Code

1. Identify code smell or improvement opportunity
2. Read related documentation
3. Plan refactoring approach
4. Write tests for current behavior
5. Refactor code
6. Verify tests still pass
7. Update documentation if needed

## Workflow

Before any backend task, follow `.agent/workflow.md`:

1. **Understand** — Read relevant `docs/` files
2. **Plan** — Define approach, identify affected modules
3. **Document** — Update docs/ before writing code
4. **Implement** — Write code following conventions
5. **Test** — Write and run tests
6. **Review** — Self-review against `.agent/code-review.md`
7. **Commit** — Clean commit with proper message

## References

- `docs/01-architecture/` — Architecture decisions
- `docs/02-domain/` — Domain models
- `docs/05-api/` — API conventions
- `docs/06-development/` — Coding standards
- `.agent/workflow.md` — Mandatory work order
- `.agent/conventions.md` — Coding conventions
- `.agent/code-review.md` — Review checklist
- `.agent/logging.md` — Decision logging
- `.agent/decisions.md` — ADR documentation
