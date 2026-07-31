# Ubiquitous Language

---
Document ID: DOM-UL-001
Status: Approved
Version: 1.0.0
Owner: Domain
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: true
Depends On: [GOV-002]
---

## 1. Purpose

This document defines the official vocabulary of the Medical ERP domain. Every domain document MUST use these terms exclusively. No new term may be introduced without updating this document first.

## 2. Core Concepts

### 2.1 Security & Access

| Term | Definition | Spanish Equivalent |
|---|---|---|
| Usuario | Person with system access | Usuario |
| Rol | Permission set assigned to a user | Rol |
| Permiso | Specific action allowed for a role | Permiso |
| Sesión | Authenticated access period | Sesión |
| Token | Credential for API authentication | Token |

### 2.2 Agenda

| Term | Definition | Spanish Equivalent |
|---|---|---|
| Agenda | Calendar configuration for a user | Agenda |
| Disponibilidad | Time slots when a user is available | Disponibilidad |
| Bloqueo | Period when a user is not available | Bloqueo |
| Horario | Specific time range within a day | Horario |
| Duración | Length of time for an appointment | Duración |
| Tipo de Cita | Category of appointment | Tipo de Cita |

### 2.3 Patients

| Term | Definition | Spanish Equivalent |
|---|---|---|
| Paciente | Person receiving medical care | Paciente |
| Datos Personales | Personal information of a patient | Datos Personales |
| Contacto | Communication method for a patient | Contacto |
| Documento de Identidad | Official identification document | Documento de Identidad |
| Consentimiento | Authorization given by a patient | Consentimiento |
| Estado | Current status of a patient | Estado |

### 2.4 Appointments

| Term | Definition | Spanish Equivalent |
|---|---|---|
| Cita | Scheduled encounter with a patient | Cita |
| Reserva | Action of creating an appointment | Reserva |
| Confirmación | Patient confirms attendance | Confirmación |
| Reprogramación | Changing appointment date/time | Reprogramación |
| Cancelación | Ending an appointment | Cancelación |
| No Show | Patient does not attend | No Show |
| Estado de Cita | Current status of an appointment | Estado de Cita |

### 2.5 Consultations

| Term | Definition | Spanish Equivalent |
|---|---|---|
| Consulta | Medical encounter with a patient | Consulta |
| Nota | Written observation during consultation | Nota |
| Diagnóstico | Identified medical condition | Diagnóstico |
| Procedimiento | Medical action performed | Procedimiento |
| Observación | Additional medical note | Observación |
| Signos Vitales | Patient vital measurements | Signos Vitales |

### 2.6 Clinical History

| Term | Definition | Spanish Equivalent |
|---|---|---|
| Historia Clínica | Complete medical record of a patient | Historia Clínica |
| Antecedentes | Previous medical conditions | Antecedentes |
| Evolución | Progress of medical conditions over time | Evolución |
| Adjunto | File attached to clinical history | Adjunto |
| Versionado | Version history of clinical history | Versionado |

### 2.7 Documents

| Term | Definition | Spanish Equivalent |
|---|---|---|
| Documento | Official medical document | Documento |
| Consentimiento | Patient authorization document | Consentimiento |
| PDF | Document in PDF format | PDF |
| Resultado | Output of a medical test | Resultado |
| Archivo | Stored file | Archivo |
| Firma | Digital signature on a document | Firma |
| Versión | Version of a document | Versión |
| Borrador | Draft state of a document | Borrador |
| Firmado | Signed state of a document | Firmado |
| Archivado | Archived state of a document | Archivado |

### 2.8 Medical Concepts

| Term | Definition | Spanish Equivalent |
|---|---|---|
| Especialidad | Medical specialty | Especialidad |
| Tratamiento | Medical treatment plan | Tratamiento |
| Receta | Medical prescription | Receta |
| Medicamento | Drug or supplement | Medicamento |
| Indicación | Usage instructions for medication | Indicación |
| Odontograma | Dental chart | Odontograma |
| Necesidad Odontológica | Dental need assessment | Necesidad Odontológica |

### 2.9 Financial

| Term | Definition | Spanish Equivalent |
|---|---|---|
| Pago | Payment received | Pago |
| Costo | Price of a service | Costo |
| Total | Full amount | Total |
| A Cuenta | Amount paid in advance | A Cuenta |
| Saldo | Remaining balance | Saldo |

### 2.10 System

| Term | Definition | Spanish Equivalent |
|---|---|---|
| Auditoría | Log of system events | Auditoría |
| Evento | Something that happened in the system | Evento |
| Soft Delete | Preserving data by marking as inactive | Soft Delete |
| Invariante | Rule that can never be broken | Invariante |
| Value Object | Immutable descriptor | Value Object |
| Entidad | Object with identity | Entidad |
| Aggregate | Cluster of entities treated as a unit | Aggregate |

## 3. Rules

### 3.1 Term Usage

All domain documents MUST use the terms defined in this document. No synonyms, no aliases, no translations.

### 3.2 New Terms

If a new concept is needed:

1. Define it in this document
2. Update the version
3. Then use it in domain documents

### 3.3 Term Conflicts

If a term conflicts with an existing term, the existing term wins. The new concept must find a different name.

## 4. Glossary

| Term | Short Definition |
|---|---|
| Aggregate | Cluster of entities treated as a unit |
| Business Rule | Rule that governs business behavior |
| Domain | The business problem being solved |
| Entity | Object with identity and lifecycle |
| Invariant | Rule that can never be broken |
| Use Case | Operation offered by the module |
| Value Object | Immutable descriptor without identity |
