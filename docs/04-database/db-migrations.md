# Migrations Strategy

---
Document ID: DB-003
Status: Draft
Version: 1.0.0
Owner: Database
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [DB-001, DB-002]
---

## 1. Migration Strategy

### 1.1 Philosophy

| Principle | Description |
|---|---|
| Version Control | Every schema change is a migration file |
| Repeatable | Migrations can be run multiple times safely |
| Reversible | Every migration has a rollback |
| Tested | Migrations are tested before production |
| Documented | Changes are documented in migration comments |

### 1.2 Tool

| Property | Value |
|---|---|
| Tool | Flyway |
| Location | `backend/src/main/resources/db/migration/` |
| Naming | `V{version}__{description}.sql` |
| Rollback | `U{version}__{description}.sql` |

---

## 2. Naming Convention

### 2.1 Migration Files

```
V{version}__{description}.sql
```

| Component | Format | Example |
|---|---|---|
| Version | V + number | V1, V2, V3 |
| Separator | Double underscore | __ |
| Description | snake_case | create_pacientes_table |

**Examples:**

```
V1__create_usuarios_table.sql
V2__create_roles_table.sql
V3__create_pacientes_table.sql
V4__add_email_to_pacientes.sql
```

### 2.2 Rollback Files

```
U{version}__{description}.sql
```

**Examples:**

```
U1__drop_usuarios_table.sql
U2__drop_roles_table.sql
U3__drop_pacientes_table.sql
```

---

## 3. Migration Structure

### 3.1 Basic Structure

```sql
-- Migration: V{version}__{description}
-- Author: {author}
-- Date: {date}
-- Description: {description}

-- Up migration (apply)
BEGIN;

-- SQL statements here

COMMIT;
```

### 3.2 Rollback Structure

```sql
-- Rollback: U{version}__{description}
-- Author: {author}
-- Date: {date}
-- Description: Undo {description}

BEGIN;

-- SQL statements to undo

COMMIT;
```

---

## 4. Migration Rules

### 4.1 DO's

| Rule | Example |
|---|---|
| Always use transactions | BEGIN; ... COMMIT; |
| Add comments | -- Migration: V1__create_table |
| Test rollbacks | Run U1 after V1 |
| Use IF NOT EXISTS | CREATE TABLE IF NOT EXISTS |
| Add indexes | CREATE INDEX IF NOT EXISTS |
| Document changes | Comment every significant change |

### 4.2 DON'Ts

| Rule | Reason |
|---|---|
| Never modify applied migrations | Use new migration instead |
| Never drop columns | Use soft delete |
| Never change column types | Use new column + migrate data |
| Never use TRUNCATE | Use DELETE with WHERE |
| Never skip versions | Maintain sequential order |

---

## 5. Migration Phases

### 5.1 Phase 1: Foundation (Migrations 1-10)

| Migration | Description | Tables |
|---|---|---|
| V1 | Security module | usuarios, roles, permisos |
| V2 | Junction tables | usuario_roles, rol_permisos |
| V3 | Agenda module | agendas, disponibilidades, bloqueos |
| V4 | Appointment types | tipos_cita |
| V5 | Patient module | pacientes |
| V6 | Medical history | historias_clinicas |
| V7 | Appointments | citas |
| V8 | Consultations | consultas |
| V9 | Documents | documentos |
| V10 | Contact module | mensajes_contacto |

### 5.2 Phase 2: Audit (Migrations 11-15)

| Migration | Description | Tables |
|---|---|---|
| V11 | Audit log | audit_log |
| V12 | Audit indexes | Performance indexes |
| V13 | Audit triggers | Automatic logging |

### 5.3 Phase 3: Enhancements (Migrations 16+)

| Migration | Description | Tables |
|---|---|---|
| V14 | Soft delete support | deleted_at columns |
| V15 | Additional indexes | Query optimization |
| V16 | Data improvements | Column additions |

---

## 6. Example Migrations

### 6.1 V1: Create Usuarios Table

```sql
-- Migration: V1__create_usuarios_table.sql
-- Description: Create usuarios table for system access

BEGIN;

CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
```

### 6.2 U1: RollbackUsuarios Table

```sql
-- Rollback: U1__drop_usuarios_table.sql
-- Description: Drop usuarios table

BEGIN;

DROP TABLE IF EXISTS usuario_roles;
DROP TABLE IF EXISTS usuarios;

COMMIT;
```

### 6.3 V3: Create Pacientes Table

```sql
-- Migration: V3__create_pacientes_table.sql
-- Description: Create pacientes table for patient information

BEGIN;

CREATE TABLE IF NOT EXISTS pacientes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    apellido_paterno VARCHAR(255) NOT NULL,
    apellido_materno VARCHAR(255),
    nombres VARCHAR(255) NOT NULL,
    dni VARCHAR(20),
    tipo_documento VARCHAR(20) DEFAULT 'dni',
    telefono VARCHAR(50),
    email VARCHAR(255),
    fecha_nacimiento DATE,
    sexo VARCHAR(10),
    estado_civil VARCHAR(50),
    direccion VARCHAR(500),
    lugar_nacimiento VARCHAR(255),
    lugar_procedencia VARCHAR(255),
    grado_instruccion VARCHAR(255),
    ocupacion VARCHAR(255),
    nombre_acompanante VARCHAR(255),
    contacto_emergencia VARCHAR(255),
    telefono_emergencia VARCHAR(50),
    alergias TEXT,
    antecedentes_personales TEXT,
    antecedentes_familiares TEXT,
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_pacientes_estado (estado),
    INDEX idx_pacientes_dni (dni, tipo_documento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
```

