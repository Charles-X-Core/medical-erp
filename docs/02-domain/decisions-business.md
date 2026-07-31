# Business Decisions Required

---
Document ID: DOM-DEC-001
Status: Draft
Version: 0.3.0
Owner: Domain
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [GOV-002, DOM-UL-001]
---

## 1. Purpose

This document groups all decisions that require input from the clinic. Only questions that change system behavior are included. Technical decisions and configuration defaults are resolved by architecture.

## 2. How to Use

The clinic only needs to answer sections A and B. Sections C and D are already resolved.

---

## A. BLOCKERS (Must Answer Before Development)

These decisions block the domain model. No development can start until they are answered.

| ID | Question | Impact | Module |
|---|---|---|---|
| BLO-001 | ¿Puede modificarse una consulta después de firmarla? | Define si las consultas son inmutables | Consultas |
| BLO-002 | ¿Puede modificarse un documento después de firmarlo? | Define si los documentos son inmutables | Documentos |
| BLO-003 | ¿Puede eliminarse una historia clínica? | Define si las historias son permanentes | Historias |
| BLO-004 | ¿Se permite reprogramar una citas? | Define el flujo de estados de citas | Citas |

---

## B. BUSINESS DECISIONS (Clinic Decides)

These decisions change system behavior based on clinic policy.

### Security

| ID | Question | Options | Default |
|---|---|---|---|
| BIZ-SEC-001 | ¿Qué roles existen en el sistema? | doctora, enfermera, admin | — |

### Patients

| ID | Question | Options | Default |
|---|---|---|---|
| BIZ-PAC-001 | ¿Se permiten pacientes sin documento de identidad? | Sí / No | No |
| BIZ-PAC-002 | ¿Se permiten múltiples teléphonos por paciente? | Sí / No | Sí |

### Appointments

| ID | Question | Options | Default |
|---|---|---|---|
| BIZ-CIT-001 | ¿Qué tipos de cita existen? | Lista de tipos | — |
| BIZ-CIT-002 | ¿Se permiten múltiples citas para el mismo paciente en el mismo día? | Sí / No | Sí |
| BIZ-CIT-003 | ¿Se debe notificar al paciente cuando se agenda una cita? | Sí / No | No |

### Consultations

| ID | Question | Options | Default |
|---|---|---|---|
| BIZ-CON-001 | ¿Solo la doctora puede crear consultas? | Sí / No | Sí |
| BIZ-CON-002 | ¿Se permiten múltiples diagnósticos principales? | Sí / No | Sí |

### Medical History

| ID | Question | Options | Default |
|---|---|---|---|
| BIZ-HCL-001 | ¿Solo la doctora puede editar la historia clínica? | Sí / No | Sí |
| BIZ-HCL-002 | ¿Se permiten adjuntos (imágenes, PDFs) en la historia clínica? | Sí / No | Sí |

### Documents

| ID | Question | Options | Default |
|---|---|---|---|
| BIZ-DOC-001 | ¿Solo la doctora puede firmar documentos? | Sí / No | Sí |
| BIZ-DOC-002 | ¿Se permiten documentos sin firma (borrador)? | Sí / No | Sí |

---

## C. TECHNICAL DECISIONS (Resolved by Architecture)

These decisions are resolved by architecture following best practices. No clinic input required.

| ID | Decision | Rationale | Source |
|---|---|---|---|
| TEC-SEG-001 | Solo un usuario con rol admin | Security best practice | BR-SEG-003 |
| TEC-SEG-002 | Un usuario no puede desactivarse a sí mismo | Security best practice | BR-SEG-004 |
| TEC-SEG-003 | Sesión única activa por usuario | Security for medical data | — |
| TEC-AGE-001 | No agendas compartidas inicialmente | Simplicity | — |
| TEC-AGE-002 | Configuración por patrón semanal | Simplicity | — |
| TEC-AGE-003 | Un solo rango de disponibilidad por día | Simplicity | — |
| TEC-AGE-004 | Sin bloques recurrentes inicialmente | Simplicity | — |
| TEC-PAC-001 | No eliminación de pacientes con historial | Data integrity | BR-PAC-002 |
| TEC-PAC-002 | Sin fusión de pacientes inicialmente | Complexity | — |
| TEC-PAC-003 | Audit log para cambios en datos personales | Best practice | — |
| TEC-PAC-004 | Búsqueda por nombre parcial habilitada | Standard UX | — |
| TEC-CIT-001 | Sin citas superpuestas | Standard | — |
| TEC-CIT-002 | Verificación de disponibilidad requerida | Required | — |
| TEC-CON-001 | Consultas inmutables después de firmar | Legal compliance | — |
| TEC-CON-002 | Audit log para consultas | Best practice | — |
| TEC-HCL-001 | Audit log para historias | Best practice | — |
| TEC-HCL-002 | Sin versionado de antecedentes inicialmente | Complexity | — |
| TEC-DOC-001 | Documentos inmutables después de firmar | Legal compliance | — |
| TEC-DOC-002 | Sin versionado de documentos inicialmente | Complexity | — |

---

## D. CONFIGURATION DEFAULTS (Parameterized)

These values are configurable and can be changed without modifying the domain model.

| ID | Parameter | Default Value | Module | Notes |
|---|---|---|---|---|
| CFG-SEG-001 | Contraseña mínima caracteres | 8 | Security | — |
| CFG-SEG-002 | Expiración sesión (minutos) | 30 | Security | — |
| CFG-AGE-001 | Duración mínima cita (minutos) | 15 | Agenda | — |
| CFG-AGE-002 | Duración máxima cita (minutos) | 480 | Agenda | — |
| CFG-AGE-003 | Duración predeterminada cita (minutos) | 30 | Agenda | — |
| CFG-PAC-001 | Máximo teléfonos por paciente | 3 | Pacientes | — |
| CFG-PAC-002 | Estado civil valores permitidos | Soltero, Casado, Divorciado, Viudo, Conviviente | Pacientes | — |

---

## E. Summary

| Category | Count | Clinic Action |
|---|---|---|
| BLOCKERS | 4 | Must answer |
| BUSINESS DECISIONS | 12 | Should answer |
| **TOTAL preguntas para la clínica** | **16** | |
| TECHNICAL DECISIONS | 19 | No action needed |
| CONFIGURATION DEFAULTS | 7 | No action needed |

## F. Next Steps

1. Clinic reviews BLOCKERS (4 questions)
2. Clinic reviews BUSINESS DECISIONS (12 questions)
3. Architecture updates domain documents with answers
4. Domain is approved
5. Database Design begins
