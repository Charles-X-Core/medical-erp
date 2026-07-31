# System Architecture

---
Document ID: ARCH-001
Status: Draft
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [CONSTITUTION, PRD-001, PRD-002]
---

## 1. Architecture Overview

Medical ERP uses a **Modular Monolith** architecture: a single deployable unit with clear module boundaries.

### 1.1 Architecture Style

| Aspect | Decision |
|---|---|
| Style | Modular Monolith |
| Deployment | Single JAR |
| Modules | 6 bounded contexts |
| Communication | In-process (interfaces) |
| Database | Shared MySQL instance |

### 1.2 Why Modular Monolith

| Reason | Explanation |
|---|---|
| Simplicity | One deployment, one server, one database |
| Performance | No network overhead between modules |
| Development | Faster to develop and test |
| Maintenance | Easier to maintain than microservices |
| Scalability | Sufficient for single-clinic use case |
| Future | Can extract modules to services if needed |

### 1.3 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────┐              ┌─────────────────┐             │
│   │   PWA Tablet    │              │  Landing Page   │             │
│   │   (React)       │              │  (React)        │             │
│   │                 │              │  [EXISTENTE]    │             │
│   │   • Pacientes   │              │                 │             │
│   │   • Citas       │              │  • Home         │             │
│   │   • Consultas   │              │  • Contacto     │             │
│   │   • Documentos  │              │  • Info         │             │
│   └────────┬────────┘              └────────┬────────┘             │
│            │                                │                       │
│            │ HTTP/REST                      │ HTTP/REST             │
│            │ (JWT Auth)                     │ (Public)              │
│            ▼                                ▼                       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                        VPS (6 vCPU, 12GB RAM)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                    NGINX (Reverse Proxy)                    │  │
│   │                   Port 80/443 → 8080                       │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │              SPRING BOOT APPLICATION (JAR)                  │  │
│   │                   Port 8080                                 │  │
│   │                                                             │  │
│   │  ┌─────────────────────────────────────────────────────┐   │  │
│   │  │                 SECURITY MODULE                     │   │  │
│   │  │  • JWT Authentication                               │   │  │
│   │  │  • RBAC Authorization                               │   │  │
│   │  │  • User Management                                  │   │  │
│   │  └─────────────────────────────────────────────────────┘   │  │
│   │                              │                              │  │
│   │  ┌──────────┬──────────┬─────┴────┬──────────┬──────────┐ │  │
│   │  │          │          │          │          │          │ │  │
│   │  ▼          ▼          ▼          ▼          ▼          ▼ │  │
│   │ ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐      │  │
│   │ │Patients││ Agenda ││  App   ││Consult ││  Doc   │      │  │
│   │ │Module  ││ Module ││Module  ││Module  ││ Module │      │  │
│   │ └────────┘└────────┘└────────┘└────────┘└────────┘      │  │
│   │                                                             │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                      MySQL 8.x                              │  │
│   │                    Port 3306                                │  │
│   │                                                             │  │
│   │  ┌─────────────────────────────────────────────────────┐   │  │
│   │  │ medical_erp_db                                      │   │  │
│   │  │                                                     │   │  │
│   │  │  • usuarios          • disponibilidades             │   │  │
│   │  │  • roles             • bloqueos                     │   │  │
│   │  │  • permisos          • citas                        │   │  │
│   │  │  • pacientes         • consultas                    │   │  │
│   │  │  • historias_clinicas • documentos                  │   │  │
│   │  │  • agendas           • tipos_cita                   │   │  │
│   │  └─────────────────────────────────────────────────────┘   │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                    FILE STORAGE                             │  │
│   │                                                             │  │
│   │  /var/medical-erp/                                          │  │
│   │  ├── pdfs/           (Generated PDFs)                       │  │
│   │  ├── signatures/     (Signature images)                     │  │
│   │  └── backups/        (Database backups)                     │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Components

### 2.1 Backend (Spring Boot Application)

| Component | Technology | Port | Description |
|---|---|---|---|
| API Server | Spring Boot | 8080 | REST API for all modules |
| Security | Spring Security | — | JWT authentication, RBAC |
| Database | JPA/Hibernate | — | ORM for MySQL |
| Mail | Spring Mail | — | Email notifications |

