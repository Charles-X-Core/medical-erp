# Folder Structure

---
Document ID: ARCH-003
Status: Draft
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [ARCH-001, ARCH-004]
---

## 1. Project Root

```
medical-erp/
│
├── AGENT.md                          # Engineering constitution
├── README.md                         # Project readme
│
├── docs/                             # Documentation (see: Section 6)
├── .agent/                           # Agent configuration
├── templates/                        # Document templates
├── logs/                             # Logs and changelogs
│
├── backend/                          # Spring Boot application
├── frontend/                         # PWA Tablet (React)
└── optimal-health-now/               # Landing Page (EXISTING)
```

---

## 2. Backend Structure

```
backend/
│
├── pom.xml                           # Maven configuration
│
├── src/
│   └── main/
│       ├── java/
│       │   └── com/
│       │       └── medicalerp/
│       │           │
│       │           ├── MedicalErpApplication.java    # Entry point
│       │           │
│       │           ├── config/                       # Global configuration
│       │           │   ├── WebConfig.java
│       │           │   ├── SecurityConfig.java
│       │           │   ├── JpaConfig.java
│       │           │   └── MailConfig.java
│       │           │
│       │           ├── security/                     # Security module
│       │           │   ├── controller/
│       │           │   │   └── AuthController.java
│       │           │   ├── dto/
│       │           │   │   ├── LoginRequest.java
│       │           │   │   └── LoginResponse.java
│       │           │   ├── entity/
│       │           │   │   ├── Usuario.java
│       │           │   │   ├── Rol.java
│       │           │   │   └── Permiso.java
│       │           │   ├── repository/
│       │           │   │   ├── UsuarioRepository.java
│       │           │   │   ├── RolRepository.java
│       │           │   │   └── PermisoRepository.java
│       │           │   ├── service/
│       │           │   │   ├── AuthService.java
│       │           │   │   ├── UserService.java
│       │           │   │   └── RoleService.java
│       │           │   └── util/
│       │           │       ├── JwtUtil.java
│       │           │       └── PasswordUtil.java
│       │           │
│       │           ├── modules/
│       │           │   │
│       │           │   ├── patients/                 # Patients module
│       │           │   │   ├── controller/
│       │           │   │   │   └── PacienteController.java
│       │           │   │   ├── dto/
│       │           │   │   │   ├── PacienteRequest.java
│       │           │   │   │   └── PacienteResponse.java
│       │           │   │   ├── entity/
│       │           │   │   │   └── Paciente.java
│       │           │   │   ├── mapper/
│       │           │   │   │   └── PacienteMapper.java
│       │           │   │   ├── repository/
│       │           │   │   │   └── PacienteRepository.java
│       │           │   │   └── service/
│       │           │   │       └── PacienteService.java
│       │           │   │
│       │           │   ├── agenda/                   # Agenda module
│       │           │   │   ├── controller/
│       │           │   │   │   └── AgendaController.java
│       │           │   │   ├── dto/
│       │           │   │   │   ├── DisponibilidadRequest.java
│       │           │   │   │   └── BloqueoRequest.java
│       │           │   │   ├── entity/
│       │           │   │   │   ├── Agenda.java
│       │           │   │   │   ├── Disponibilidad.java
│       │           │   │   │   ├── Bloqueo.java
│       │           │   │   │   └── TipoCita.java
│       │           │   │   ├── repository/
│       │           │   │   │   ├── AgendaRepository.java
│       │           │   │   │   ├── DisponibilidadRepository.java
│       │           │   │   │   ├── BloqueoRepository.java
│       │           │   │   │   └── TipoCitaRepository.java
│       │           │   │   └── service/
│       │           │   │       └── AgendaService.java
│       │           │   │
│       │           │   ├── appointments/             # Appointments module
│       │           │   │   ├── controller/
│       │           │   │   │   └── CitaController.java
│       │           │   │   ├── dto/
│       │           │   │   │   ├── CitaRequest.java
│       │           │   │   │   └── CitaResponse.java
│       │           │   │   ├── entity/
│       │           │   │   │   └── Cita.java
│       │           │   │   ├── mapper/
│       │           │   │   │   └── CitaMapper.java
│       │           │   │   ├── repository/
│       │           │   │   │   └── CitaRepository.java
│       │           │   │   └── service/
│       │           │   │       └── CitaService.java
│       │           │   │
│       │           │   ├── consultations/            # Consultations module
│       │           │   │   ├── controller/
│       │           │   │   │   └── ConsultaController.java
│       │           │   │   ├── dto/
│       │           │   │   │   ├── ConsultaRequest.java
│       │           │   │   │   ├── ConsultaResponse.java
│       │           │   │   │   ├── SignosVitalesDTO.java
│       │           │   │   │   └── DiagnosticoDTO.java
│       │           │   │   ├── entity/
│       │           │   │   │   ├── Consulta.java
│       │           │   │   │   ├── SignosVitales.java
│       │           │   │   │   └── Diagnostico.java
│       │           │   │   ├── mapper/
│       │           │   │   │   └── ConsultaMapper.java
│       │           │   │   ├── repository/
│       │           │   │   │   └── ConsultaRepository.java
│       │           │   │   └── service/
│       │           │   │       └── ConsultaService.java
│       │           │   │
│       │           │   └── documents/                # Documents module
│       │           │       ├── controller/
│       │           │       │   └── DocumentoController.java
│       │           │       ├── dto/
│       │           │       │   ├── DocumentoRequest.java
│       │           │       │   └── DocumentoResponse.java
│       │           │       ├── entity/
│       │           │       │   └── Documento.java
│       │           │       ├── mapper/
│       │           │       │   └── DocumentoMapper.java
│       │           │       ├── repository/
│       │           │       │   └── DocumentoRepository.java
│       │           │       ├── service/
│       │           │       │   ├── DocumentoService.java
│       │           │       │   ├── PdfService.java
│       │           │       │   └── SignatureService.java
│       │           │       └── util/
│       │           │           └── HashUtil.java
│       │           │
│       │           └── shared/                       # Shared utilities
│       │               ├── dto/
│       │               │   ├── ApiResponse.java
│       │               │   └── PaginatedResponse.java
│       │               ├── entity/
│       │               │   └── BaseEntity.java
│       │               ├── exception/
│       │               │   ├── BusinessException.java
│       │               │   ├── ResourceNotFoundException.java
│       │               │   └── GlobalExceptionHandler.java
│       │               └── util/
│       │                   ├── DateUtil.java
│       │                   └── ValidationUtil.java
│       │
│       └── resources/
│           ├── application.properties                # Default config
│           ├── application-dev.properties            # Development config
│           ├── application-prod.properties           # Production config
│           └── db/
│               └── migration/                        # Flyway migrations
│                   ├── V1__create_security_tables.sql
│                   ├── V2__create_patients_table.sql
│                   ├── V3__create_agenda_tables.sql
│                   ├── V4__create_appointments_table.sql
│                   ├── V5__create_consultations_table.sql
│                   └── V6__create_documents_table.sql
│
├── src/
│   └── test/
│       └── java/
│           └── com/
│               └── medicalerp/
│                   ├── MedicalErpApplicationTests.java
│                   ├── security/
│                   ├── patients/
│                   ├── agenda/
│                   ├── appointments/
│                   ├── consultations/
│                   └── documents/
│
└── target/                           # Build output (gitignored)
```

