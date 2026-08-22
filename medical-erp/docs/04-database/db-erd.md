# Entity Relationship Diagram

---
Document ID: DB-001
Status: Draft
Version: 1.0.0
Owner: Database
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [DOM-SEG-001, DOM-AGE-001, DOM-PAC-001, DOM-HCL-001, DOM-CIT-001, DOM-CON-001, DOM-DOC-001, DOM-CON-002, SEC-004]
---

## 1. Visual Diagram

### 1.1 Complete ERD

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    MEDICAL ERP - ENTITY RELATIONSHIP DIAGRAM                        │
│                                    Database: medical_erp_db                                         │
│                                    Engine: MySQL 8.x (InnoDB)                                       │
│                                    Charset: utf8mb4                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐         ┌─────────────────────────────────────┐
│              usuarios               │         │               roles                 │
├─────────────────────────────────────┤         ├─────────────────────────────────────┤
│ id              BIGINT PK AUTO_INC  │         │ id              BIGINT PK AUTO_INC  │
│ nombre          VARCHAR(255) NOT NULL│         │ nombre          VARCHAR(50) UNIQUE  │
│ email           VARCHAR(255) UNIQUE  │         │ descripcion     VARCHAR(255)        │
│ password        VARCHAR(255) NOT NULL│         │ created_at      TIMESTAMP NOT NULL   │
│ activo          BOOLEAN DEFAULT TRUE │         │ updated_at      TIMESTAMP NOT NULL   │
│ created_at      TIMESTAMP NOT NULL   │         └─────────────────────────────────────┘
│ updated_at      TIMESTAMP NOT NULL   │                   │
└─────────────────────────────────────┘                   │
        │                                                 │
        │ N:M                                             │
        ▼                                                 │
┌─────────────────────────────────────┐                   │
│          usuario_roles              │                   │
├─────────────────────────────────────┤                   │
│ id              BIGINT PK AUTO_INC  │                   │
│ usuario_id      BIGINT FK NOT NULL  │◄──────────────────┘
│ rol_id          BIGINT FK NOT NULL  │
│ created_at      TIMESTAMP NOT NULL  │
│ UNIQUE (usuario_id, rol_id)         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐         ┌─────────────────────────────────────┐
│              permisos               │         │           rol_permisos              │
├─────────────────────────────────────┤         ├─────────────────────────────────────┤
│ id              BIGINT PK AUTO_INC  │         │ id              BIGINT PK AUTO_INC  │
│ nombre          VARCHAR(100) UNIQUE │         │ rol_id          BIGINT FK NOT NULL  │
│ modulo          VARCHAR(50) NOT NULL│         │ permiso_id      BIGINT FK NOT NULL  │
│ accion          VARCHAR(50) NOT NULL│         │ created_at      TIMESTAMP NOT NULL  │
│ descripcion     VARCHAR(255)        │         │ UNIQUE (rol_id, permiso_id)         │
│ created_at      TIMESTAMP NOT NULL  │         └─────────────────────────────────────┘
│ updated_at      TIMESTAMP NOT NULL  │                   │
└─────────────────────────────────────┘                   │
                                                          │
        ┌─────────────────────────────────────────────────┘
        │ N:M
        ▼
┌─────────────────────────────────────┐
│               roles                 │
├─────────────────────────────────────┤
│ id              BIGINT PK AUTO_INC  │
│ nombre          VARCHAR(50) UNIQUE  │
│ descripcion     VARCHAR(255)        │
│ created_at      TIMESTAMP NOT NULL  │
│ updated_at      TIMESTAMP NOT NULL  │
└─────────────────────────────────────┘


