# Documentation Governance

---
Document ID: GOV-001
Status: Draft
Version: 0.1.0
Owner: Architecture
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [CONSTITUTION]
---

## 1. Document Lifecycle

### 1.1 States

| State | Description | Transition |
|---|---|---|
| Draft | Initial creation, incomplete | → Review |
| Review | Complete, awaiting approval | → Approved |
| Approved | Verified, authoritative | → Active |
| Active | In use, current | → Deprecated |
| Deprecated | No longer valid | → Archived |
| Archived | Retired, reference only | (terminal) |

### 1.2 Transitions

```
Draft → Review → Approved → Active → Deprecated → Archived
```

### 1.3 Rules

- Documents MUST start as Draft
- Documents MUST be reviewed before approval
- Approved documents become Active when in use
- Deprecated documents MUST NOT be referenced by new documents
- Archived documents are kept for historical reference only
- Deprecated document IDs are NEVER reused
- Active documents MUST NOT be deleted without an ADR

---

## 2. Document Creation

### 2.1 Who Creates What

| Document Type | Creator | Approver |
|---|---|---|
| AGENT.md | Architecture | Architecture |
| docs/00-product/* | Product | Architecture |
| docs/01-architecture/* | Architecture | Architecture |
| docs/02-domain/* | Domain Expert | Architecture |
| docs/03-security/* | Security | Architecture |
| docs/04-database/* | Database | Architecture |
| docs/05-api/* | API Lead | Architecture |
| docs/06-development/* | Development | Architecture |
| docs/07-deployment/* | DevOps | Architecture |
| docs/08-adr/* | Proposer | Architecture |
| docs/99-reference/* | Architecture | Architecture |
| .agent/* | Architecture | Architecture |

### 2.2 Creation Process

1. Identify need for new document
2. Select correct template from `templates/`
3. Fill template with content
4. Set Status: Draft
5. Set all metadata fields
6. Add document to parent README.md index
7. Submit for review

---

## 3. Document IDs

### 3.1 ID Format

`{PREFIX}-{SUFFIX}`

| Prefix | Directory | Example |
|---|---|---|
| GOV | docs/00-product/ | GOV-001 |
| PRD | docs/00-product/ | PRD-001 |
| ARCH | docs/01-architecture/ | ARCH-001 |
| DOM-{entity} | docs/02-domain/ | DOM-PAT-001 |
| SEC | docs/03-security/ | SEC-001 |
| DB | docs/04-database/ | DB-001 |
| API | docs/05-api/ | API-001 |
| DEV | docs/06-development/ | DEV-001 |
| OPS | docs/07-deployment/ | OPS-001 |
| ADR | docs/08-adr/ | ADR-0001 |
| REF | docs/99-reference/ | REF-001 |
| AGT | .agent/ | AGT-WF |

### 3.2 ID Permanence

**IDs are permanent and NEVER reused.**

If a document is deleted:
- Its ID is retired
- The ID will never be assigned to another document
- The ID remains in historical records

Example:
```
DOM-PAT-001  → active
DOM-PAT-002  → deleted (retired, never reused)
DOM-PAT-003  → new document
```

### 3.3 ID Registration

New IDs MUST be registered in:
- `AGENT.md` Document Map
- `docs/99-reference/document-map.md`

### 3.4 Prefix Registry (Frozen)

The following prefixes are official and closed:

| Prefix | Directory | Example |
|---|---|---|
| GOV | docs/00-product/ | GOV-001 |
| PRD | docs/00-product/ | PRD-001 |
| ARCH | docs/01-architecture/ | ARCH-001 |
| DOM-{entity} | docs/02-domain/ | DOM-PAT-001 |
| SEC | docs/03-security/ | SEC-001 |
| DB | docs/04-database/ | DB-001 |
| API | docs/05-api/ | API-001 |
| DEV | docs/06-development/ | DEV-001 |
| OPS | docs/07-deployment/ | OPS-001 |
| ADR | docs/08-adr/ | ADR-0001 |
| REF | docs/99-reference/ | REF-001 |
| AGT | .agent/ | AGT-WF |

**New prefixes are PROHIBITED without an ADR.**

No new prefixes (AI, AUTH, INF, DOC, etc.) may be created without an approved ADR.

---

## 4. Versioning

### 4.1 Version Format

Semantic Versioning for documents: `MAJOR.MINOR.PATCH`

| Component | When to Increment |
|---|---|
| MAJOR | Incompatible changes, restructuring, major changes |
| MINOR | New content, new sections, new documentary functionality |
| PATCH | Corrections, typos, formatting, references |

### 4.2 Version Examples

```
0.1.0 → Initial draft
0.2.0 → Added new section
1.0.0 → First approved version
1.1.0 → Added examples
1.1.1 → Fixed typo
2.0.0 → Major restructure
```

---

## 5. Metadata

### 5.1 Required Fields

Every document MUST have these metadata fields:

```yaml
---
Document ID: {PREFIX-NNN}
Status: {Draft|Review|Approved|Active|Deprecated|Archived}
Version: {X.Y.Z}
Owner: {Architecture|Product|Domain|Security|Database|API|Development|DevOps|Operations|Documentation}
Last Update: {YYYY-MM-DD}
Last Reviewed: {YYYY-MM-DD}
Source of Truth: {true|false}
Depends On: [{Document IDs}]
---
```

### 5.2 Owner Catalog (Frozen)

The following owners are official and closed:

| Owner | Responsibility |
|---|---|
| Architecture | Architectural decisions, constitution |
| Product | Vision, scope, roadmap |
| Domain | Business models, rules |
| Security | Security, authentication, authorization |
| Database | Schema, migrations, queries |
| API | Endpoints, REST contracts |
| Development | Code, standards, testing |
| DevOps | Deployment, Docker, monitoring |
| Operations | Daily operations, backups |
| Documentation | Governance, templates, references |

**New owners are PROHIBITED without an ADR.**

### 5.2 Field Definitions

| Field | Description |
|---|---|
| Document ID | Unique permanent identifier |
| Status | Current lifecycle state |
| Version | Semantic version number |
| Owner | Who is responsible for this document |
| Last Update | When content was last modified |
| Last Reviewed | When content was last verified for accuracy |
| Source of Truth | Whether this is the canonical source |
| Depends On | Document IDs this document requires |

### 5.3 Source of Truth

If `Source of Truth: true`:
- This document is the canonical authority for its topic
- No derived document may contradict it
- When conflicts arise, update this document first
- Then update all derived documents

If `Source of Truth: false`:
- This document is derived from another
- It MUST NOT contradict the source
- It should reference the source in `Depends On`

---

## 6. Dependencies

### 6.1 Declaring Dependencies

Every document declares what it depends on in `Depends On`.

Example:
```yaml
Depends On: [ARCH-001, DB-001]
```

### 6.2 Impact Analysis

When modifying a document:
1. Check which documents depend on it (see `docs/99-reference/dependency-graph.md`)
2. Notify owners of affected documents
3. Update affected documents if needed

### 6.3 Dependency Rules

- Documents MUST NOT depend on deprecated documents
- Circular dependencies are PROHIBITED
- Dependencies MUST be declared explicitly

---

## 7. Reference Style

### 7.1 Official Reference Format

All document references MUST use Document IDs. This ensures that moving files never breaks references.

**Correct format:**
```markdown
See: ARCH-001
See: DOM-PAT-001
See: API-002
```

**Prohibited formats:**
```markdown
Ver: architecture.md
Ver: patients.md
Ver: patient docs
Ver: el documento de arquitectura
```

### 7.2 Reference Rules

- Always use Document ID for cross-references
- Never use file names for references
- Never use descriptive text for references
- Document IDs are stable; file paths are not

### 7.3 Reference Examples

| Context | Correct Reference |
|---|---|
| Refer to architecture | See: ARCH-001 |
| Refer to patient entity | See: DOM-PAT-001 |
| Refer to API endpoints | See: API-002 |
| Refer to security policy | See: SEC-001 |

---

## 8. Documentation Debt

### 8.1 Detection

When an agent detects documentation that contradicts code or is outdated, it MUST report Documentation Debt.

### 8.2 Severity Levels

| Level | Definition | Agent Action |
|---|---|---|
| Critical | Code contradicts documentation | MUST stop and resolve |
| Warning | Minor update missing | May continue, report |
| Info | Improvement suggestion | Optional, report |

### 8.3 Report Format

```markdown
## Documentation Debt Detected

**Document:** {Document ID}
**Reason:** {What is outdated}
**Impact:** {What is affected}
**Action:** {What needs updating}
**Severity:** {Critical|Warning|Info}
```

### 8.4 Resolution

- Critical: Stop work, fix documentation, then continue
- Warning: Complete current work, then fix documentation
- Info: Note for future improvement

---

## 9. Conflict Resolution

### 9.1 Hierarchy

```
1. AGENT.md                              (highest)
2. docs/00-product/documentation-governance.md
3. docs/*
4. .agent/*
5. templates/*
6. logs/*                                (lowest)
```

### 9.2 Rules

1. Higher authority always wins
2. If same authority, newer version wins
3. If still unclear, escalate to Architecture
4. Document the conflict and resolution

---

## 10. Review Process

### 10.1 What Reviewers Check

- [ ] Content is accurate
- [ ] Metadata is complete and correct
- [ ] Dependencies are declared
- [ ] Version is incremented appropriately
- [ ] Status is correct
- [ ] Templates were followed
- [ ] No conflicts with higher-authority documents
- [ ] All IDs are registered

### 10.2 Review Cadence

| Document Type | Review Frequency |
|---|---|
| AGENT.md | Quarterly |
| docs/02-domain/* | When domain changes |
| docs/03-security/* | Quarterly |
| docs/04-database/* | When schema changes |
| docs/05-api/* | When API changes |
| .agent/* | When workflow changes |

---

## 11. Deprecation

### 11.1 When to Deprecate

- Document is no longer relevant
- Document is replaced by another
- Document's topic is out of scope

### 11.2 Deprecation Process

1. Create ADR proposing deprecation
2. Set Status: Deprecated
3. Add deprecation notice at top of document
4. Reference replacement document (if any)
5. Update dependency graph
6. Remove from active document maps

### 11.3 Deprecation Notice Format

```markdown
> **DEPRECATED:** This document is deprecated as of {date}.
> Reason: {reason}
> Replacement: {document-id or "None"}
```

### 11.4 Archival Process

1. Create ADR proposing archival
2. Set Status: Archived
3. Add archival notice at top of document
4. Move to archive directory (if applicable)
5. Update dependency graph

### 11.5 Archival Notice Format

```markdown
> **ARCHIVED:** This document was archived as of {date}.
> Reason: {reason}
> Historical Reference: {document-id or "None"}
```

---

## 12. Infrastructure Freeze

### 12.1 Freeze Declaration

The documentation infrastructure is frozen as of version 1.0.0.

### 12.2 Frozen Components

The following components are frozen and cannot be modified without an ADR:

- Document hierarchy
- Document ID system (including prefix registry)
- Metadata format
- Owner catalog (10 fixed values)
- Status lifecycle (6 states)
- Versioning policy
- Reference style (always by Document ID)
- Template structure
- Directory structure

### 12.3 Allowed Changes

The following changes are allowed without an ADR:

- Document content (within existing structure)
- New documents (following existing templates)
- ADRs (following existing template)

### 12.4 Structural Change Process

Any structural change requires:
1. New ADR proposing the change
2. Approval from Architecture
3. Update to documentation-governance.md
4. Update to affected documents

---

## 13. Project Focus

The documentation infrastructure is considered stable.

Future work should primarily focus on:

- Domain modeling
- Backend implementation (Spring Boot)
- Frontend implementation (React/PWA)
- Database design and implementation
- API development
- Security implementation
- Testing
- Deployment

Documentation should evolve only when required by development.
