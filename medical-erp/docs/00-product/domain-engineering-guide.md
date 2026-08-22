# Domain Engineering Guide

---
Document ID: GOV-002
Status: Approved
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: true
Depends On: [CONSTITUTION, GOV-001]
---

## 1. Purpose

This document defines the methodology for engineering the domain of the Medical ERP. Every domain document MUST follow this guide.

## 2. Domain Engineering Rules

### RULE-001: Never Invent Business Rules

If information is missing or unclear:

```
BUSINESS DECISION REQUIRED
```

The agent MUST NOT assume, guess, or invent rules. Mark it and continue.

### RULE-002: No Database Until Domain Is Approved

Database design (tables, columns, indexes, constraints) MUST NOT appear in domain documents. Domain documents describe WHAT the system knows and does, NOT how it is stored.

### RULE-003: No Endpoints Until Use Cases Are Approved

API endpoints MUST NOT be defined in domain documents. Domain documents describe WHAT the system offers, NOT how it is exposed.

### RULE-004: Full Traceability

Every business rule must be traceable:

```
Business Requirement
        ↓
Business Rule
        ↓
Use Case
        ↓
Domain Entity
        ↓
Database Table
        ↓
REST Endpoint
        ↓
Frontend Screen
```

If something cannot be traced back to a business requirement, it is an inconsistency.

### RULE-005: Single Source of Truth

Each business rule MUST exist in exactly one place. No duplication across documents.

### RULE-006: Every Decision Cites a Document ID

Every functional decision must reference the Document ID that supports it.

### RULE-007: No Empty Sections

Every section in a domain document MUST be filled. If a section does not apply, write explicitly:

```
No aplica.
```

If the answer is unknown, write:

```
BUSINESS DECISION REQUIRED
```

### RULE-008: Business Validations vs Technical Validations

Document them separately:

- **Business Validations:** Rules that come from the business domain (e.g., "DNI must be unique")
- **Technical Validations:** Rules that come from technical constraints (e.g., "email format must be valid")

### RULE-009: No Foreign Concepts

No document may introduce a concept that does not already exist in the Ubiquitous Language. If a new term appears, it MUST be added to the Ubiquitous Language first.

### RULE-010: One Aggregate Per Rule

Every business rule MUST belong to exactly one aggregate. No rule may be split between two modules.

### RULE-011: No Database Behavior in Domain

Domain documents MUST NOT define:
- Primary keys
- Foreign keys
- Indexes
- Constraints
- Column types
- Table names

Domain documents define ENTITIES and their attributes.

### RULE-012: No REST Behavior in Domain

Domain documents MUST NOT define:
- HTTP methods
- URL paths
- Request/response formats
- Status codes

Domain documents define USE CASES and their operations.

### RULE-013: Framework Independent

Domain documents MUST NOT reference:
- Spring Boot
- Hibernate
- JPA
- Lombok
- Any framework

The domain must survive framework changes.

### RULE-014: Public Interface

Every module MUST expose its Public Interface: what operations it offers to the rest of the system. NOT how it implements them.

### RULE-015: Full Traceability

Every business rule MUST be traceable from requirement to implementation.

### RULE-016: Define Invariants

Every domain document MUST define its Invariants: rules that can NEVER be broken, regardless of technology.

### RULE-017: Decision Classification

Before creating a `BUSINESS DECISION REQUIRED`:

1. **Can the architecture safely decide this?**
   → YES → Technical Decision (resolve it)

2. **Can it be changed later without modifying the domain?**
   → YES → Configuration Default (parameterize it)

3. **Otherwise** → Business Decision (ask the clinic)

This ensures only questions that truly change system behavior reach the clinic.

## 3. Domain Discovery Process

Before writing any domain document, answer these 9 questions:

| # | Question | Purpose |
|---|---|---|
| 1 | ¿Quién usa este módulo? | Identify actors |
| 2 | ¿Qué problema resuelve? | Understand value |
| 3 | ¿Qué información administra? | Define data scope |
| 4 | ¿Qué operaciones realiza? | Define operations |
| 5 | ¿Qué reglas tiene? | Define business rules |
| 6 | ¿Qué restricciones legales existen? | Define compliance |
| 7 | ¿Qué auditoría necesita? | Define audit requirements |
| 8 | ¿Qué módulos dependen de él? | Define downstream dependencies |
| 9 | ¿De qué módulos depende? | Define upstream dependencies |

If any answer is unknown:

```
BUSINESS DECISION REQUIRED
```

## 4. Domain Document Structure

Every domain document MUST have these 16 sections:

| # | Section | Description |
|---|---|---|
| 1 | Objetivo | What is this module for |
| 2 | Responsabilidades | What does this module do |
| 3 | Entidades | What entities exist |
| 4 | Value Objects | What value objects exist |
| 5 | Estados | What states exist |
| 6 | Transiciones | How states change |
| 7 | Casos de Uso | What operations are offered |
| 8 | Reglas de Negocio | What rules govern behavior |
| 9 | Validaciones | What rules govern data |
| 10. | Relaciones | How entities relate |
| 11 | Permisos | Who can do what |
| 12 | Auditoría | What events are logged |
| 13 | Eventos | What events are emitted |
| 14 | Soft Delete | How data is preserved |
| 15 | Consideraciones Técnicas | Technical notes |
| 16 | Extensiones Futuras | Planned extensions |

## 5. Agent Workflow

```
1. Select module
        ↓
2. Answer 9 Discovery questions
        ↓
3. If info missing → mark BUSINESS DECISION REQUIRED
        ↓
4. Verify concepts in Ubiquitous Language
        ↓
5. Build dom-*.md (16 sections)
        ↓
6. Define Invariants
        ↓
7. Verify consistency with previous modules
        ↓
8. Mark READY FOR REVIEW
        ↓
9. Continue to next module
```

## 6. Module Order

| # | Module | Document | Depends On |
|---|---|---|---|
| 1 | Usuarios y Roles | dom-seguridad.md | None |
| 2 | Agenda | dom-agenda.md | Usuarios y Roles |
| 3 | Pacientes | dom-pacientes.md | Usuarios y Roles |
| 4 | Citas | dom-citas.md | Agenda, Pacientes |
| 5 | Consultas | dom-consultas.md | Citas |
| 6 | Historias Clínicas | dom-historias.md | Pacientes |
| 7 | Documentos | dom-documentos.md | Consultas, Pacientes |

## 7. Readiness Criteria

A domain document is READY FOR REVIEW when:

- [ ] All 16 sections are filled
- [ ] All unknown rules are marked BUSINESS DECISION REQUIRED
- [ ] All concepts exist in Ubiquitous Language
- [ ] No Database or REST behavior is defined
- [ ] Invariants are defined
- [ ] Public Interface is defined
- [ ] Consistency with previous modules is verified
