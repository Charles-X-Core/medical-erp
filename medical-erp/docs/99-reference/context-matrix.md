# Context Matrix

---
Document ID: REF-005
Status: Draft
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [CONSTITUTION]
---

## 1. Task Type → Documents

| Task Type | Required Documents | Optional Documents |
|---|---|---|
| Entity CRUD | DOM-{entity} + DB-001 + API-002 | DEV-001 |
| API Endpoint | API-001 + API-002 + DOM-{entity} | API-003 |
| Database Schema | DB-001 + DB-003 + DOM-{entity} | DB-002 |
| Authentication | SEC-001 + SEC-002 | API-002 |
| Authorization | SEC-001 + SEC-003 | API-002 |
| Audit | SEC-004 + DB-001 | API-002 |
| Encryption | SEC-005 | OPS-002 |
| Backup | SEC-006 | OPS-002, OPS-003 |
| Production Deploy | OPS-002 + SEC-005 + SEC-006 | OPS-003 |
| Monitoring | OPS-003 | OPS-002 |
| New ADR | ADR-0001 + GOV-002 | Existing ADRs |
| Code Standards | DEV-001 | ARCH-001 |
| Branching | DEV-002 | DEV-001 |
| Testing | DEV-003 | DEV-001 |
| Landing Page | DOM-CON-002 + API-002 | ARCH-001 |

---

## 2. Entity → Documents

| Entity | Domain Doc | DB Table | API Endpoints |
|---|---|---|---|
| Paciente | DOM-PAC-001 | pacientes | /api/v1/pacientes |
| Historia Clínica | DOM-HCL-001 | historias_clinicas | /api/v1/pacientes/{id}/historia |
| Consulta | DOM-CON-001 | consultas | /api/v1/historias/{id}/consultas |
| Cita | DOM-CIT-001 | citas | /api/v1/agendas/{id}/citas |
| Documento | DOM-DOC-001 | documentos | /api/v1/consultas/{id}/documentos |
| Agenda | DOM-AGE-001 | agendas | /api/v1/agendas |
| Disponibilidad | DOM-AGE-001 | disponibilidades | /api/v1/agendas/{id}/disponibilidades |
| Bloqueo | DOM-AGE-001 | bloqueos | /api/v1/agendas/{id}/bloqueos |
| Tipo de Cita | DOM-CIT-001 | tipos_cita | /api/v1/tipos-cita |
| Usuario | DOM-SEG-001 | usuarios | /api/v1/users |
| Rol | DOM-SEG-001 | roles | /api/v1/users/{id}/roles |
| Permiso | DOM-SEG-001 | permisos | /api/v1/users/{id}/permisos |
| Mensaje Contacto | DOM-CON-002 | mensajes_contacto | /api/v1/contact |
| Audit Log | SEC-004 | audit_log | /api/v1/audit-logs |

---

## 3. Role → Documents

### 3.1 System Roles

| Role | Accessible Documents |
|---|---|
| admin | All domain docs, all API docs, all DB docs, all SEC docs, all OPS docs |
| doctora | DOM-PAC-001, DOM-HCL-001, DOM-CON-001, DOM-CIT-001, DOM-DOC-001, DOM-AGE-001 |
| enfermera | DOM-PAC-001, DOM-HCL-001, DOM-CON-001, DOM-CIT-001 |

### 3.2 Documentation Roles

| Role | Primary Documents | Secondary Documents |
|---|---|---|
| Architecture | ARCH-*, GOV-001, GOV-002 | All technical docs |
| Domain Expert | DOM-*, GOV-002 | DB-001, API-002 |
| Security | SEC-* | OPS-002, OPS-003 |
| Database | DB-* | DOM-*, API-002 |
| API Lead | API-* | DOM-*, DB-001 |
| Development | DEV-* | ARCH-001, ARCH-003 |
| DevOps | OPS-* | SEC-005, SEC-006 |
| Product | PRD-* | DOM-* |
| Documentation | GOV-*, REF-* | All documents |

---

## 4. Impact Matrix

### 4.1 Document Changes → Affected Documents

