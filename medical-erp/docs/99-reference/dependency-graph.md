# Dependency Graph

---
Document ID: REF-003
Status: Draft
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [CONSTITUTION]
---

## 1. Document Hierarchy

### 1.1 Top-Down Structure

```
AGENT.md (Constitution)
├── GOV-001 (Documentation Governance)
│   ├── GOV-002 (Domain Engineering Guide)
│   └── All other documents inherit rules
│
├── PRD-001 (Vision)
│   ├── PRD-002 (Scope)
│   │   └── PRD-003 (Roadmap)
│   └── DOM-* (Domain Documents)
│
├── ARCH-001 (Architecture)
│   ├── ARCH-002 (Modules)
│   ├── ARCH-003 (Folder Structure)
│   └── ARCH-004 (Tech Stack)
│
├── DOM-UL-001 (Ubiquitous Language)
│   ├── DOM-SEG-001 (Security & Access)
│   ├── DOM-AGE-001 (Agenda)
│   ├── DOM-PAC-001 (Patients)
│   ├── DOM-CIT-001 (Appointments)
│   ├── DOM-CON-001 (Consultations)
│   ├── DOM-HCL-001 (Clinical History)
│   ├── DOM-DOC-001 (Documents)
│   ├── DOM-CON-002 (Landing Contact)
│   └── DOM-DEC-001 (Business Decisions)
│
├── SEC-001 (Security Policy)
│   ├── SEC-002 (Authentication)
│   ├── SEC-003 (Authorization)
│   ├── SEC-004 (Audit)
│   ├── SEC-005 (Encryption)
│   └── SEC-006 (Backups)
│
├── DB-001 (ERD)
│   ├── DB-002 (Conventions)
│   ├── DB-003 (Migrations)
│   └── SEED-001 (Admin Seed)
│
├── API-001 (REST Conventions)
│   ├── API-002 (Endpoints)
│   └── API-003 (Errors)
│
├── DEV-001 (Coding Standards)
│   ├── DEV-002 (Branch Strategy)
│   └── DEV-003 (Testing)
│
├── OPS-002 (Production)
│   ├── OPS-003 (Monitoring)
│   └── OPS-001 (Docker - Deprecated)
│
└── REF-* (Reference Documents)
```

---

## 2. Cross-Level Dependencies

### 2.1 Domain → Database

| Domain Document | Database Document | Tables Affected |
|---|---|---|
| DOM-PAC-001 (Pacientes) | DB-001 | pacientes |
| DOM-HCL-001 (Historias) | DB-001 | historias_clinicas |
| DOM-CON-001 (Consultas) | DB-001 | consultas |
| DOM-CIT-001 (Citas) | DB-001 | citas, tipos_cita |
| DOM-DOC-001 (Documentos) | DB-001 | documentos |
| DOM-AGE-001 (Agenda) | DB-001 | agendas, disponibilidades, bloqueos |
| DOM-SEG-001 (Seguridad) | DB-001 | usuarios, roles, permisos |
| DOM-CON-002 (Contacto) | DB-001 | mensajes_contacto |

### 2.2 API → Domain