┌─────────────────────────────────────┐
│              agendas                │
├─────────────────────────────────────┤
│ id              BIGINT PK AUTO_INC  │
│ usuario_id      BIGINT FK UNIQUE    │
│ nombre          VARCHAR(255) NOT NULL│
│ created_at      TIMESTAMP NOT NULL  │
│ updated_at      TIMESTAMP NOT NULL  │
└─────────────────────────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────────────────────────┐         ┌─────────────────────────────────────┐
│          disponibilidades           │         │              bloqueos               │
├─────────────────────────────────────┤         ├─────────────────────────────────────┤
│ id              BIGINT PK AUTO_INC  │         │ id              BIGINT PK AUTO_INC  │
│ agenda_id       BIGINT FK NOT NULL  │         │ agenda_id       BIGINT FK NOT NULL  │
│ dia_semana      TINYINT NOT NULL    │         │ fecha_inicio    TIMESTAMP NOT NULL  │
│ hora_inicio     TIME NOT NULL       │         │ fecha_fin       TIMESTAMP NOT NULL  │
│ hora_fin        TIME NOT NULL       │         │ motivo          VARCHAR(500)        │
│ created_at      TIMESTAMP NOT NULL  │         │ created_at      TIMESTAMP NOT NULL  │
│ updated_at      TIMESTAMP NOT NULL  │         │ updated_at      TIMESTAMP NOT NULL  │
└─────────────────────────────────────┘         └─────────────────────────────────────┘


┌─────────────────────────────────────┐
│            tipos_cita               │
├─────────────────────────────────────┤
│ id              BIGINT PK AUTO_INC  │
│ nombre          VARCHAR(100) UNIQUE │
│ duracion_minutos INT DEFAULT 30     │
│ descripcion     VARCHAR(255)        │
│ activo          BOOLEAN DEFAULT TRUE│
│ created_at      TIMESTAMP NOT NULL  │
│ updated_at      TIMESTAMP NOT NULL  │
└─────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         PACIENTES MODULE                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│             pacientes               │
├─────────────────────────────────────┤
│ id                    BIGINT PK AUTO_INC │
│ apellido_paterno      VARCHAR(255) NOT NULL│
│ apellido_materno      VARCHAR(255)        │
│ nombres               VARCHAR(255) NOT NULL│
│ dni                   VARCHAR(20)         │
│ tipo_documento        VARCHAR(20) DEFAULT 'dni'│
│ telefono              VARCHAR(50)         │
│ email                 VARCHAR(255)        │
│ fecha_nacimiento      DATE                │
│ sexo                  VARCHAR(10)         │
│ estado_civil          VARCHAR(50)         │
│ direccion             VARCHAR(500)        │
│ lugar_nacimiento      VARCHAR(255)        │
│ lugar_procedencia     VARCHAR(255)        │
│ grado_instruccion     VARCHAR(255)        │
│ ocupacion             VARCHAR(255)        │
│ nombre_acompanante    VARCHAR(255)        │
│ contacto_emergencia   VARCHAR(255)        │
│ telefono_emergencia   VARCHAR(50)         │
│ alergias              TEXT                │
│ antecedentes_personales TEXT              │
│ antecedentes_familiares TEXT              │
│ estado                VARCHAR(20) DEFAULT 'activo'│
│ created_at            TIMESTAMP NOT NULL  │
│ updated_at            TIMESTAMP NOT NULL  │
└─────────────────────────────────────┘
        │
        │ 1:1
        ▼
