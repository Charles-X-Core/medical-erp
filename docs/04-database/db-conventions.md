# Database Conventions

---
Document ID: DB-002
Status: Draft
Version: 1.0.0
Owner: Database
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [DB-001]
---

## 1. Naming Conventions

### 1.1 General Rules

| Rule | Convention | Example |
|---|---|---|
| Language | Spanish (medical terms) | pacientes, citas, consultas |
| Case | snake_case | paciente_id, fecha_nacimiento |
| Plural | Plural for tables | pacientes, usuarios |
| Singular | Singular for columns | paciente_id (not pacientes_id) |
| Prefixes | Module prefix for ambiguity | audit_log, mensajes_contacto |

### 1.2 Table Names

| Pattern | Example | Notes |
|---|---|---|
| {entity} | pacientes, usuarios | Main entities |
| {entity}_{child} | usuario_roles, rol_permisos | Junction tables |
| {module}_{entity} | audit_log, mensajes_contacto | Ambiguous names |

### 1.3 Column Names

| Pattern | Example | Notes |
|---|---|---|
| id | id | Primary key (always) |
| {table}_id | paciente_id, usuario_id | Foreign key |
| created_at | created_at | Creation timestamp |
| updated_at | updated_at | Last update timestamp |
| {attribute} | nombre, email, fecha | Regular columns |
| is_{state} | activo, firmado | Boolean flags |

### 1.4 Index Names

| Pattern | Example | Notes |
|---|---|---|
| idx_{table}_{column} | idx_pacientes_estado | Single column |
| idx_{table}_{columns} | idx_citas_fecha_hora | Multiple columns |
| uk_{table}_{column} | uk_usuarios_email | Unique index |
| fk_{table}_{column} | fk_citas_paciente_id | Foreign key |

---

## 2. Data Types

### 2.1 Numeric Types

| Type | Range | Usage | Example |
|---|---|---|---|
| TINYINT | -128 to 127 | Small numbers | dia_semana (0-6) |
| SMALLINT | -32768 to 32767 | Medium numbers | duracion_minutos |
| INT | -2^31 to 2^31-1 | Large numbers | contador |
| BIGINT | -2^63 to 2^63-1 | Primary keys | id |

### 2.2 String Types

| Type | Max Length | Usage | Example |
|---|---|---|---|
| VARCHAR(10-20) | 10-20 chars | Codes, IDs | dni, tipo_documento |
| VARCHAR(50) | 50 chars | Short text | estado, rol |
| VARCHAR(100) | 100 chars | Names | nombre, titulo |
| VARCHAR(255) | 255 chars | Long names | email, archivo_nombre |
| VARCHAR(500) | 500 chars | Descriptions | motivo, direccion |
| TEXT | 65535 chars | Long content | notas, alergias |

### 2.3 Date/Time Types

| Type | Format | Usage | Example |
|---|---|---|---|
| DATE | YYYY-MM-DD | Date only | fecha_nacimiento |
| TIME | HH:MM:SS | Time only | hora_inicio |
| TIMESTAMP | YYYY-MM-DD HH:MM:SS | Date + Time | created_at |

### 2.4 Special Types

| Type | Usage | Example |
|---|---|---|
| BOOLEAN | True/False | activo, firmado |
| JSON | Structured data | signos_vitales |
| ENUM | Limited options | estado (use VARCHAR instead) |

### 2.5 Why Not ENUM

MySQL ENUM has limitations:
- Difficult to add new values (requires ALTER TABLE)
- Not portable to other databases
- Ordering issues

**Recommendation:** Use VARCHAR with application-level validation.

---

## 3. Constraints

### 3.1 Primary Key

```sql
-- Every table must have a primary key
id BIGINT NOT NULL AUTO_INCREMENT,
PRIMARY KEY (id)
```

### 3.2 Foreign Key

```sql
-- Foreign key constraint
paciente_id BIGINT NOT NULL,
CONSTRAINT fk_citas_paciente_id 
    FOREIGN KEY (paciente_id) 
    REFERENCES pacientes(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
```

### 3.3 Unique

```sql
-- Unique constraint
email VARCHAR(255) NOT NULL,
CONSTRAINT uk_usuarios_email UNIQUE (email)
```

### 3.4 Not Null

```sql
-- Required fields
nombre VARCHAR(255) NOT NULL,
email VARCHAR(255) NOT NULL,
```

### 3.5 Default Values

```sql
-- Default values
activo BOOLEAN DEFAULT TRUE,
estado VARCHAR(20) DEFAULT 'activo',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
```

### 3.6 Check Constraints (MySQL 8.0.16+)

```sql
-- Check constraints
dia_semana TINYINT NOT NULL,
CONSTRAINT chk_disponibilidades_dia_semana 
    CHECK (dia_semana >= 0 AND dia_semana <= 6),
```

---

## 4. Indexing Strategy

### 4.1 When to Create Indexes

