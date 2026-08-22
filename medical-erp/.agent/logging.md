# Logging — Decision and Progress Registry

---
Document ID: AGT-LOG
Status: Approved
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: false
Depends On: [CONSTITUTION, SEC-004]
---

## 1. Purpose

Every significant decision and progress step MUST be logged. This ensures traceability and allows future agents to understand context.

## 2. What to Log

| Event | Required | Location |
|---|---|---|
| Architecture decision | Yes | `docs/08-adr/ADR-{NNN}.md` |
| Technology choice | Yes | `docs/01-architecture/tech-stack.md` |
| Schema change | Yes | `docs/04-database/db-migrations.md` |
| API change | Yes | `docs/05-api/endpoints.md` |
| Security decision | Yes | `docs/03-security/` |
| Bug fix approach | Yes | Commit message |
| Feature completion | Yes | `docs/00-product/roadmap.md` |
| Domain rule clarification | Yes | `docs/02-domain/` |
| Performance optimization | Yes | Commit message + ADR |
| Refactoring decision | Yes | ADR if architectural |

## 3. Log Format

### Application Logging (SEC-004)

```java
// Use SLF4J with Logback
private static final Logger log = LoggerFactory.getLogger(PacienteService.class);

// Log levels
log.error("Failed to create patient: {}", e.getMessage(), e);
log.warn("Patient not found: id={}", id);
log.info("Patient created: id={}, dni={}", patient.getId(), patient.getDni());
log.debug("Processing patient request: {}", request);
```

### Log Format (JSON)

```json
{
  "timestamp": "2026-07-29T10:30:00Z",
  "level": "INFO",
  "logger": "com.medicalerp.paciente.service.PacienteService",
  "message": "Patient created",
  "context": {
    "userId": 1,
    "patientId": 123,
    "dni": "12345678",
    "action": "CREATE"
  }
}
```

### Audit Logging (SEC-004)

```java
@Aspect
@Component
public class AuditAspect {
    
    @AfterReturning(pointcut = "@annotation(Auditable)", returning = "result")
    public void audit(JoinPoint joinPoint, Object result) {
        AuditLog log = AuditLog.builder()
            .action(joinPoint.getSignature().getName())
            .entityType(getEntityType(joinPoint))
            .entityId(getEntityId(result))
            .userId(getCurrentUserId())
            .timestamp(LocalDateTime.now())
            .build();
        auditRepository.save(log);
    }
}
```

## 4. Progress Tracking

### Task Progress Log

Use commit messages to track progress:

```
feat(paciente): implement CRUD operations

- Add PacienteController with REST endpoints
- Add PacienteService with business logic
- Add PacienteRepository with custom queries
- Add unit and integration tests
- Update API-002 documentation

Refs: DOM-PAC-001, API-002
```

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(paciente): add patient search endpoint

GET /api/v1/pacientes/search?q={query}

- Search by nombre, apellido, dni
- Return paginated results
- Add integration tests

Refs: API-002, DOM-PAC-001
```

```
fix(cita): prevent double booking

- Add unique constraint on (agenda_id, fecha, hora_inicio)
- Add validation in CitaService
- Add integration test for conflict

Fixes: #42
```

```
docs(api): update endpoint documentation

- Add search endpoint to API-002
- Add request/response examples
- Update error codes

Refs: API-002
```

## 5. Session Summary

### End of Session Report

At the end of each work session, provide a summary:

```markdown
## Session Summary — YYYY-MM-DD

### Completed
- [List of completed tasks]
- [Documents updated]
- [Tests added]

### In Progress
- [Tasks partially completed]
- [Blockers encountered]

### Decisions Made
- [List of decisions with rationale]
- [ADRs created]

### Next Steps
- [Prioritized list of next tasks]
- [Dependencies to resolve]

### Issues Found
- [Bugs discovered]
- [Documentation gaps]
- [Technical debt identified]
```

### Example

```markdown
## Session Summary — 2026-07-29

### Completed
- Implemented patient CRUD operations
- Created PacienteController with 5 endpoints
- Added unit tests for PacienteService (12 tests)
- Added integration tests for PacienteController (8 tests)
- Updated API-002 documentation

### In Progress
- Patient search endpoint (50% complete)
- Blocked by: Need clarification on search criteria

### Decisions Made
- Used @PreAuthorize for authorization (ADR-0005)
- Implemented soft delete for patients (ADR-0006)

### Next Steps
1. Complete patient search endpoint
2. Add patient history endpoint
3. Implement digital signature feature

### Issues Found
- Bug: N+1 query in patient list (created ticket #43)
- Documentation gap: Missing error codes for validation
```

## 6. Decision Logging

### When to Create ADR

Create an ADR when:
- Choosing a technology or library
- Making architectural decisions
- Changing established patterns
- Making security decisions
- Deciding on data model changes
- Choosing between multiple approaches

### ADR Template

See `.agent/decisions.md` for ADR format and process.

## References

- `docs/03-security/audit.md` — Audit logging requirements (SEC-004)
- `.agent/decisions.md` — ADR documentation process
- `.agent/workflow.md` — Workflow process