---

## 3. Frontend Structure (PWA Tablet)

```
frontend/
│
├── package.json                      # Dependencies
├── vite.config.js                    # Vite configuration
├── index.html                        # Entry HTML
│
├── public/
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service worker
│   └── icons/                        # App icons
│
├── src/
│   ├── main.jsx                      # Entry point
│   ├── App.jsx                       # Root component
│   ├── App.scss                      # Global styles
│   │
│   ├── api/
│   │   ├── axios.js                  # Axios instance with JWT
│   │   ├── auth.js                   # Auth API calls
│   │   ├── patients.js               # Patients API calls
│   │   ├── appointments.js           # Appointments API calls
│   │   ├── consultations.js          # Consultations API calls
│   │   └── documents.js              # Documents API calls
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   ├── Spinner/
│   │   │   └── Toast/
│   │   ├── layout/
│   │   │   ├── Header/
│   │   │   ├── Sidebar/
│   │   │   └── Footer/
│   │   └── medical/
│   │       ├── PatientCard/
│   │       ├── AppointmentCard/
│   │       ├── VitalSignsForm/
│   │       └── SignatureCanvas/
│   │
│   ├── pages/
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── patients/
│   │   │   ├── PatientList.jsx
│   │   │   ├── PatientForm.jsx
│   │   │   └── PatientDetail.jsx
│   │   ├── appointments/
│   │   │   ├── AppointmentCalendar.jsx
│   │   │   ├── AppointmentForm.jsx
│   │   │   └── AppointmentDetail.jsx
│   │   ├── consultations/
│   │   │   ├── ConsultationForm.jsx
│   │   │   └── ConsultationDetail.jsx
│   │   └── documents/
│   │       ├── DocumentList.jsx
│   │       ├── DocumentViewer.jsx
│   │       └── SignaturePad.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── usePatients.js
│   │   ├── useAppointments.js
│   │   └── useDocuments.js
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── styles/
│   │   ├── _variables.scss
│   │   ├── _mixins.scss
│   │   └── global.scss
│   │
│   └── utils/
│       ├── constants.js
│       ├── formatters.js
│       └── validators.js
│
├── .env                              # Environment variables
├── .env.development                  # Dev environment
└── .env.production                   # Production environment
```

---

## 4. Landing Page Structure (EXISTING)

```
optimal-health-now/
│
├── package.json
├── vite.config.js
├── index.html
│
├── public/
│   └── ...
│
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Contact.jsx
│   │   └── About.jsx
│   └── styles/
│
└── ...
```

**Note:** This is the existing landing page. Only backend connection for contact form is needed.

