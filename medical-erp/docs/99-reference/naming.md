# Naming Conventions

---
Document ID: REF-006
Status: Draft
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [CONSTITUTION]
---

## 1. Document IDs

### 1.1 Format

```
{PREFIX}-{NUMBER}
```

### 1.2 Prefixes

| Prefix | Directory | Example | Description |
|---|---|---|---|
| GOV | docs/00-product/ | GOV-001 | Gobernanza |
| PRD | docs/00-product/ | PRD-001 | Producto |
| ARCH | docs/01-architecture/ | ARCH-001 | Arquitectura |
| DOM-{entity} | docs/02-domain/ | DOM-PAC-001 | Dominio |
| SEC | docs/03-security/ | SEC-001 | Seguridad |
| DB | docs/04-database/ | DB-001 | Base de datos |
| API | docs/05-api/ | API-001 | API |
| DEV | docs/06-development/ | DEV-001 | Desarrollo |
| OPS | docs/07-deployment/ | OPS-001 | Operaciones |
| ADR | docs/08-adr/ | ADR-0001 | Decisiones |
| REF | docs/99-reference/ | REF-001 | Referencia |
| AGT | .agent/ | AGT-WF | Agentes |

### 1.3 Entity Codes

| Entity | Code | Spanish |
|---|---|---|
| Patient | PAC | Paciente |
| Clinical History | HCL | Historia Clínica |
| Consultation | CON | Consulta |
| Appointment | CIT | Cita |
| Document | DOC | Documento |
| Agenda | AGE | Agenda |
| User | SEG | Seguridad |
| Contact | CON | Contacto |

### 1.4 Document ID Rules

| Rule | Example |
|---|---|
| Permanent, never reuse | DOM-PAC-001 stays forever |
| Sequential numbering | DOM-PAC-001, DOM-PAC-002, DOM-PAC-003 |
| Never skip numbers | Don't jump from 001 to 003 |
| Case sensitive | SEC-001 ≠ sec-001 |

---

## 2. Documentation Files

### 2.1 File Names

| Rule | Example | Incorrect |
|---|---|---|
| Lowercase | `security-policy.md` | `Security-Policy.md` |
| Hyphens for spaces | `db-erd.md` | `db_erd.md` |
| Descriptive | `patient-crud.md` | `pc.md` |
| No special chars | `api-endpoints.md` | `api-endpoints!.md` |

### 2.2 File Name Examples

| Document | File Name |
|---|---|
| Security Policy | `security-policy.md` |
| ERD | `db-erd.md` |
| REST Conventions | `rest-conventions.md` |
| Coding Standards | `coding-standards.md` |
| Domain Guide | `domain-engineering-guide.md` |

---

## 3. Java Code (Backend)

### 3.1 Classes

| Type | Convention | Example |
|---|---|---|
| Entity | PascalCase, singular | `Paciente`, `HistoriaClinica` |
| Repository | Entity + Repository | `PacienteRepository` |
| Service | Entity + Service | `PacienteService` |
| Controller | Entity + Controller | `PacienteController` |
| DTO Request | Entity + Request | `PacienteRequest` |
| DTO Response | Entity + Response | `PacienteResponse` |
| Mapper | Entity + Mapper | `PacienteMapper` |
| Exception | descriptive + Exception | `ResourceNotFoundException` |
| Config | descriptive + Config | `SecurityConfig` |

### 3.2 Methods

| Type | Convention | Example |
|---|---|---|
| Getters | get + Property | `getNombre()`, `getApellidoPaterno()` |
| Setters | set + Property | `setNombre()`, `setEmail()` |
| Finders | findBy + Property | `findByDni()`, `findByEmail()` |
| Creators | crear + Entity | `crearPaciente()` |
| Updaters | actualizar + Entity | `actualizarPaciente()` |
| Deleters | eliminar + Entity | `eliminarPaciente()` |
| Boolean | is + Property | `isActive()`, `isEmailVerified()` |

### 3.3 Variables

| Type | Convention | Example |
|---|---|---|
| Local | camelCase | `patientName`, `emailAddress` |
| Parameter | camelCase | `pacienteId`, `request` |
| Field | camelCase | `apellidoPaterno`, `email` |
| Constant | UPPER_SNAKE | `MAX_RETRY_ATTEMPTS`, `JWT_SECRET` |
| Static final | UPPER_SNAKE | `DEFAULT_PAGE_SIZE` |

### 3.4 Packages

| Level | Convention | Example |
|---|---|---|
| Base | com.clinica | `com.clinica` |
| Module | com.clinica.{module} | `com.clinica.paciente` |
| Sub-module | com.clinica.{module}.{sub} | `com.clinica.paciente.dto` |

### 3.5 Java Examples