| Scenario | Action | Example |
|---|---|---|
| Primary key | Always | id |
| Foreign key | Always | paciente_id |
| WHERE clause | Usually | estado, fecha |
| JOIN column | Usually | usuario_id |
| ORDER BY | Sometimes | created_at |
| UNIQUE | Always | email |

### 4.2 When NOT to Create Indexes

| Scenario | Reason |
|---|---|
| Small tables | Full scan is faster |
| Low cardinality | Few distinct values |
| Rarely queried | No benefit |
| Write-heavy | Slows down INSERT/UPDATE |

### 4.3 Composite Indexes

```sql
-- Composite index for common queries
CREATE INDEX idx_citas_fecha_hora ON citas(fecha, hora);

-- Composite unique index
CONSTRAINT uk_usuario_roles UNIQUE (usuario_id, rol_id)
```

### 4.4 Index Maintenance

```sql
-- Check index usage
SHOW INDEX FROM table_name;

-- Analyze table for optimization
ANALYZE TABLE table_name;

-- Optimize table (defragment)
OPTIMIZE TABLE table_name;
```

---

## 5. Audit Fields

### 5.1 Required Audit Columns

Every table MUST have:

```sql
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
```

### 5.2 Optional Audit Columns

| Column | Type | Usage |
|---|---|---|
| deleted_at | TIMESTAMP NULL | Soft delete |
| created_by | BIGINT FK | User who created |
| updated_by | BIGINT FK | User who updated |

### 5.3 Soft Delete Pattern

```sql
-- Add to tables that support soft delete
deleted_at TIMESTAMP NULL DEFAULT NULL,
is_deleted BOOLEAN DEFAULT FALSE,

-- Query active records
SELECT * FROM pacientes WHERE is_deleted = FALSE;

-- Soft delete
UPDATE pacientes SET deleted_at = NOW(), is_deleted = TRUE WHERE id = 123;
```

---

## 6. JSON Columns

### 6.1 When to Use JSON

| Scenario | Use JSON | Use Table |
|---|---|---|
| Variable structure | Yes | No |
| Rarely queried | Yes | No |
| Simple data | Yes | No |
| Complex relationships | No | Yes |
| Frequently queried | No | Yes |

### 6.2 JSON Examples

```sql
-- Signos vitales (variable structure)
signos_vitales JSON,
-- Example: {"presion_arterial": "120/80", "pulso": 72, "temperatura": 36.5}

-- Diagnósticos (list of items)
diagnostico_lista JSON,
-- Example: [{"codigo": "J06.9", "nombre": "Infección aguda vía aerea"}]

-- Plan de tratamiento (structured data)
plan_tratamiento JSON,
-- Example: {"medicamentos": [...], "indicaciones": "..."}
```

### 6.3 JSON Validation

```sql
-- Add CHECK constraint for valid JSON
CONSTRAINT chk_consultas_signos_vitales 
    CHECK (JSON_VALID(signos_vitales))
```

---

## 7. Timestamps

### 7.1 Creation Timestamp

```sql
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
```

### 7.2 Update Timestamp

```sql
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
```

### 7.3 Timezone

Always use UTC:

```sql
-- Server timezone
SET GLOBAL time_zone = '+00:00';

-- Session timezone
SET time_zone = '+00:00';
```

---

## 8. Character Set

### 8.1 Database Level

```sql
CREATE DATABASE medical_erp_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
```

### 8.2 Table Level

```sql
CREATE TABLE pacientes (
    -- ...
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
```

### 8.3 Why utf8mb4

- Supports full Unicode (including emojis)
- 4 bytes per character (vs 3 for utf8)
- Recommended for MySQL 8.x

---

## 9. Storage Engine

### 9.1 InnoDB Only

All tables MUST use InnoDB:

```sql
CREATE TABLE pacientes (
    -- ...
) ENGINE=InnoDB;
```

### 9.2 Why InnoDB

| Feature | InnoDB | MyISAM |
|---|---|---|
| ACID | Yes | No |
| Transactions | Yes | No |
| Row-level locking | Yes | No |
| Foreign keys | Yes | No |
| Crash recovery | Yes | No |

---

## 10. Common Patterns

### 10.1 Status Columns

```sql
-- Use VARCHAR, not ENUM
estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',

-- Common statuses
'activo', 'inactivo'        -- For entities
'pendiente', 'completado'   -- For processes
'borrador', 'firmado'       -- For documents
```

### 10.2 Boolean Columns

```sql
-- Use BOOLEAN (alias for TINYINT(1))
activo BOOLEAN DEFAULT TRUE,
firmado BOOLEAN DEFAULT FALSE,
```

### 10.3 Money Columns

```sql
-- Use DECIMAL, not FLOAT
monto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
```

### 10.4 Password Columns

```sql
-- Always hash passwords
password VARCHAR(255) NOT NULL,  -- bcrypt hash
```

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
