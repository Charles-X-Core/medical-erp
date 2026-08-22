# Prompt Engineering Patterns

---
Document ID: AGT-PRM
Status: Approved
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: false
Depends On: [CONSTITUTION]
---

## Workflow

Prompts MUST align with `.agent/workflow.md` steps.

## 1. Prompt Structure

### Standard Prompt Format

```
## Context
[Brief description of the project and current state]

## Task
[Clear, specific description of what needs to be done]

## Requirements
[List of specific requirements and constraints]

## References
[List of relevant documents to read]

## Output Format
[How the output should be structured]
```

### Example

```
## Context
Medical ERP project using Spring Boot 3.x, Java 21, MySQL 8.x.
Currently implementing patient management module.

## Task
Create REST API endpoint for creating new patients.

## Requirements
- Follow API-001 conventions
- Include input validation
- Add @PreAuthorize for DOCTORA role
- Return ApiResponse wrapper
- Include unit and integration tests

## References
- docs/02-domain/pacientes.md
- docs/05-api/endpoints.md
- docs/05-api/rest-conventions.md

## Output Format
Provide:
1. Controller method
2. Service method
3. Unit tests
4. Integration tests
```

## 2. Context Loading

### Progressive Context Loading

Load only what's needed for the task:

1. **Always load**: AGENT.md, .agent/workflow.md
2. **Task-specific**: Load based on task type (see context-matrix.md)
3. **On-demand**: Load additional docs as needed

### Context Priority

| Priority | Documents | When to Load |
|---|---|---|
| 1 | AGENT.md, workflow.md | Always |
| 2 | document-map.md | First task |
| 3 | Task-specific docs | Per task type |
| 4 | Related domain docs | When implementing |
| 5 | Reference docs | When needed |

## 3. Task Decomposition

### Breaking Complex Tasks

```
Complex Task: "Implement patient management"

Decomposed:
1. Create Paciente entity (DOM-PAC-001)
2. Create database migration (DB-001)
3. Create PacienteRepository
4. Create PacienteService with CRUD operations
5. Create PacienteController with REST endpoints
6. Add input validation
7. Add authorization (@PreAuthorize)
8. Write unit tests for service
9. Write integration tests for controller
10. Update API-002 documentation
```

### Decomposition Rules

1. **One responsibility per step** — Each step does one thing
2. **Clear dependencies** — Steps are ordered by dependency
3. **Testable increments** — Each step can be tested
4. **Document as you go** — Update docs after each step

## 4. Verification Prompts

### Code Verification

```
Verify the following code:
1. Follows DEV-001 coding standards
2. Has proper input validation
3. Includes error handling
4. Has unit tests
5. Follows security best practices (SEC-001)

Code:
[paste code here]
```

### Documentation Verification

```
Verify the following documentation:
1. Has proper metadata (Document ID, Status, Version)
2. Follows GOV-001 governance rules
3. Is clear and complete
4. Has proper cross-references
5. Uses correct terminology (DOM-UL-001)

Documentation:
[paste documentation here]
```

## 5. Common Patterns

### 5.1 Code Generation

```
## Task
Generate [component type] for [entity/feature]

## Requirements
- Follow [convention document]
- Include [specific features]
- Add [validation/security]
- Write [test type]

## Template
Use the pattern from [reference document]

## Output
Provide complete, production-ready code with:
- All necessary imports
- Proper annotations
- Error handling
- Comments for complex logic
```

### 5.2 Code Review

```
## Task
Review the following code for [specific concerns]

## Checklist
Apply .agent/code-review.md checklist:
- [ ] General quality
- [ ] Security
- [ ] Performance
- [ ] Testing
- [ ] Documentation

## Code
[paste code here]

## Output
Provide:
1. Issues found (with line numbers)
2. Suggested fixes
3. Overall assessment (approve/needs changes/block)
```

### 5.3 Documentation

```
## Task
Create/update [document type] for [topic]

## Requirements
- Follow GOV-001 governance
- Use template from templates/
- Include all required sections
- Add proper metadata
- Cross-reference related docs

## Context
[Provide relevant context]

## Output
Provide complete documentation in markdown format
```

### 5.4 Testing

```
## Task
Write [test type] for [component]

## Requirements
- Follow DEV-003 testing strategy
- Cover happy path
- Cover edge cases
- Cover error cases
- Use descriptive test names

## Component
[paste component code]

## Output
Provide complete test class with:
- All necessary imports
- Setup/teardown methods
- Multiple test cases
- Clear assertions
```

## 6. Anti-Patterns

### Avoid These Patterns

| Anti-Pattern | Problem | Solution |
|---|---|---|
| "Do everything" | Too vague, no focus | Break into specific tasks |
| "Fix the code" | No context | Specify what's broken |
| "Make it better" | Subjective | Define "better" with metrics |
| "Read all docs" | Violates progressive loading | Load only relevant docs |
| "Skip tests" | Violates DEV-003 | Always include tests |
| "Hardcode values" | Not maintainable | Use configuration |
| "Ignore security" | Violates SEC-001 | Always consider security |

### Good vs Bad Prompts

**Bad:**
```
Create a patient endpoint
```

**Good:**
```
## Task
Create REST API endpoint for creating patients

## Requirements
- POST /api/v1/pacientes
- Follow API-001 conventions
- Validate input (apellido_paterno, nombres, dni required)
- Add @PreAuthorize("hasRole('DOCTORA')")
- Return ApiResponse<PacienteResponse>
- Include unit and integration tests

## References
- docs/02-domain/pacientes.md
- docs/05-api/endpoints.md
```

## References

- `.agent/workflow.md` — Workflow process
- `docs/99-reference/context-matrix.md` — Task-to-document mapping
- `docs/00-product/documentation-governance.md` — Documentation rules