| Document Changed | Directly Affected | Indirectly Affected |
|---|---|---|
| AGENT.md | All | — |
| GOV-001 | All | — |
| GOV-002 | DOM-UL-001, all DOM-* | API-002, DB-001 |
| PRD-001 | PRD-002, PRD-003, ARCH-001 | All |
| PRD-002 | PRD-003, ARCH-001 | All |
| ARCH-001 | ARCH-002, ARCH-003, ARCH-004 | All domain, API, DB, DEV |
| ARCH-002 | All domain docs | API-002, DB-001 |
| ARCH-003 | DEV-001 | All code |
| ARCH-004 | All technical docs | DEV-001, OPS-002 |
| DOM-UL-001 | All DOM-*, REF-001 | API-002, DB-001 |
| DOM-SEG-001 | SEC-001, SEC-002, SEC-003 | API-002 |
| DOM-AGE-001 | DOM-CIT-001, DB-001 | API-002 |
| DOM-PAC-001 | DOM-HCL-001, DOM-CON-001, DB-001 | API-002 |
| DOM-CIT-001 | DB-001, API-002 | — |
| DOM-CON-001 | DOM-DOC-001, DB-001 | API-002 |
| DOM-HCL-001 | DB-001, API-002 | — |
| DOM-DOC-001 | DB-001, API-002 | — |
| DOM-CON-002 | DB-001, API-002 | — |
| DOM-DEC-001 | All DOM-* | DB-001, API-002 |
| SEC-001 | SEC-002 through SEC-006 | API-002, OPS-002 |
| SEC-002 | SEC-003, API-002 | — |
| SEC-003 | API-002 | — |
| SEC-004 | DB-001 (audit_log) | API-002 |
| SEC-005 | OPS-002, DB-002 | — |
| SEC-006 | OPS-002, OPS-003 | — |
| DB-001 | All DOM-*, API-002, DB-002, DB-003 | — |
| DB-002 | DB-003, API-001 | — |
| DB-003 | DB-001 | All DOM-* |
| API-001 | API-002, API-003 | — |
| API-002 | API-003 | DOM-*, DB-001 |
| API-003 | — | API-002 |
| DEV-001 | All code | — |
| DEV-002 | OPS-002 | — |
| DEV-003 | All code | — |
| OPS-001 | OPS-002 | — |
| OPS-002 | OPS-003, SEC-006 | — |
| OPS-003 | — | OPS-002 |

---

## 5. Document → Code Mapping

### 5.1 Domain → Java Classes

| Domain Document | Java Package | Classes |
|---|---|---|
| DOM-PAC-001 | com.clinica.paciente | Paciente, PacienteRepository, PacienteService, PacienteController |
| DOM-HCL-001 | com.clinica.historia | HistoriaClinica, HistoriaRepository, HistoriaService, HistoriaController |
| DOM-CON-001 | com.clinica.consulta | Consulta, ConsultaRepository, ConsultaService, ConsultaController |
| DOM-CIT-001 | com.clinica.cita | Cita, CitaRepository, CitaService, CitaController |
| DOM-DOC-001 | com.clinica.documento | Documento, DocumentoRepository, DocumentoService, DocumentoController |
| DOM-AGE-001 | com.clinica.agenda | Agenda, AgendaRepository, AgendaService, AgendaController |
| DOM-SEG-001 | com.clinica.seguridad | Usuario, UsuarioRepository, UsuarioService, AuthController |

### 5.2 API → Java Controllers

| API Document | Controller | Package |
|---|---|---|
| API-002 (Auth) | AuthController | com.clinica.seguridad |
| API-002 (Users) | UserController | com.clinica.seguridad |
| API-002 (Patients) | PacienteController | com.clinica.paciente |
| API-002 (History) | HistoriaController | com.clinica.historia |
| API-002 (Consultations) | ConsultaController | com.clinica.consulta |
| API-002 (Appointments) | CitaController | com.clinica.cita |
| API-002 (Documents) | DocumentoController | com.clinica.documento |
| API-002 (Agendas) | AgendaController | com.clinica.agenda |
| API-002 (Contact) | ContactController | com.clinica.contacto |

---

## 6. Quick Context Lookup

### 6.1 "I need to modify..."

| Modification | Read First |
|---|---|
| Patient fields | DOM-PAC-001, DB-001, API-002 |
| Add new endpoint | API-001, API-002, DOM-{entity} |
| Add new table | DB-001, DB-003, DOM-{entity} |
| Change auth | SEC-001, SEC-002, SEC-003 |
| Change deployment | OPS-002, SEC-005, SEC-006 |
| Add new entity | GOV-002, DOM-UL-001, DB-001, API-002 |
| Fix bug | DEV-001, DOM-{entity}, API-003 |
| Add test | DEV-003, DEV-001 |

### 6.2 "I am a..."

| Role | Start Here |
|---|---|
| New developer | AGENT.md → REF-004 → ARCH-001 |
| Backend dev | DEV-001 → ARCH-001 → DOM-* |
| Frontend dev | DEV-001 → API-002 → DOM-* |
| DevOps | OPS-002 → OPS-003 → SEC-005 |
| DB admin | DB-001 → DB-002 → DB-003 |
| Product owner | PRD-001 → PRD-002 → PRD-003 |

---

## Glosario Relacionado

- **Grafo de Dependencias:** REF-003
- **Orden de Lectura:** REF-004
- **Mapa de Documentos:** REF-002