┌─────────────────────────────────────┐
│         historias_clinicas          │
├─────────────────────────────────────┤
│ id                    BIGINT PK AUTO_INC │
│ paciente_id           BIGINT FK UNIQUE   │
│ numero_historia       VARCHAR(50) UNIQUE │
│ alergia_medicamentos  TEXT               │
│ cardiopatias_personales TEXT             │
│ cardiopatias_familiares TEXT             │
│ diabetes_personal     TEXT               │
│ diabetes_familiar     TEXT               │
│ hepatitis             TEXT               │
│ otras_enfermedades    TEXT               │
│ observaciones         TEXT               │
│ created_at            TIMESTAMP NOT NULL │
│ updated_at            TIMESTAMP NOT NULL │
└─────────────────────────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────────────────────────┐
│            consultas                │
├─────────────────────────────────────┤
│ id                    BIGINT PK AUTO_INC │
│ historia_id           BIGINT FK NOT NULL │
│ cita_id               BIGINT FK NULL     │
│ fecha                 TIMESTAMP NOT NULL │
│ motivo                VARCHAR(500) NOT NULL│
│ tiempo_enfermedad     VARCHAR(255)       │
│ signos_sintomas       TEXT               │
│ relato_cronologico    TEXT               │
│ signos_vitales        JSON               │
│ examen_clinico_general TEXT              │
│ diagnostico_lista     JSON               │
│ plan_tratamiento      JSON               │
│ notas                 TEXT               │
│ firmado               BOOLEAN DEFAULT FALSE│
│ firmado_at            TIMESTAMP NULL     │
│ created_at            TIMESTAMP NOT NULL │
│ updated_at            TIMESTAMP NOT NULL │
└─────────────────────────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────────────────────────┐
│            documentos               │
├─────────────────────────────────────┤
│ id                    BIGINT PK AUTO_INC │
│ paciente_id           BIGINT FK NOT NULL │
│ cita_id               BIGINT FK NULL     │
│ consulta_id           BIGINT FK NULL     │
│ usuario_id            BIGINT FK NOT NULL │
│ tipo                  VARCHAR(50) NOT NULL│
│ titulo                VARCHAR(255) NOT NULL│
│ archivo_ruta          VARCHAR(500) NOT NULL│
│ archivo_nombre        VARCHAR(255) NOT NULL│
│ hash_sha256           VARCHAR(64)        │
│ firma_imagen          TEXT               │
│ firmado               BOOLEAN DEFAULT FALSE│
│ firmado_at            TIMESTAMP NULL     │
│ estado                VARCHAR(20) DEFAULT 'borrador'│
│ created_at            TIMESTAMP NOT NULL │
│ updated_at            TIMESTAMP NOT NULL │
└─────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         APPOINTMENTS MODULE                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│              citas                  │
├─────────────────────────────────────┤
│ id                    BIGINT PK AUTO_INC │
│ paciente_id           BIGINT FK NOT NULL │
│ usuario_id            BIGINT FK NULL     │
│ tipo_cita_id          BIGINT FK NULL     │
│ fecha                 DATE NOT NULL      │
│ hora                  TIME NOT NULL      │
│ duracion_minutos      INT DEFAULT 30     │
│ motivo                VARCHAR(500) NOT NULL│
│ motivo_editado        VARCHAR(500)       │
│ estado                VARCHAR(20) DEFAULT 'pendiente'│
│ consulta_id           BIGINT FK NULL     │
│ notas                 TEXT               │
│ asistio_confirmed_at  TIMESTAMP NULL     │
│ cancelado_at          TIMESTAMP NULL     │
│ cancelado_motivo      VARCHAR(500)       │
│ reprogramada_de       BIGINT FK NULL     │
│ created_at            TIMESTAMP NOT NULL │
│ updated_at            TIMESTAMP NOT NULL │
└─────────────────────────────────────┘
        │
        │ N:1
        ▼
┌─────────────────────────────────────┐
│             pacientes               │
└─────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         CONTACT MODULE                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│         mensajes_contacto           │
├─────────────────────────────────────┤
│ id                    BIGINT PK AUTO_INC │
│ nombre                VARCHAR(255) NOT NULL│
│ email                 VARCHAR(255) NOT NULL│
│ telefono              VARCHAR(50)        │
│ asunto                VARCHAR(255)       │
│ mensaje               TEXT NOT NULL      │
│ estado                VARCHAR(20) DEFAULT 'pendiente'│
│ ip_address            VARCHAR(45)        │
│ user_agent            VARCHAR(500)       │
│ created_at            TIMESTAMP NOT NULL │
│ read_at               TIMESTAMP NULL     │
│ replied_at            TIMESTAMP NULL     │
└─────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         AUDIT MODULE                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│            audit_log                │
├─────────────────────────────────────┤
│ id                    BIGINT PK AUTO_INC │
│ timestamp             TIMESTAMP NOT NULL │
│ user_id               BIGINT FK NULL     │
│ user_email            VARCHAR(255)       │
│ user_role             VARCHAR(50)        │
│ action                VARCHAR(20) NOT NULL│
│ entity_type           VARCHAR(50) NOT NULL│
│ entity_id             BIGINT             │
│ old_value             JSON               │
│ new_value             JSON               │
│ ip_address            VARCHAR(45)        │
│ user_agent            VARCHAR(500)       │
│ checksum              VARCHAR(64)        │
│ created_at            TIMESTAMP NOT NULL │
└─────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         RELATIONSHIPS SUMMARY                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

