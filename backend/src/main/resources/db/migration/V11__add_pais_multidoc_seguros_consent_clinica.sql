-- V11__add_pais_multidoc_seguros_consent_clinica.sql
-- Description: Multi-region, multi-tenant foundation + insurance + consent + access log
-- Author: Medical ERP System
-- Date: 2026-07-31

-- =============================================
-- 1. Clinicas (multi-tenant foundation)
-- =============================================
CREATE TABLE IF NOT EXISTS clinicas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    pais VARCHAR(2) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'America/Lima',
    moneda VARCHAR(3) DEFAULT 'PEN',
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO clinicas (nombre, pais, timezone, moneda) VALUES
    ('Optimal Health Perú', 'PE', 'America/Lima', 'PEN'),
    ('Optimal Health USA', 'US', 'America/New_York', 'USD');

-- =============================================
-- 2. Add clinica_id and pais to pacientes
-- =============================================
ALTER TABLE pacientes
    ADD COLUMN clinica_id BIGINT AFTER id,
    ADD COLUMN pais VARCHAR(2) DEFAULT 'PE' AFTER estado,
    ADD COLUMN parentesco_emergencia VARCHAR(100) AFTER telefono_emergencia,
    ADD CONSTRAINT fk_pacientes_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
    ADD INDEX idx_pacientes_pais (pais),
    ADD INDEX idx_pacientes_clinica (clinica_id);

UPDATE pacientes SET clinica_id = 1 WHERE clinica_id IS NULL;

-- =============================================
-- 3. Add clinica_id to usuarios
-- =============================================
ALTER TABLE usuarios
    ADD COLUMN clinica_id BIGINT AFTER id,
    ADD CONSTRAINT fk_usuarios_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
    ADD INDEX idx_usuarios_clinica (clinica_id);

UPDATE usuarios SET clinica_id = 1 WHERE clinica_id IS NULL;

-- =============================================
-- 4. Patient identity documents (multi-document)
-- =============================================
CREATE TABLE IF NOT EXISTS paciente_documentos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    paciente_id BIGINT NOT NULL,
    clinica_id BIGINT NOT NULL,
    tipo_documento VARCHAR(30) NOT NULL,
    numero_documento VARCHAR(50) NOT NULL,
    pais_emision VARCHAR(2),
    fecha_vencimiento DATE,
    es_principal BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pacdoc_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    CONSTRAINT fk_pacdoc_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
    UNIQUE KEY uk_pacdoc_doc_clinica (numero_documento, tipo_documento, clinica_id),
    INDEX idx_pacdoc_paciente (paciente_id),
    INDEX idx_pacdoc_clinica (clinica_id),
    INDEX idx_pacdoc_active (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 5. Patient insurance (1:N)
-- =============================================
CREATE TABLE IF NOT EXISTS paciente_seguros (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    paciente_id BIGINT NOT NULL,
    clinica_id BIGINT NOT NULL,
    tipo_seguro VARCHAR(50) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    group_number VARCHAR(100),
    fecha_inicio DATE,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pacseg_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    CONSTRAINT fk_pacseg_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
    INDEX idx_pacseg_paciente (paciente_id),
    INDEX idx_pacseg_clinica (clinica_id),
    INDEX idx_pacseg_active (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 6. Patient consent (HIPAA-style)
-- =============================================
CREATE TABLE IF NOT EXISTS paciente_consentimientos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    paciente_id BIGINT NOT NULL,
    clinica_id BIGINT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    aceptado BOOLEAN DEFAULT FALSE,
    fecha DATE,
    version VARCHAR(20),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_paccon_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    CONSTRAINT fk_paccon_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
    INDEX idx_paccon_paciente (paciente_id),
    INDEX idx_paccon_clinica (clinica_id),
    INDEX idx_paccon_tipo (tipo),
    INDEX idx_paccon_active (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 7. Add clinica_id to audit_log
-- =============================================
ALTER TABLE audit_log
    ADD COLUMN clinica_id BIGINT AFTER user_role,
    ADD CONSTRAINT fk_audit_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
    ADD INDEX idx_audit_clinica (clinica_id);

-- =============================================
-- 8. Access log (HIPAA view tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS access_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clinica_id BIGINT NOT NULL,
    user_id BIGINT,
    user_email VARCHAR(255),
    accion VARCHAR(20) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id BIGINT NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_accesslog_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
    INDEX idx_accesslog_clinica (clinica_id),
    INDEX idx_accesslog_user (user_id),
    INDEX idx_accesslog_entidad (entidad, entidad_id),
    INDEX idx_accesslog_fecha (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