| API Document | Domain Document | Endpoints Affected |
|---|---|---|
| API-002 (Endpoints) | DOM-PAC-001 | /api/v1/pacientes/* |
| API-002 (Endpoints) | DOM-HCL-001 | /api/v1/pacientes/{id}/historia/* |
| API-002 (Endpoints) | DOM-CON-001 | /api/v1/historias/{id}/consultas/* |
| API-002 (Endpoints) | DOM-CIT-001 | /api/v1/agendas/{id}/citas/* |
| API-002 (Endpoints) | DOM-DOC-001 | /api/v1/consultas/{id}/documentos/* |
| API-002 (Endpoints) | DOM-SEG-001 | /api/v1/auth/*, /api/v1/users/* |
| API-002 (Endpoints) | DOM-CON-002 | /api/v1/contact/* |

### 2.3 Security → All

| Security Document | Affected Documents |
|---|---|
| SEC-001 (Policy) | SEC-002 through SEC-006, API-002, OPS-002 |
| SEC-002 (Authentication) | API-002 (auth endpoints), SEC-003 |
| SEC-003 (Authorization) | API-002 (all endpoints), DOM-* |
| SEC-004 (Audit) | API-002 (audit logs), DB-001 (audit_log) |
| SEC-005 (Encryption) | OPS-002 (SSL), DB-002 (encryption) |
| SEC-006 (Backups) | OPS-002 (backup scripts), OPS-003 (backup check) |

### 2.4 Architecture → All

| Architecture Document | Affected Documents |
|---|---|
| ARCH-001 (Architecture) | All domain, API, DB, DEV docs |
| ARCH-002 (Modules) | All domain docs (module boundaries) |
| ARCH-003 (Folder Structure) | DEV-001 (code organization) |
| ARCH-004 (Tech Stack) | All technical docs (versions, libraries) |

### 2.5 Database → API

| Database Document | API Document | Impact |
|---|---|---|
| DB-001 (ERD) | API-002 (Endpoints) | Request/Response shapes |
| DB-002 (Conventions) | API-001 (REST Conventions) | Naming alignment |
| DB-003 (Migrations) | API-002 (Endpoints) | Schema changes affect endpoints |

### 2.6 Development → All

| Development Document | Affected Documents |
|---|---|
| DEV-001 (Coding Standards) | All code (controllers, services, repositories) |
| DEV-002 (Branch Strategy) | OPS-002 (deployment process) |
| DEV-003 (Testing) | All code (test coverage) |

### 2.7 Deployment → Security

| Deployment Document | Security Document | Impact |
|---|---|---|
| OPS-002 (Production) | SEC-005 (Encryption) | SSL/TLS setup |
| OPS-002 (Production) | SEC-006 (Backups) | Backup scripts |
| OPS-003 (Monitoring) | SEC-004 (Audit) | Health checks, alerting |

---

## 3. Impact Analysis

### 3.1 When Modifying a Document

| Document Modified | Check These Documents |
|---|---|
| AGENT.md | All documents |
| GOV-001 | All documents |
| GOV-002 | DOM-UL-001, all DOM-* |
| ARCH-001 | All domain, API, DB, DEV, OPS docs |
| ARCH-002 | All domain docs (module boundaries) |
| ARCH-004 | All technical docs (library versions) |
| DOM-UL-001 | All DOM-*, API-002, REF-001 |
| DOM-{entity} | API-002, DB-001 |
| SEC-001 | SEC-002 through SEC-006 |
| SEC-002 | SEC-003, API-002 (auth endpoints) |
| SEC-003 | API-002 (all endpoints) |
| DB-001 | All DOM-* docs, API-002 |
| DB-002 | DB-003, API-001 |
| DB-003 | DB-001 (schema changes) |
| API-001 | API-002, API-003 |
| API-002 | API-003, DOM-* |
| API-003 | API-002 |
| DEV-001 | All code |
| OPS-002 | OPS-003, SEC-006 |
| OPS-003 | OPS-002 |

### 3.2 Change Propagation

```
Change in DB-001 (ERD)
    ├── → Update DOM-* (domain models)
    ├── → Update API-002 (endpoints)
    ├── → Update DB-003 (migrations)
    └── → Update DEV-001 (entity classes)

Change in SEC-002 (Authentication)
    ├── → Update SEC-003 (authorization)
    ├── → Update API-002 (auth endpoints)
    └── → Update API-003 (error codes)

Change in ARCH-004 (Tech Stack)
    ├── → Update all technical docs
    ├── → Update DEV-001 (code standards)
    └── → Update OPS-002 (production setup)
```

---

## 4. Complete Dependency List

### 4.1 All Document Dependencies

| Document | Depends On |
|---|---|
| AGENT.md | — |
| GOV-001 | AGENT.md |
| GOV-002 | GOV-001, DOM-UL-001 |
| PRD-001 | AGENT.md |
| PRD-002 | PRD-001 |
| PRD-003 | PRD-002 |
| ARCH-001 | CONSTITUTION, PRD-001, PRD-002 |
| ARCH-002 | ARCH-001 |
| ARCH-003 | ARCH-001, ARCH-002 |
| ARCH-004 | ARCH-001 |
| DOM-UL-001 | GOV-002 |
| DOM-SEG-001 | DOM-UL-001 |
| DOM-AGE-001 | DOM-UL-001 |
| DOM-PAC-001 | DOM-UL-001 |
| DOM-CIT-001 | DOM-UL-001, DOM-PAC-001, DOM-AGE-001 |
| DOM-CON-001 | DOM-UL-001, DOM-PAC-001 |
| DOM-HCL-001 | DOM-UL-001, DOM-PAC-001 |
| DOM-DOC-001 | DOM-UL-001, DOM-CON-001 |
| DOM-CON-002 | DOM-UL-001 |
| DOM-DEC-001 | DOM-UL-001 |
| SEC-001 | CONSTITUTION |
| SEC-002 | SEC-001 |
| SEC-003 | SEC-001, SEC-002 |
| SEC-004 | SEC-001 |
| SEC-005 | SEC-001 |
| SEC-006 | SEC-001, SEC-005 |
| DB-001 | ARCH-001, DOM-* |
| DB-002 | DB-001 |
| DB-003 | DB-001, DB-002 |
| SEED-001 | DB-001 |
| API-001 | ARCH-001 |
| API-002 | API-001, DOM-* |
| API-003 | API-002 |
| DEV-001 | ARCH-001, ARCH-004 |
| DEV-002 | DEV-001 |
| DEV-003 | DEV-001 |
| OPS-001 | ARCH-001 |
| OPS-002 | OPS-001, SEC-005, SEC-006 |
| OPS-003 | OPS-002 |
| REF-001 | CONSTITUTION, DOM-UL-001 |
| REF-002 | CONSTITUTION |
| REF-003 | CONSTITUTION |
| REF-004 | CONSTITUTION |
| REF-005 | CONSTITUTION |
| REF-006 | CONSTITUTION |

---

## Glosario Relacionado

- **Glosario del Proyecto:** REF-001
- **Mapa de Documentos:** REF-002
