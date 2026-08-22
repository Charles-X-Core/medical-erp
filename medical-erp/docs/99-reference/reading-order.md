# Reading Order

---
Document ID: REF-004
Status: Draft
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [CONSTITUTION]
---

## 1. First Time Reading

For new agents, read in this order:

| Step | Document | Purpose |
|---|---|---|
| 1 | AGENT.md | Constitution — rules of the project |
| 2 | docs/00-product/documentation-governance.md | How documentation works |
| 3 | docs/99-reference/document-map.md | Where everything is located |
| 4 | docs/99-reference/project-glossary.md | Terminology definitions |
| 5 | docs/00-product/vision.md | What we're building |
| 6 | docs/00-product/alcance.md | Scope and boundaries |
| 7 | docs/01-architecture/architecture.md | How it's structured |
| 8 | docs/01-architecture/tech-stack.md | Technologies used |
| 9 | docs/02-domain/ubiquitous-language.md | Domain vocabulary |
| 10 | docs/02-domain/pacientes.md | Main entity |

---

## 2. Task-Based Reading

### 2.1 Domain Changes (Add/Modify Entity)

| Step | Document | Purpose |
|---|---|---|
| 1 | AGENT.md | Constitution |
| 2 | docs/00-product/domain-engineering-guide.md | Domain rules |
| 3 | docs/02-domain/ubiquitous-language.md | Domain vocabulary |
| 4 | docs/02-domain/{entity}.md | Specific entity |
| 5 | docs/04-database/db-erd.md | Database schema |
| 6 | docs/05-api/endpoints.md | API endpoints |
| 7 | docs/04-database/db-conventions.md | Naming conventions |

### 2.2 API Changes (Add/Modify Endpoint)

| Step | Document | Purpose |
|---|---|---|
| 1 | AGENT.md | Constitution |
| 2 | docs/05-api/rest-conventions.md | REST rules |
| 3 | docs/05-api/endpoints.md | Existing endpoints |
| 4 | docs/02-domain/{entity}.md | Related entity |
| 5 | docs/05-api/errors.md | Error handling |
| 6 | docs/04-database/db-erd.md | Database schema |
| 7 | docs/06-development/coding-standards.md | Code standards |

### 2.3 Database Changes (Add/Modify Table)

| Step | Document | Purpose |
|---|---|---|
| 1 | AGENT.md | Constitution |
| 2 | docs/04-database/db-erd.md | Current schema |
| 3 | docs/04-database/db-conventions.md | Naming rules |
| 4 | docs/04-database/db-migrations.md | Migration process |
| 5 | docs/02-domain/{entity}.md | Related entities |
| 6 | docs/05-api/endpoints.md | Affected endpoints |

### 2.4 Security Changes (Add/Modify Auth)

| Step | Document | Purpose |
|---|---|---|
| 1 | AGENT.md | Constitution |
| 2 | docs/03-security/security-policy.md | Security rules |
| 3 | docs/03-security/{specific}.md | Specific topic |
| 4 | docs/02-domain/seguridad.md | Domain security |
| 5 | docs/05-api/endpoints.md | Affected endpoints |
| 6 | docs/04-database/db-erd.md | Security tables |

### 2.5 Deployment Changes

| Step | Document | Purpose |
|---|---|---|
| 1 | AGENT.md | Constitution |
| 2 | docs/07-deployment/production.md | Production setup |
| 3 | docs/07-deployment/monitoring.md | Monitoring setup |
| 4 | docs/03-security/backups.md | Backup strategy |
| 5 | docs/03-security/encryption.md | SSL/TLS setup |

### 2.6 New ADR (Architecture Decision)

| Step | Document | Purpose |
|---|---|---|
| 1 | AGENT.md | Constitution |
| 2 | docs/00-product/domain-engineering-guide.md | Decision process |
| 3 | docs/08-adr/ | Existing ADRs (check conflicts) |
| 4 | templates/adr-template.md | ADR template |

### 2.7 Bug Fix