usuarios ──1:1──▶ agendas
usuarios ──N:M──▶ roles (via usuario_roles)
roles ──N:M──▶ permisos (via rol_permisos)
agendas ──1:N──▶ disponibilidades
agendas ──1:N──▶ bloqueos
pacientes ──1:1──▶ historias_clinicas
historias_clinicas ──1:N──▶ consultas
pacientes ──1:N──▶ citas
usuarios ──1:N──▶ citas (asignada a)
tipos_cita ──1:N──▶ citas
citas ──1:1──▶ consultas (cuando se completa)
pacientes ──1:N──▶ documentos
consultas ──1:N──▶ documentos
usuarios ──1:N──▶ documentos (firmante)
usuarios ──1:N──▶ audit_log
```

---

## 2. Table Descriptions

### 2.1 Security Module (6 tables)

| Table | Description | Rows Est. |
|---|---|---|
| usuarios | User accounts for system access | 3-10 |
| roles | Role definitions (admin, doctora, enfermera) | 3 |
| permisos | Permission definitions per module/action | 50-100 |
| usuario_roles | User-role assignments | 3-10 |
| rol_permisos | Role-permission assignments | 15-30 |

### 2.2 Agenda Module (3 tables)

| Table | Description | Rows Est. |
|---|---|---|
| agendas | User agenda configurations | 2-3 |
| disponibilidades | Weekly availability schedules | 10-20 |
| bloqueos | Time block overrides | 10-50 |

### 2.3 Appointment Module (2 tables)

| Table | Description | Rows Est. |
|---|---|---|
| tipos_cita | Appointment type definitions | 3-10 |
| citas | Appointment records | 100-1000/year |

### 2.4 Patient Module (3 tables)

| Table | Description | Rows Est. |
|---|---|---|
| pacientes | Patient personal information | 100-500 |
| historias_clinicas | Medical history records | 100-500 |
| consultas | Consultation records | 200-2000/year |

### 2.5 Document Module (1 table)

| Table | Description | Rows Est. |
|---|---|---|
| documentos | Medical documents and PDFs | 200-2000/year |

### 2.6 Contact Module (1 table)

| Table | Description | Rows Est. |
|---|---|---|
| mensajes_contacto | Landing page contact messages | 50-200/year |

### 2.7 Audit Module (1 table)

| Table | Description | Rows Est. |
|---|---|---|
| audit_log | System audit trail | 1000-10000/year |

---

## 3. Relationships

### 3.1 One-to-One Relationships

| Parent | Child | FK Column | Constraint |
|---|---|---|---|
| usuarios | agendas | usuario_id | UNIQUE |
| pacientes | historias_clinicas | paciente_id | UNIQUE |
| citas | consultas | cita_id | UNIQUE |

### 3.2 One-to-Many Relationships

| Parent | Child | FK Column | Constraint |
|---|---|---|---|
| agendas | disponibilidades | agenda_id | NOT NULL |
| agendas | bloqueos | agenda_id | NOT NULL |
| historias_clinicas | consultas | historia_id | NOT NULL |
| pacientes | citas | paciente_id | NOT NULL |
| pacientes | documentos | paciente_id | NOT NULL |
| consultas | documentos | consulta_id | NULLABLE |
| usuarios | audit_log | user_id | NULLABLE |

### 3.3 Many-to-Many Relationships

| Table A | Table B | Junction Table | Constraints |
|---|---|---|---|
| usuarios | roles | usuario_roles | UNIQUE(usuario_id, rol_id) |
| roles | permisos | rol_permisos | UNIQUE(rol_id, permiso_id) |

---

## 4. Indexes

### 4.1 Primary Keys

All tables use `BIGINT AUTO_INCREMENT` primary keys.

### 4.2 Unique Indexes

| Table | Columns | Purpose |
|---|---|---|
| usuarios | email | Login identifier |
| roles | nombre | Role lookup |
| permisos | nombre | Permission lookup |
| historias_clinicas | numero_historia | Medical record number |
| pacientes | dni, tipo_documento | Document identification |

### 4.3 Foreign Key Indexes

| Table | Column | References |
|---|---|---|
| usuario_roles | usuario_id | usuarios.id |
| usuario_roles | rol_id | roles.id |
| rol_permisos | rol_id | roles.id |
| rol_permisos | permiso_id | permisos.id |
| agendas | usuario_id | usuarios.id |
| disponibilidades | agenda_id | agendas.id |
| bloqueos | agenda_id | agendas.id |
| historias_clinicas | paciente_id | pacientes.id |
| consultas | historia_id | historias_clinicas.id |
| consultas | cita_id | citas.id |
| citas | paciente_id | pacientes.id |
| citas | usuario_id | usuarios.id |
| citas | tipo_cita_id | tipos_cita.id |
| documentos | paciente_id | pacientes.id |
| documentos | cita_id | citas.id |
| documentos | consulta_id | consultas.id |
| documentos | usuario_id | usuarios.id |
| audit_log | user_id | usuarios.id |

### 4.4 Performance Indexes

| Table | Columns | Purpose |
|---|---|---|
| pacientes | estado | Filter active patients |
| citas | fecha, hora | Schedule queries |
| citas | estado | Filter by status |
| consultas | fecha | Date range queries |
| documentos | tipo | Filter by document type |
| audit_log | timestamp | Time-based queries |
| audit_log | entity_type, entity_id | Entity audit trail |

---

## 5. Pending Decisions

### 5.1 Blockers (Affect Schema)

| ID | Question | Impact | Default | Status |
|---|---|---|---|---|
| BLO-001 | ¿Consultas inmutables después de firmar? | Add `firmado` flag | Sí | TBD |
| BLO-002 | ¿Documentos inmutables después de firmar? | Add `firmado` flag | Sí | TBD |
| BLO-003 | ¿Se puede eliminar historia clínica? | Soft delete vs hard delete | No (soft) | TBD |
| BLO-004 | ¿Se permite reprogramar citas? | Add `reprogramada_de` FK | Sí | TBD |

### 5.2 Business Decisions (Affect Behavior)

| ID | Question | Impact | Default | Status |
|---|---|---|---|---|
| BIZ-CIT-001 | ¿Tipos de cita? | Seed data in tipos_cita | consulta, control, emergencia | TBD |
| BIZ-PAC-001 | ¿Pacientes sin documento? | dni nullable | No | TBD |
| BIZ-PAC-002 | ¿Múltiples teléfonos? | Separate table or JSON | Sí (JSON) | TBD |

---

## 6. Data Types Reference

### 6.1 MySQL Data Types Used

| Type | Usage | Example |
|---|---|---|
| BIGINT | Primary keys, foreign keys | id, paciente_id |
| VARCHAR(20-255) | Short text fields | dni, nombre, email |
| TEXT | Long text fields | alergias, notas |
| DATE | Date only | fecha_nacimiento |
| TIME | Time only | hora_inicio |
| TIMESTAMP | Date + Time | created_at, updated_at |
| TINYINT | Small numbers | dia_semana (0-6) |
| INT | Integer numbers | duracion_minutos |
| BOOLEAN | True/False | activo, firmado |
| JSON | Structured data | signos_vitales, diagnostico_lista |

### 6.2 Timestamp Convention

| Field | Type | Default | Description |
|---|---|---|---|
| created_at | TIMESTAMP | CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | CURRENT_TIMESTAMP ON UPDATE | Last modification time |

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