```java
// Entity
@Entity
@Table(name = "pacientes")
public class Paciente { ... }

// Repository
@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Long> {
    Optional<Paciente> findByDni(String dni);
    boolean existsByDni(String dni);
}

// Service
@Service
@RequiredArgsConstructor
public class PacienteService {
    public PacienteResponse crear(PacienteRequest request) { ... }
    public PacienteResponse obtenerPorId(Long id) { ... }
    public List<PacienteResponse> listar(...) { ... }
    public PacienteResponse actualizar(Long id, PacienteRequest request) { ... }
    public void eliminar(Long id) { ... }
}

// Controller
@RestController
@RequestMapping("/api/v1/pacientes")
@RequiredArgsConstructor
public class PacienteController {
    @PostMapping
    public ResponseEntity<ApiResponse<PacienteResponse>> crear(...) { ... }
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PacienteResponse>> obtenerPorId(...) { ... }
}

// DTO
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PacienteRequest {
    private String apellidoPaterno;
    private String apellidoMaterno;
    private String nombres;
    private String dni;
}
```

---

## 4. Database (MySQL)

### 4.1 Tables

| Rule | Example | Incorrect |
|---|---|---|
| Lowercase | `pacientes` | `Pacientes` |
| Plural | `pacientes` | `paciente` |
| Snake_case | `historias_clinicas` | `historiasClinicas` |
| Spanish | `citas` | `appointments` |
| No prefixes | `pacientes` | `tbl_pacientes` |

### 4.2 Columns

| Rule | Example | Incorrect |
|---|---|---|
| Lowercase | `apellido_paterno` | `ApellidoPaterno` |
| Snake_case | `fecha_nacimiento` | `fechaNacimiento` |
| Spanish | `nombres` | `first_name` |
| No reserved words | `descripcion` | `description` |
| FK pattern | `usuario_id` | `usuarioId` |

### 4.3 Indexes

| Type | Convention | Example |
|---|---|---|
| Primary | `PRIMARY` | `PRIMARY (id)` |
| Unique | `uk_{table}_{column}` | `uk_pacientes_dni` |
| Index | `idx_{table}_{column}` | `idx_citas_fecha` |
| Foreign | `fk_{table}_{ref}` | `fk_citas_paciente_id` |

### 4.4 Constraints

| Type | Convention | Example |
|---|---|---|
| Primary Key | `pk_{table}` | `pk_pacientes` |
| Foreign Key | `fk_{table}_{column}` | `fk_citas_paciente_id` |
| Unique | `uk_{table}_{column}` | `uk_pacientes_dni` |
| Check | `ck_{table}_{condition}` | `ck_consultas_fecha` |

### 4.5 Database Examples

```sql
CREATE TABLE pacientes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    nombres VARCHAR(200) NOT NULL,
    tipo_documento VARCHAR(10) NOT NULL DEFAULT 'dni',
    dni VARCHAR(20) NOT NULL,
    email VARCHAR(200),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_pacientes_dni UNIQUE (dni)
);

CREATE TABLE citas (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    agenda_id BIGINT NOT NULL,
    paciente_id BIGINT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    CONSTRAINT fk_citas_agenda_id FOREIGN KEY (agenda_id) REFERENCES agendas(id),
    CONSTRAINT fk_citas_paciente_id FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
);

CREATE INDEX idx_citas_fecha ON citas(fecha);
CREATE INDEX idx_pacientes_estado ON pacientes(estado);
```

---

## 5. API Endpoints (REST)

### 5.1 URL Structure

| Rule | Example | Incorrect |
|---|---|---|
| Lowercase | `/api/v1/pacientes` | `/api/v1/Pacientes` |
| Plural | `/api/v1/pacientes` | `/api/v1/paciente` |
| Hyphens | `/api/v1/tipos-cita` | `/api/v1/tiposCita` |
| No verbs | `/api/v1/pacientes` | `/api/v1/getPacientes` |
| Nesting | `/api/v1/pacientes/{id}/historia` | `/api/v1/historia?pacienteId=1` |

### 5.2 HTTP Methods

| Method | Use | Example |
|---|---|---|
| GET | Read | `GET /api/v1/pacientes` |
| POST | Create | `POST /api/v1/pacientes` |
| PUT | Full update | `PUT /api/v1/pacientes/{id}` |
| PATCH | Partial update | `PATCH /api/v1/pacientes/{id}` |
| DELETE | Delete | `DELETE /api/v1/pacientes/{id}` |

### 5.3 Query Parameters

| Parameter | Convention | Example |
|---|---|---|
| Page | `page` | `?page=0` |
| Size | `size` | `?size=20` |
| Sort | `sort` | `?sort=nombre,asc` |
| Filter | `field` | `?estado=activo` |
| Search | `search` | `?search=garcia` |