| Step | Document | Purpose |
|---|---|---|
| 1 | AGENT.md | Constitution |
| 2 | docs/06-development/coding-standards.md | Code standards |
| 3 | docs/05-api/errors.md | Error codes |
| 4 | docs/02-domain/{entity}.md | Affected entity |
| 5 | docs/04-database/db-erd.md | Schema (if needed) |

### 2.8 New Feature (Full Stack)

| Step | Document | Purpose |
|---|---|---|
| 1 | AGENT.md | Constitution |
| 2 | docs/00-product/vision.md | Product vision |
| 3 | docs/00-product/roadmap.md | Roadmap |
| 4 | docs/02-domain/{entity}.md | Domain model |
| 5 | docs/04-database/db-erd.md | Database schema |
| 6 | docs/05-api/endpoints.md | API endpoints |
| 7 | docs/06-development/coding-standards.md | Code standards |
| 8 | docs/06-development/branch-strategy.md | Branch workflow |
| 9 | docs/06-development/testing.md | Testing strategy |

---

## 3. Role-Based Reading

### 3.1 Backend Developer

| Priority | Documents |
|---|---|
| Must read | AGENT.md, DEV-001, ARCH-001, ARCH-004 |
| Should read | DOM-*, API-*, DB-* |
| Reference | SEC-*, REF-001 |

### 3.2 Frontend Developer

| Priority | Documents |
|---|---|
| Must read | AGENT.md, DEV-001, ARCH-004 |
| Should read | API-002 (endpoints), DOM-* (data models) |
| Reference | REF-001 |

### 3.3 DevOps

| Priority | Documents |
|---|---|
| Must read | AGENT.md, OPS-002, OPS-003 |
| Should read | SEC-005, SEC-006, ARCH-004 |
| Reference | DEV-002 |

### 3.4 Database Administrator

| Priority | Documents |
|---|---|
| Must read | AGENT.md, DB-001, DB-002, DB-003 |
| Should read | DOM-*, SEC-006 |
| Reference | ARCH-001 |

---

## 4. Quick Reference

| Need | Read |
|---|---|
| How to work | AGENT.md, docs/00-product/workflow.md |
| What to build | docs/00-product/vision.md, docs/00-product/alcance.md |
| How it's built | docs/01-architecture/architecture.md |
| Domain details | docs/02-domain/ (specific entity) |
| Security rules | docs/03-security/security-policy.md |
| Database schema | docs/04-database/db-erd.md |
| API design | docs/05-api/endpoints.md |
| Code standards | docs/06-development/coding-standards.md |
| Deployment | docs/07-deployment/production.md |
| Decisions | docs/08-adr/ |
| Terminology | docs/99-reference/project-glossary.md |
| Document map | docs/99-reference/document-map.md |
| Dependencies | docs/99-reference/dependency-graph.md |

---

## 5. Document Categories

### 5.1 Core Documents (Always Read)

| Document | Purpose |
|---|---|
| AGENT.md | Constitution |
| GOV-001 | Documentation rules |
| GOV-002 | Domain rules |

### 5.2 Product Documents (What)

| Document | Purpose |
|---|---|
| PRD-001 | Vision |
| PRD-002 | Scope |
| PRD-003 | Roadmap |

### 5.3 Technical Documents (How)

| Document | Purpose |
|---|---|
| ARCH-001 | Architecture |
| ARCH-002 | Modules |
| ARCH-003 | Folder structure |
| ARCH-004 | Tech stack |
| DEV-001 | Code standards |
| DEV-002 | Branch strategy |
| DEV-003 | Testing |

### 5.4 Domain Documents (Business)

| Document | Purpose |
|---|---|
| DOM-UL-001 | Vocabulary |
| DOM-{entity} | Entity models |
| DOM-DEC-001 | Business decisions |

### 5.5 Implementation Documents (Build)

| Document | Purpose |
|---|---|
| DB-* | Database |
| API-* | API |
| SEC-* | Security |
| OPS-* | Deployment |

---

## Glosario Relacionado

- **Mapa de Documentos:** REF-002
- **Grafo de Dependencias:** REF-003
- **Matriz de Contexto:** REF-005
