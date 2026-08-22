# Database Design: Pacientes

---
Document ID: DB-PAC-001
Status: Approved
Version: 1.0.0
Owner: Database
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: true
Depends On: [DOM-PAC-001]
---

## 1. Entity Relationship Diagram

```
┌─────────────────────────────────────┐
│             usuarios                │
├─────────────────────────────────────┤
│ id              BIGINT PK AUTO_INC  │
│ nombre          VARCHAR(255) NOT NULL│
│ email           VARCHAR(255) UNIQUE  │
│ password        VARCHAR(255) NOT NULL│
│ rol             VARCHAR(50) NOT NULL │
│ activo          BOOLEAN DEFAULT TRUE │
│ created_at      TIMESTAMP NOT NULL   │
│ updated_at      TIMESTAMP NOT NULL   │
└─────────────────────────────────────┘
              │
              │ 1:1
              ▼
┌─────────────────────────────────────┐
│              agendas                │
├─────────────────────────────────────┤
│ id              BIGINT PK AUTO_INC  │
│ usuario_id      BIGINT FK UNIQUE    │
│ nombre          VARCHAR(255) NOT NULL│
│ created_at      TIMESTAMP NOT NULL   │
│ updated_at      TIMESTAMP NOT NULL   │
└─────────────────────────────────────┘
              │
              │ 1:N
              ▼
┌─────────────────────────────────────┐
│          disponibilidades           │
├─────────────────────────────────────┤
│ id              BIGINT PK AUTO_INC  │
│ agenda_id       BIGINT FK NOT NULL  │
│ dia_semana      TINYINT NOT NULL    │
│ hora_inicio     TIME NOT NULL       │
│ hora_fin        TIME NOT NULL       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│             bloqueos                │
├─────────────────────────────────────┤
│ id              BIGINT PK AUTO_INC  │
│ agenda_id       BIGINT FK NOT NULL  │
│ fecha_inicio    TIMESTAMP NOT NULL  │
│ fecha_fin       TIMESTAMP NOT NULL  │
│ motivo          VARCHAR(500)        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│           pacientes                 │
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
│ usuario_id            BIGINT FK NOT NULL │
│ tipo                  VARCHAR(50) NOT NULL│
│ titulo                VARCHAR(255) NOT NULL│
│ archivo_ruta          VARCHAR(500) NOT NULL│
│ archivo_nombre        VARCHAR(255) NOT NULL│
│ hash_sha256           VARCHAR(64)        │
│ firma_imagen          TEXT               │
│ estado                VARCHAR(20) DEFAULT 'borrador'│
│ created_at            TIMESTAMP NOT NULL │
│ updated_at            TIMESTAMP NOT NULL │
└─────────────────────────────────────┘
```

## 2. Table Definitions

### 2.1 pacientes

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | BIGINT | NO | AUTO_INCREMENT | Primary Key |
| apellido_paterno | VARCHAR(255) | NO | — | Apellido paterno |
| apellido_materno | VARCHAR(255) | YES | — | Apellido materno |
| nombres | VARCHAR(255) | NO | — | Nombres completos |
| dni | VARCHAR(20) | YES | — | Número de documento (UNIQUE) |
| tipo_documento | VARCHAR(20) | NO | 'dni' | Tipo de documento |
| telefono | VARCHAR(50) | YES | — | Teléfono principal |
| email | VARCHAR(255) | YES | — | Correo electrónico |
| fecha_nacimiento | DATE | YES | — | Fecha de nacimiento |
| sexo | VARCHAR(10) | YES | — | Sexo (M/F/Otro) |
| estado_civil | VARCHAR(50) | YES | — | Estado civil |
| direccion | VARCHAR(500) | YES | — | Dirección completa |
| lugar_nacimiento | VARCHAR(255) | YES | — | Lugar de nacimiento |
| lugar_procedencia | VARCHAR(255) | YES | — | Lugar de procedencia |
| grado_instruccion | VARCHAR(255) | YES | — | Nivel educativo |
| ocupacion | VARCHAR(255) | YES | — | Profesión |
| nombre_acompanante | VARCHAR(255) | YES | — | Nombre del acompañante |
| contacto_emergencia | VARCHAR(255) | YES | — | Contacto de emergencia |
| telefono_emergencia | VARCHAR(50) | YES | — | Teléfono de emergencia |
| alergias | TEXT | YES | — | Alergias conocidas |
| antecedentes_personales | TEXT | YES | — | Antecedentes personales |
| antecedentes_familiares | TEXT | YES | — | Antecedentes familiares |
| estado | VARCHAR(20) | NO | 'activo' | Estado del paciente |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Fecha de actualización |

### 2.2 Indexes

| Index Name | Columns | Type | Description |
|---|---|---|---|
| idx_pacientes_dni | dni | UNIQUE | Búsqueda por DNI |
| idx_pacientes_estado | estado | NORMAL | Filtrar por estado |
| idx_pacientes_nombre | apellido_paterno, nombres | NORMAL | Búsqueda por nombre |