### 5.4 API Examples

```
GET    /api/v1/pacientes              # List patients
POST   /api/v1/pacientes              # Create patient
GET    /api/v1/pacientes/{id}         # Get patient
PUT    /api/v1/pacientes/{id}         # Update patient
DELETE /api/v1/pacientes/{id}         # Delete patient

GET    /api/v1/pacientes/{id}/historia              # Get clinical history
POST   /api/v1/pacientes/{id}/historia/consultas    # Add consultation

GET    /api/v1/agendas                            # List agendas
POST   /api/v1/agendas/{id}/citas                 # Create appointment
DELETE /api/v1/agendas/{id}/citas/{citaId}        # Cancel appointment

POST   /api/v1/auth/login         # Login
GET    /api/v1/auth/me            # Get current user
POST   /api/v1/contact            # Send contact message
```

---

## 6. Frontend (React)

### 6.1 Components

| Type | Convention | Example |
|---|---|---|
| Component | PascalCase | `PatientList`, `PatientForm` |
| Page | PascalCase + Page | `PatientsPage`, `LoginPage` |
| Hook | camelCase, use prefix | `usePatients`, `useAuth` |
| Context | PascalCase + Context | `AuthContext`, `PatientContext` |

### 6.2 Files

| Type | Convention | Example |
|---|---|---|
| Component | PascalCase.jsx | `PatientList.jsx` |
| Page | PascalCasePage.jsx | `PatientsPage.jsx` |
| Hook | camelCase.js | `usePatients.js` |
| Service | camelCase.js | `patientService.js` |
| Style | Component.module.css | `PatientList.module.css` |

### 6.3 Variables

| Type | Convention | Example |
|---|---|---|
| State | camelCase | `patients`, `loading` |
| Props | camelCase | `patientId`, `onSubmit` |
| Constants | UPPER_SNAKE | `API_BASE_URL`, `MAX_RETRIES` |

---

## 7. Folder Names

### 7.1 Documentation

| Rule | Example | Incorrect |
|---|---|---|
| Lowercase | `01-architecture` | `01-Architecture` |
| Hyphens | `99-reference` | `99_reference` |
| Numbered | `00-product`, `01-architecture` | `product`, `architecture` |
| Descriptive | `03-security` | `sec` |

### 7.2 Code

| Rule | Example | Incorrect |
|---|---|---|
| Lowercase | `paciente` | `Paciente` |
| Singular | `paciente` | `pacientes` |
| Descriptive | `historia-clinica` | `hc` |

### 7.3 Package Structure

```
com.clinica.medicalerp
├── paciente/
│   ├── controller/
│   │   └── PacienteController.java
│   ├── service/
│   │   └── PacienteService.java
│   ├── repository/
│   │   └── PacienteRepository.java
│   ├── dto/
│   │   ├── PacienteRequest.java
│   │   └── PacienteResponse.java
│   ├── mapper/
│   │   └── PacienteMapper.java
│   └── model/
│       └── Paciente.java
├── seguridad/
├── historia/
├── consulta/
├── cita/
├── documento/
├── agenda/
└── common/
    ├── exception/
    ├── config/
    └── util/
```

---

## 8. Configuration Files

### 8.1 Properties

| Rule | Example | Incorrect |
|---|---|---|
| Dot notation | `spring.datasource.url` | `spring_datasource_url` |
| Lowercase | `server.port` | `server.Port` |
| Descriptive | `jwt.expiration` | `jwt.exp` |

### 8.2 YAML (if used)

| Rule | Example |
|---|---|
| 2-space indent | `  port: 8080` |
| Lowercase | `server:` |
| Hyphens | `spring-boot:` |

---

## 9. Naming Quick Reference

| What | Convention | Example |
|---|---|---|
| Document ID | PREFIX-NNN | SEC-001 |
| File name | lowercase-hyphens.md | security-policy.md |
| Java class | PascalCase | PacienteController |
| Java method | camelCase | findByDni() |
| Java variable | camelCase | patientName |
| Java constant | UPPER_SNAKE | MAX_SIZE |
| MySQL table | lowercase_plural | pacientes |
| MySQL column | snake_case | apellido_paterno |
| MySQL index | idx_{table}_{col} | idx_pacientes_dni |
| API endpoint | /lowercase/plural | /api/v1/pacientes |
| React component | PascalCase | PatientList |
| React file | PascalCase.jsx | PatientList.jsx |
| Folder (docs) | NN-name | 01-architecture |
| Folder (code) | lowercase | paciente |

---

## Glosario Relacionado

- **Glosario del Proyecto:** REF-001
- **Estándares de Código:** DEV-001
- **Convenciones de BD:** DB-002
- **Convenciones REST:** API-001
