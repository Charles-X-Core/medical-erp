# System Modules

---
Document ID: ARCH-002
Status: Draft
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [ARCH-001]
---

## 1. Module Overview

Medical ERP is composed of 6 modules inside a Modular Monolith.

| # | Module | Package | Domain Doc | Description |
|---|---|---|---|---|
| 1 | Security | `security` | DOM-SEG-001 | Authentication, authorization, users |
| 2 | Patients | `modules.patients` | DOM-PAC-001 | Patient management |
| 3 | Agenda | `modules.agenda` | DOM-AGE-001 | Availability, blocks, schedules |
| 4 | Appointments | `modules.appointments` | DOM-CIT-001 | Appointment scheduling |
| 5 | Consultations | `modules.consultations` | DOM-CON-001 | Medical encounters |
| 6 | Documents | `modules.documents` | DOM-DOC-001 | PDF, signatures, archive |

---

## 2. Module Responsibilities

### 2.1 Security Module

**Package:** `com.medicalerp.security`

| Responsibility | Description |
|---|---|
| Authentication | Login/logout with JWT |
| Authorization | RBAC (admin, doctora, enfermera) |
| User Management | CRUD users |
| Role Management | Assign roles to users |
| Password Hashing | BCrypt encryption |

**Entities:**

| Entity | Description |
|---|---|
| Usuario | User account |
| Rol | User role |
| Permiso | Permission |

**Public Interface:**

| Operation | Description |
|---|---|
| `login(email, password)` | Returns JWT token |
| `register(user)` | Creates new user |
| `validateToken(token)` | Validates JWT |
| `getUserId(token)` | Extracts user from token |
| `hasRole(userId, role)` | Checks user role |

**Dependencies:** None

---

### 2.2 Patients Module

**Package:** `com.medicalerp.modules.patients`

| Responsibility | Description |
|---|---|
| Patient CRUD | Create, read, update patients |
| Search | By name, DNI, phone |
| Deactivate | Soft delete (mark inactive) |
| Medical History | Link to Historia Clinica |

**Entities:**

| Entity | Description |
|---|---|
| Paciente | Patient record |

**Public Interface:**

| Operation | Description |
|---|---|
| `createPatient(data)` | Creates new patient |
| `getPatient(id)` | Returns patient by ID |
| `searchPatients(query)` | Searches patients |
| `updatePatient(id, data)` | Updates patient |
| `deactivatePatient(id)` | Marks patient inactive |

**Dependencies:**

| Dependency | Type |
|---|---|
| Security | Required (authentication) |

---

### 2.3 Agenda Module

**Package:** `com.medicalerp.modules.agenda`

| Responsibility | Description |
|---|---|
| Availability | Configure available hours per day |
| Blocks | Block specific dates/times |
| Schedule Types | Define appointment types |
| Daily View | View appointments for a day |

**Entities:**

| Entity | Description |
|---|---|
| Agenda | User schedule |
| Disponibilidad | Available hours |
| Bloqueo | Schedule block |
| TipoCita | Appointment type |

**Public Interface:**

| Operation | Description |
|---|---|
| `getAvailability(userId, date)` | Returns available slots |
| `createBlock(userId, data)` | Creates schedule block |
| `getTypes()` | Returns appointment types |
| `isAvailable(userId, date, time)` | Checks availability |

**Dependencies:**

| Dependency | Type |
|---|---|
| Security | Required (authentication) |

---

### 2.4 Appointments Module

**Package:** `com.medicalerp.modules.appointments`

| Responsibility | Description |
|---|---|
| Scheduling | Book new appointments |
| Status Management | pendiente → confirmada → asistio → completada |
| Cancellation | Cancel with reason |
| Daily/Weekly View | View appointments |

**Entities:**

| Entity | Description |
|---|---|
| Cita | Appointment record |

**Public Interface:**

| Operation | Description |
|---|---|
| `createAppointment(data)` | Books new appointment |
| `confirmAppointment(id)` | Confirms appointment |
| `checkInAppointment(id)` | Marks patient arrived |
| `completeAppointment(id, consultationId)` | Links to consultation |
| `cancelAppointment(id, reason)` | Cancels appointment |
| `getDailyAppointments(date)` | Returns day's appointments |
| `getWeeklyAppointments(date)` | Returns week's appointments |

**Dependencies:**

| Dependency | Type |
|---|---|
| Security | Required (authentication) |
| Patients | Required (patient exists) |
| Agenda | Required (check availability) |

---

### 2.5 Consultations Module

**Package:** `com.medicalerp.modules.consultations`

| Responsibility | Description |
|---|---|
| Create Consultation | Register medical encounter |
| Vital Signs | Record PA, pulse, temp, weight |
| Diagnoses | CIE-10 diagnosis codes |
| Treatment Plan | prescribed treatment |
| Link to History | Attach to patient history |

**Entities:**

| Entity | Description |
|---|---|
| Consulta | Medical consultation |
| SignosVitales | Vital signs (Value Object) |
| Diagnostico | Diagnosis (Value Object) |

**Public Interface:**