---

## 5. Package Descriptions

### 5.1 Backend Packages

| Package | Purpose | Contents |
|---|---|---|
| `config` | Global configuration | Web, Security, JPA, Mail configs |
| `security` | Authentication/Authorization | Auth, Users, Roles, JWT |
| `modules.*` | Business modules | Domain-specific code |
| `shared` | Shared utilities | DTOs, exceptions, utils |

### 5.2 Module Package Structure

Each module follows this structure:

| Package | Purpose |
|---|---|
| `controller` | REST endpoints |
| `dto` | Request/Response objects |
| `entity` | JPA entities |
| `mapper` | DTO ↔ Entity mapping |
| `repository` | Data access (Spring Data) |
| `service` | Business logic |
| `util` | Module-specific utilities (optional) |

### 5.3 Frontend Packages

| Package | Purpose |
|---|---|
| `api` | API communication (Axios) |
| `components` | Reusable UI components |
| `pages` | Route-level components |
| `hooks` | Custom React hooks |
| `context` | React context providers |
| `styles` | SCSS stylesheets |
| `utils` | Utility functions |

---

## 6. Documentation Structure

```
docs/
│
├── 00-product/                       # Product documentation
│   ├── documentation-governance.md   # GOV-001
│   ├── domain-engineering-guide.md   # GOV-002
│   ├── vision.md                     # PRD-001
│   ├── alcance.md                    # PRD-002
│   └── roadmap.md                    # PRD-003
│
├── 01-architecture/                  # Architecture documentation
│   ├── architecture.md               # ARCH-001
│   ├── modules.md                    # ARCH-002
│   ├── folder-structure.md           # ARCH-003
│   └── tech-stack.md                 # ARCH-004
│
├── 02-domain/                        # Domain documentation
│   ├── ubiquitous-language.md        # DOM-UL-001
│   ├── seguridad.md                  # DOM-SEG-001
│   ├── agenda.md                     # DOM-AGE-001
│   ├── pacientes.md                  # DOM-PAC-001
│   ├── citas.md                      # DOM-CIT-001
│   ├── consultas.md                  # DOM-CON-001
│   ├── historias-clinicas.md         # DOM-HCL-001
│   ├── documentos.md                 # DOM-DOC-001
│   └── decisions-business.md         # DOM-DEC-001
│
├── 03-security/                      # Security documentation
│   ├── security-policy.md            # SEC-001
│   ├── authentication.md             # SEC-002
│   ├── authorization.md              # SEC-003
│   ├── audit.md                      # SEC-004
│   ├── encryption.md                 # SEC-005
│   └── backups.md                    # SEC-006
│
├── 04-database/                      # Database documentation
│   ├── erd.md                        # DB-001
│   ├── db-pacientes.md               # DB-PAC-001
│   ├── conventions.md                # DB-002
│   └── migrations.md                 # DB-003
│
├── 05-api/                           # API documentation
│   ├── rest-conventions.md           # API-001
│   ├── endpoints.md                  # API-002
│   └── errors.md                     # API-003
│
├── 06-development/                   # Development documentation
│   ├── coding-standards.md           # DEV-001
│   ├── branch-strategy.md            # DEV-002
│   └── testing.md                    # DEV-003
│
├── 07-deployment/                    # Deployment documentation
│   ├── docker.md                     # OPS-001
│   ├── production.md                 # OPS-002
│   └── monitoring.md                 # OPS-003
│
├── 08-adr/                           # Architecture Decision Records
│   ├── ADR-0001-spring-boot.md
│   ├── ADR-0002-mysql.md
│   ├── ADR-0003-modular-monolith.md
│   └── ADR-0004-no-docker.md
│
└── 99-reference/                     # Reference documentation
    ├── project-glossary.md           # REF-001
    ├── document-map.md               # REF-002
    ├── dependency-graph.md           # REF-003
    ├── reading-order.md              # REF-004
    ├── context-matrix.md             # REF-005
    └── naming.md                     # REF-006
```

---

## 7. File Naming Conventions

### 7.1 Java Files

| Type | Convention | Example |
|---|---|---|
| Entity | PascalCase.java | `Paciente.java` |
| Repository | PascalCaseRepository.java | `PacienteRepository.java` |
| Service | PascalCaseService.java | `PacienteService.java` |
| Controller | PascalCaseController.java | `PacienteController.java` |
| DTO | PascalCaseRequest/Response.java | `PacienteRequest.java` |

### 7.2 React Files

| Type | Convention | Example |
|---|---|---|
| Component | PascalCase.jsx | `PatientCard.jsx` |
| Page | PascalCase.jsx | `PatientList.jsx` |
| Hook | camelCase.js | `usePatients.js` |
| API | camelCase.js | `patients.js` |
| Style | kebab-case.scss | `patient-card.scss` |

### 7.3 SQL Files

| Type | Convention | Example |
|---|---|---|
| Migration | V{N}__description.sql | `V1__create_security_tables.sql` |

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