**Modules inside Backend:**

| Module | Package | Responsibility |
|---|---|---|
| Security | `com.medicalerp.security` | Auth, JWT, Users, Roles |
| Patients | `com.medicalerp.modules.patients` | Patient CRUD |
| Agenda | `com.medicalerp.modules.agenda` | Availability, Blocks |
| Appointments | `com.medicalerp.modules.appointments` | Scheduling, States |
| Consultations | `com.medicalerp.modules.consultations` | Medical encounters |
| Documents | `com.medicalerp.modules.documents` | PDF, Signatures, Archive |

### 2.2 Database

| Property | Value |
|---|---|
| Engine | MySQL 8.x |
| Location | Same VPS |
| Port | 3306 |
| Database Name | `medical_erp_db` |
| Charset | utf8mb4 |
| Collation | utf8mb4_unicode_ci |

**Tables by Module:**

| Module | Tables |
|---|---|
| Security | usuarios, roles, permisos, roles_permisos |
| Patients | pacientes |
| Agenda | agendas, disponibilidades, bloqueos, tipos_cita |
| Appointments | citas |
| Consultations | consultas |
| Documents | documentos |

### 2.3 PWA (Tablet Client)

| Property | Value |
|---|---|
| Framework | React 18 |
| Build Tool | Vite |
| Styling | SCSS |
| Offline | Service Worker |
| Installation | Web App Manifest |

**Features:**

| Feature | Description |
|---|---|
| Touch-optimized | Large buttons, easy navigation |
| Offline-first | Read data without internet |
| Responsive | Works on 8"+ tablets |
| Installable | Add to home screen |

### 2.4 Landing Page

| Property | Value |
|---|---|
| Framework | React 18 |
| Status | **EXISTENTE** |
| URL | Public website |
| Features | Home, Contact, Info |

**Needs:**

| Need | Description |
|---|---|
| Backend connection | Contact form → Email |

---

## 3. Communication Patterns

### 3.1 REST API

| Pattern | Description |
|---|---|
| Protocol | HTTP/HTTPS |
| Format | JSON |
| Authentication | JWT Bearer token |
| Versioning | URI path (`/api/v1/...`) |

**API Structure:**

```
/api/v1/
├── /auth           (Login, Register, Refresh)
├── /users          (User management)
├── /patients       (Patient CRUD)
├── /agenda         (Availability)
├── /appointments   (Appointments)
├── /consultations  (Consultations)
├── /documents      (Documents, PDF)
└── /health         (Health check)
```

### 3.2 File Storage

| Type | Location | Description |
|---|---|---|
| PDFs | `/var/medical-erp/pdfs/` | Generated documents |
| Signatures | `/var/medical-erp/signatures/` | Signature images |
| Backups | `/var/medical-erp/backups/` | Database backups |

### 3.3 Email

| Type | Provider | Purpose |
|---|---|---|
| Production | Gmail SMTP | Contact form, notifications |
| Development | Mailtrap | Testing |

---

## 4. Deployment Architecture

### 4.1 VPS Specifications

| Resource | Value |
|---|---|
| CPU | 6 vCPU Cores |
| RAM | 12 GB |
| Storage | 200 GB SSD |
| Port | 300 Mbit/s |
| Snapshots | 2 available |

### 4.2 Software Stack

| Layer | Software | Port |
|---|---|---|
| Reverse Proxy | Nginx | 80/443 |
| Application | OpenJDK 21 | 8080 |
| Database | MySQL 8.x | 3306 |
| SSL | Let's Encrypt | — |

### 4.3 Deployment Diagram