| Operation | Description |
|---|---|
| `createConsultation(data)` | Creates consultation |
| `getConsultation(id)` | Returns consultation |
| `getConsultationsByHistory(historyId)` | Lists consultations |
| `updateConsultation(id, data)` | Updates consultation |
| `deleteConsultation(id)` | Deletes consultation |

**Dependencies:**

| Dependency | Type |
|---|---|
| Security | Required (authentication) |
| Appointments | Optional (link from appointment) |

---

### 2.6 Documents Module

**Package:** `com.medicalerp.modules.documents`

| Responsibility | Description |
|---|---|
| Generate PDF | Create PDF from consultation |
| Digital Signature | Canvas-based signature capture |
| Archive | Move to archived state |
| Integrity | SHA256 hash verification |
| Download | Provide PDF for download |

**Entities:**

| Entity | Description |
|---|---|
| Documento | Document record |

**Public Interface:**

| Operation | Description |
|---|---|
| `generateDocument(consultationId)` | Creates PDF document |
| `signDocument(id, signatureImage)` | Applies digital signature |
| `archiveDocument(id)` | Moves to archived state |
| `getDocument(id)` | Returns document |
| `downloadPdf(id)` | Returns PDF file |
| `getDocumentsByPatient(patientId)` | Lists patient documents |

**Dependencies:**

| Dependency | Type |
|---|---|
| Security | Required (authentication) |
| Patients | Required (patient exists) |
| Consultations | Required (source data) |

---

## 3. Module Interfaces

### 3.1 Interface Summary

| Module | Exposes | Consumes |
|---|---|---|
| Security | Auth, User, Role operations | None |
| Patients | Patient CRUD, Search | Security |
| Agenda | Availability, Blocks | Security |
| Appointments | Scheduling, Status | Security, Patients, Agenda |
| Consultations | Consultation CRUD | Security, Appointments (optional) |
| Documents | PDF, Signature, Archive | Security, Patients, Consultations |

### 3.2 Inter-Module Communication

```
Security ──────────────────────────────────────────────►
    │
    │   ┌──────────────────────────────────────────────┐
    │   │                                              │
    ├───┼──► Patients ────────────────────────────────►│
    │   │        │                                     │
    │   │        │  Patient ID                         │
    │   │        ▼                                     │
    │   │   Appointments ◄────────────────────────────┤
    │   │        │                                     │
    │   │        │  Appointment ID                     │
    │   │        ▼                                     │
    │   │   Consultations                              │
    │   │        │                                     │
    │   │        │  Consultation ID                    │
    │   │        ▼                                     │
    │   └──── Documents ◄─────────────────────────────┘
    │
    └──► Agenda ───────────────────────────────────────┘
```

---

## 4. Module Dependencies

### 4.1 Dependency Graph

```
                    ┌──────────┐
                    │ Security │
                    └────┬─────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             ▼             ▼
     ┌──────────┐  ┌──────────┐  ┌──────────┐
     │ Patients │  │  Agenda  │  │          │
     └────┬─────┘  └────┬─────┘  │          │
          │             │        │          │
          └──────┬──────┘        │          │
                 │               │          │
                 ▼               │          │
           ┌──────────┐         │          │
           │   App    │         │          │
           │ointments │         │          │
           └────┬─────┘         │          │
                │               │          │
                ▼               │          │
          ┌──────────┐         │          │
          │Consultas │         │          │
          └────┬─────┘         │          │
               │               │          │
               └───────────────┼──────────┘
                               │
                               ▼
                         ┌──────────┐
                         │Documents │
                         └──────────┘
```

### 4.2 Dependency Matrix

| Module | Security | Patients | Agenda | Appointments | Consultations | Documents |
|---|---|---|---|---|---|---|
| Security | — | — | — | — | — | — |
| Patients | ✅ | — | — | — | — | — |
| Agenda | ✅ | — | — | — | — | — |
| Appointments | ✅ | ✅ | ✅ | — | — | — |
| Consultations | ✅ | — | — | ⚡ | — | — |
| Documents | ✅ | ✅ | — | — | ✅ | — |

**Legend:**
- ✅ Required dependency
- ⚡ Optional dependency
- — No dependency

---

## 5. Module Order (Implementation)

| Order | Module | Depends On | Estimated Effort |
|---|---|---|---|
| 1 | Security | None | 2 days |
| 2 | Patients | Security | 1 day |
| 3 | Agenda | Security | 1 day |
| 4 | Appointments | Security, Patients, Agenda | 2 days |
| 5 | Consultations | Security, Appointments | 2 days |
| 6 | Documents | Security, Patients, Consultations | 3 days |

**Total:** 11 days (backend modules)

---

## 6. Module Testing Strategy

| Module | Unit Tests | Integration Tests | E2E Tests |
|---|---|---|---|
| Security | ✅ | ✅ | ✅ |
| Patients | ✅ | ✅ | ✅ |
| Agenda | ✅ | ✅ | ✅ |
| Appointments | ✅ | ✅ | ✅ |
| Consultations | ✅ | ✅ | ✅ |
| Documents | ✅ | ✅ | ✅ |

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