---

## 7. Rollback Strategy

### 7.1 When to Rollback

| Scenario | Action |
|---|---|
| Migration fails | Rollback immediately |
| Bug in migration | Rollback, fix, re-apply |
| Data corruption | Rollback from backup |
| Production issue | Rollback and investigate |

### 7.2 Rollback Procedure

```bash
# 1. Apply rollback
flyway undo

# 2. Verify rollback
flyway info

# 3. Fix migration file

# 4. Re-apply
flyway migrate
```

### 7.3 Emergency Rollback

```sql
-- Manual rollback (if Flyway fails)
-- DO NOT USE IN PRODUCTION WITHOUT BACKUP

-- 1. Backup current state
mysqldump -u root -p medical_erp_db > backup_$(date +%Y%m%d_%H%M%S).sql

-- 2. Apply rollback SQL
SOURCE /path/to/U{version}__{description}.sql;

-- 3. Verify
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC;
```

---

## 8. Testing Migrations

### 8.1 Local Testing

```bash
# 1. Reset database
flyway clean

# 2. Apply all migrations
flyway migrate

# 3. Verify schema
flyway info

# 4. Run application tests
mvn test
```

### 8.2 Test Checklist

- [ ] Migration applies without errors
- [ ] Rollback applies without errors
- [ ] Application starts successfully
- [ ] All tests pass
- [ ] Data integrity maintained
- [ ] Performance acceptable

### 8.3 Test Data

```sql
-- Seed data for testing (in migrations or separate scripts)
INSERT INTO usuarios (nombre, email, password, activo) VALUES
('Admin', 'admin@clinica.com', '$2a$12$...', TRUE);

INSERT INTO roles (nombre, descripcion) VALUES
('admin', 'Administrador del sistema'),
('doctora', 'Doctora principal'),
('enfermera', 'Enfermera');
```

---

## 9. Production Deployment

### 9.1 Pre-deployment

| Step | Command | Purpose |
|---|---|---|
| 1 | Backup database | Safety net |
| 2 | Check flyway_schema_history | Current state |
| 3 | Test migrations locally | Validation |
| 4 | Review migration files | Code review |

### 9.2 Deployment

```bash
# 1. Backup production database
mysqldump -u root -p medical_erp_db > prod_backup_$(date +%Y%m%d).sql

# 2. Apply migrations
flyway -url=jdbc:mysql://localhost:3306/medical_erp_db migrate

# 3. Verify
flyway info
```

### 9.3 Post-deployment

| Step | Command | Purpose |
|---|---|---|
| 1 | Verify schema | flyway info |
| 2 | Run smoke tests | Application health |
| 3 | Monitor logs | Error detection |
| 4 | Verify data | Spot checks |

---

## 10. Common Issues

### 10.1 Migration Already Applied

```sql
-- Error: Migration already applied
-- Solution: Check flyway_schema_history
SELECT * FROM flyway_schema_history WHERE version = '1';

-- If stuck, manually mark as applied
INSERT INTO flyway_schema_history (installed_rank, version, description, type, checksum, installed_by, execution_time, success)
VALUES (1, '1', 'create_usuarios_table', 'SQL', 1234567890, 'admin', 100, TRUE);
```

### 10.2 Checksum Mismatch

```sql
-- Error: Checksum mismatch
-- Solution: Repair flyway
flyway repair

-- Or manually update checksum
UPDATE flyway_schema_history 
SET checksum = <new_checksum> 
WHERE version = '1';
```

### 10.3 Foreign Key Constraint Failed

```sql
-- Error: Cannot drop table with foreign keys
-- Solution: Drop foreign keys first
ALTER TABLE usuario_roles DROP FOREIGN KEY fk_usuario_roles_usuario_id;
DROP TABLE usuarios;
```

---

## 11. Best Practices

### 11.1 Migration Design

| Practice | Reason |
|---|---|
| Small migrations | Easier to debug and rollback |
| One logical change per migration | Clear history |
| Idempotent operations | Safe to re-run |
| Comments everywhere | Future reference |

### 11.2 Version Control

| Practice | Reason |
|---|---|
| Never modify applied migrations | Maintain history |
| Use sequential versions | Avoid conflicts |
| Review before merge | Catch errors early |
| Test in staging first | Prevent production issues |

### 11.3 Documentation

| Practice | Reason |
|---|---|
| Document every change | Audit trail |
| Include rollback instructions | Emergency response |
| Note breaking changes | Deployment planning |
| Version dependencies | Compatibility |

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