```
Internet
    │
    ▼
┌─────────────────────────────────────┐
│           VPS (Public IP)           │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Nginx (Ports 80/443)       │   │
│  │  • SSL termination          │   │
│  │  • Static files (Landing)   │   │
│  │  • Reverse proxy → :8080    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Spring Boot (:8080)        │   │
│  │  • REST API                 │   │
│  │  • PWA static files         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  MySQL (:3306)              │   │
│  │  • medical_erp_db           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  File System                │   │
│  │  /var/medical-erp/          │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 4.4 No Docker

| Reason | Explanation |
|---|---|
| Simplicity | Direct installation on VPS |
| Resources | No container overhead |
| Debugging | Easier to troubleshoot |
| Maintenance | Less complexity |

---

## 5. Data Flow

### 5.1 Authentication Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │      │  Nginx   │      │  Spring  │      │  MySQL   │
│  (PWA)   │      │          │      │  Boot    │      │          │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │                 │
     │  POST /auth/login                │                 │
     │────────────────>│────────────────>│                 │
     │                 │                 │  Query user     │
     │                 │                 │────────────────>│
     │                 │                 │  User data      │
     │                 │                 │<────────────────│
     │                 │                 │                 │
     │                 │                 │  Generate JWT   │
     │                 │                 │                 │
     │  JWT Token      │                 │                 │
     │<────────────────│<────────────────│                 │
     │                 │                 │                 │
     │  GET /patients (with JWT)         │                 │
     │────────────────>│────────────────>│                 │
     │                 │                 │  Verify JWT     │
     │                 │                 │  Query patients │
     │                 │                 │────────────────>│
     │                 │                 │  Patient data   │
     │                 │                 │<────────────────│
     │  Patients JSON  │                 │                 │
     │<────────────────│<────────────────│                 │
```

### 5.2 Document Generation Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │      │  Spring  │      │  MySQL   │      │  File    │
│  (PWA)   │      │  Boot    │      │          │      │  System  │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │                 │
     │  POST /documents/generate        │                 │
     │  (consultation_id)               │                 │
     │────────────────>│                │                 │
     │                 │  Fetch consultation               │
     │                 │────────────────>│                 │
     │                 │  Consultation data                │
     │                 │<────────────────│                 │
     │                 │                │                 │
     │                 │  Generate PDF  │                 │
     │                 │─────────────────────────────────>│
     │                 │                │  Save PDF       │
     │                 │                │                 │
     │                 │  Calculate SHA256                 │
     │                 │                │                 │
     │                 │  Save document metadata          │
     │                 │────────────────>│                │
     │                 │                │                 │
     │  Document created                │                 │
     │<────────────────│                │                 │
```

### 5.3 Appointment Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │      │  Spring  │      │  MySQL   │      │  Email   │
│  (PWA)   │      │  Boot    │      │          │      │  (SMTP)  │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │                 │
     │  POST /appointments              │                 │
     │────────────────>│                │                 │
     │                 │  Check availability               │
     │                 │────────────────>│                │
     │                 │  Available      │                │
     │                 │<────────────────│                │
     │                 │                │                 │
     │                 │  Create appointment               │
     │                 │────────────────>│                │
     │                 │                │                 │
     │  Appointment created             │                 │
     │<────────────────│                │                 │
     │                 │                │                 │
     │  POST /appointments/:id/confirm  │                 │
     │────────────────>│                │                 │
     │                 │  Update status  │                 │
     │                 │────────────────>│                │
     │                 │                │                 │
     │                 │  Send confirmation email          │
     │                 │─────────────────────────────────>│
     │                 │                │                 │
```

---

## 6. Security Architecture

### 6.1 Authentication

| Aspect | Implementation |
|---|---|
| Token Type | JWT (JSON Web Token) |
| Token Storage | Client-side (localStorage) |
| Token Expiry | 24 hours |
| Refresh Token | Not implemented (MVP) |

### 6.2 Authorization (RBAC)

| Role | Permissions |
|---|---|
| admin | Full access to all modules |
| doctora | Full read/write, no user management |
| enfermera | Read patients, manage appointments |

### 6.3 Security Headers

| Header | Value |
|---|---|
| Authorization | Bearer {jwt_token} |
| Content-Type | application/json |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Metric | Target |
|---|---|
| API Response Time | < 200ms |
| PDF Generation | < 10 seconds |
| Page Load | < 3 seconds |
| Database Query | < 100ms |

### 7.2 Availability

| Metric | Target |
|---|---|
| Uptime | 99% |
| Backup Frequency | Daily |
| Recovery Time | < 1 hour |
| Recovery Point | < 24 hours |

### 7.3 Scalability

| Aspect | Limit |
|---|---|
| Concurrent Users | 5-10 |
| Patients | 10,000+ |
| Documents | 100,000+ |
| Database Size | < 50GB |

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
