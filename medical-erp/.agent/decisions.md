# Decisions — ADR and Change Documentation

---
Document ID: AGT-DEC
Status: Approved
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: false
Depends On: [CONSTITUTION, GOV-001]
---

## 1. Architecture Decision Records (ADR)

Every significant architectural decision MUST be documented as an ADR.

## 2. When to Create an ADR

Create an ADR when:

- Choosing a technology or library
- Making architectural decisions (patterns, structures)
- Changing established patterns or conventions
- Making security decisions
- Deciding on data model changes
- Choosing between multiple valid approaches
- Deprecating a feature or technology
- Making decisions that affect multiple modules

**Do NOT create an ADR for:**

- Bug fixes (use commit messages)
- Minor refactoring (use commit messages)
- Documentation updates (update the doc directly)
- Configuration changes (use commit messages)

## 3. ADR Format

```markdown
# ADR-{NNN}: {Title}

---
Document ID: ADR-{NNN}
Status: {Proposed | Accepted | Deprecated | Superseded by ADR-XXX}
Version: 1.0.0
Owner: Architecture
Last Update: {YYYY-MM-DD}
Last Reviewed: {YYYY-MM-DD}
Source of Truth: true
Depends On: [{Related Document IDs}]
---

## Context

{What is the issue that motivates this decision?}
{What is the current state?}
{What are the constraints?}

## Decision

{What is the change being proposed or decided?}
{Be specific and clear.}

## Consequences

### Positive
- {Benefit 1}
- {Benefit 2}

### Negative
- {Trade-off 1}
- {Trade-off 2}

### Neutral
- {Side effect 1}

## Alternatives Considered

### Alternative 1: {Name}
{Description}
**Pros:** {list}
**Cons:** {list}
**Why not chosen:** {reason}

### Alternative 2: {Name}
{Description}
**Pros:** {list}
**Cons:** {list}
**Why not chosen:** {reason}

## References

- {Related document 1}
- {Related document 2}
```

## 4. ADR Numbering

- Sequential: ADR-0001, ADR-0002, ADR-0003, ...
- Never reuse numbers
- Store in `docs/08-adr/`
- Filename: `ADR-{NNN}.md`

## 5. ADR Lifecycle

### Status Values

| Status | Description |
|---|---|
| Proposed | Under discussion, not yet decided |
| Accepted | Decision made and implemented |
| Deprecated | No longer valid, but was accepted |
| Superseded | Replaced by another ADR |

### Status Transitions

```
Proposed → Accepted → Deprecated
                    → Superseded by ADR-XXX
```

## 6. ADR Process

### Creating an ADR

1. Identify the need for a decision
2. Read existing ADRs (check for conflicts)
3. Create ADR file: `docs/08-adr/ADR-{NNN}.md`
4. Fill in all sections (Context, Decision, Consequences, Alternatives)
5. Set status to "Proposed"
6. Discuss with stakeholders
7. Update status to "Accepted" when decided
8. Implement the decision
9. Update related documentation

### Superseding an ADR

1. Create new ADR with the new decision
2. Reference the old ADR in "Depends On"
3. Update old ADR status to "Superseded by ADR-{NNN}"
4. Add note in old ADR explaining why superseded

### Deprecating an ADR

1. Update ADR status to "Deprecated"
2. Add deprecation date and reason
3. Update related documentation
4. Create new ADR if replacement needed

## 7. Change Documentation

### Non-Architecture Changes

For changes that don't require an ADR:

**Commit Messages:**
- Use conventional commit format
- Include context and rationale
- Reference related documents

**Example:**
```
fix(paciente): prevent duplicate DNI

- Add unique constraint on dni column
- Add validation in PacienteService
- Return 409 Conflict on duplicate

This prevents data integrity issues when creating patients.

Refs: DOM-PAC-001, DB-001
```

### Documentation Changes

When updating documentation:

1. Update the document directly
2. Update metadata (version, date)
3. Add changelog entry if significant
4. Update cross-references if needed

## 8. Decision Hierarchy

### Who Decides What

| Decision Type | Who Decides | Documentation |
|---|---|---|
| Architectural | Architecture | ADR |
| Technology choice | Architecture | ADR + ARCH-004 |
| Security | Security + Architecture | ADR + SEC-* |
| Domain rules | Domain Expert + Product | DOM-* |
| API design | API Lead + Architecture | ADR + API-* |
| Database schema | Database + Architecture | ADR + DB-* |
| Implementation details | Developer | Commit message |

### Escalation

If decision is unclear:

1. Document the issue
2. Identify affected documents
3. Present options with trade-offs
4. Escalate to appropriate authority
5. Wait for decision
6. Document decision in ADR

## 9. Examples

### Example ADR: Technology Choice

```markdown
# ADR-0001: Use Spring Boot 3.x for Backend

---
Document ID: ADR-0001
Status: Accepted
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [ARCH-001, ARCH-004]
---

## Context

We need to choose a backend framework for the Medical ERP.
Requirements:
- Production-grade, maintainable
- Good ecosystem and community
- Support for REST APIs, database access, security
- Long-term support

## Decision

Use Spring Boot 3.x as the backend framework.

## Consequences

### Positive
- Mature, production-ready framework
- Large ecosystem (libraries, tools)
- Excellent documentation
- Long-term support (LTS)
- Good performance

### Negative
- Steeper learning curve than some alternatives
- Heavier than microframeworks (e.g., Quarkus)

### Neutral
- Requires Java 17+ (we're using Java 21)

## Alternatives Considered

### Alternative 1: Quarkus
**Description:** Cloud-native Java framework
**Pros:** Faster startup, lower memory usage
**Cons:** Smaller ecosystem, newer (less mature)
**Why not chosen:** Spring Boot more mature, better ecosystem

### Alternative 2: Micronaut
**Description:** Modern JVM framework
**Pros:** Fast startup, low memory
**Cons:** Smaller community, fewer integrations
**Why not chosen:** Spring Boot more established

## References

- docs/01-architecture/architecture.md
- docs/01-architecture/tech-stack.md
```

## References

- `docs/08-adr/` — Existing ADRs
- `docs/00-product/documentation-governance.md` — Documentation rules (GOV-001)
- `.agent/workflow.md` — Workflow process
- `.agent/logging.md` — Logging and progress tracking