## 3. Constraints

| Constraint | Type | Columns | Description |
|---|---|---|---|
| uk_pacientes_dni_tipo | UNIQUE | dni, tipo_documento | DNI único por tipo de documento |
| chk_pacientes_estado | CHECK | estado | Solo 'activo' o 'inactivo' |
| chk_pacientes_tipo_documento | CHECK | tipo_documento | Valores permitidos |

## 4. Foreign Keys

| FK Name | Source | Target | On Delete | On Update |
|---|---|---|---|---|
| fk_historias_paciente | historias_clinicas.paciente_id | pacientes.id | RESTRICT | CASCADE |
| fk_consultas_historia | consultas.historia_id | historias_clinicas.id | RESTRICT | CASCADE |
| fk_consultas_cita | consultas.cita_id | citas.id | SET NULL | CASCADE |
| fk_documentos_paciente | documentos.paciente_id | pacientes.id | RESTRICT | CASCADE |
| fk_documentos_usuario | documentos.usuario_id | usuarios.id | RESTRICT | CASCADE |
| fk_documentos_consulta | documentos.consulta_id | consultas.id | SET NULL | CASCADE |
| fk_citas_paciente | citas.paciente_id | pacientes.id | RESTRICT | CASCADE |
| fk_citas_usuario | citas.usuario_id | usuarios.id | SET NULL | CASCADE |
| fk_citas_tipo | citas.tipo_id | tipos_cita.id | SET NULL | CASCADE |
| fk_citas_consulta | citas.consulta_id | consultas.id | SET NULL | CASCADE |

## 5. Additional Tables

### 5.1 citas

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | BIGINT | NO | AUTO_INCREMENT | Primary Key |
| paciente_id | BIGINT | NO | — | → Paciente |
| usuario_id | BIGINT | YES | — | → Usuario (doctora/enfermera) |
| tipo_id | BIGINT | YES | — | → TipoCita |
| fecha | DATE | NO | — | Fecha de la cita |
| hora | TIME | NO | — | Hora de la cita |
| duracion_minutos | INT | NO | 30 | Duración en minutos |
| motivo | VARCHAR(500) | NO | — | Motivo de la consulta |
| motivo_editado | VARCHAR(500) | YES | — | Motivo editado |
| estado | VARCHAR(20) | NO | 'pendiente' | Estado de la cita |
| consulta_id | BIGINT | YES | — | → Consulta |
| notas | TEXT | YES | — | Notas adicionales |
| asistio_confirmed_at | TIMESTAMP | YES | — | Timestamp de confirmación |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Fecha de actualización |

### 5.2 tipos_cita

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | BIGINT | NO | AUTO_INCREMENT | Primary Key |
| nombre | VARCHAR(100) | NO | — | Nombre del tipo |
| duracion_default | INT | NO | 30 | Duración predeterminada |
| color | VARCHAR(20) | YES | — | Color para calendario |
| activo | BOOLEAN | NO | TRUE | Activo/Inactivo |

### 5.3 disponibilidades

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | BIGINT | NO | AUTO_INCREMENT | Primary Key |
| agenda_id | BIGINT | NO | — | → Agenda |
| dia_semana | TINYINT | NO | — | 0=Domingo, 1=Lunes, etc. |
| hora_inicio | TIME | NO | — | Hora de inicio |
| hora_fin | TIME | NO | — | Hora de fin |

### 5.4 bloqueos

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | BIGINT | NO | AUTO_INCREMENT | Primary Key |
| agenda_id | BIGINT | NO | — | → Agenda |
| fecha_inicio | TIMESTAMP | NO | — | Fecha/hora inicio |
| fecha_fin | TIMESTAMP | NO | — | Fecha/hora fin |
| motivo | VARCHAR(500) | YES | — | Motivo del bloqueo |

### 5.5 usuarios

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | BIGINT | NO | AUTO_INCREMENT | Primary Key |
| nombre | VARCHAR(255) | NO | — | Nombre completo |
| email | VARCHAR(255) | NO | UNIQUE | Correo electrónico |
| password | VARCHAR(255) | NO | — | Contraseña hasheada |
| rol | VARCHAR(50) | NO | — | Rol del usuario |
| activo | BOOLEAN | NO | TRUE | Activo/Inactivo |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Fecha de actualización |

### 5.6 roles

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | BIGINT | NO | AUTO_INCREMENT | Primary Key |
| nombre | VARCHAR(50) | NO | UNIQUE | Nombre del rol |
| descripcion | VARCHAR(255) | YES | — | Descripción del rol |

### 5.7 permisos

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | BIGINT | NO | AUTO_INCREMENT | Primary Key |
| nombre | VARCHAR(100) | NO | UNIQUE | Nombre del permiso |
| descripcion | VARCHAR(255) | YES | — | Descripción del permiso |

### 5.8 roles_permisos

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| rol_id | BIGINT | NO | — | → Rol |
| permiso_id | BIGINT | NO | — | → Permiso |
