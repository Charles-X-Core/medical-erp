-- =============================================
-- V24: Evolución Consentimiento Digital + Dirección Estructurada
-- =============================================

-- 1. Dirección estructurada en Paciente
ALTER TABLE pacientes
    CHANGE COLUMN direccion direccion_linea1 VARCHAR(255),
    ADD COLUMN direccion_linea2 VARCHAR(255) AFTER direccion_linea1,
    ADD COLUMN ciudad VARCHAR(100) AFTER direccion_linea2,
    ADD COLUMN estado_provincia VARCHAR(100) AFTER ciudad,
    ADD COLUMN codigo_postal VARCHAR(20) AFTER estado_provincia,
    ADD COLUMN direccion_pais VARCHAR(2) AFTER codigo_postal;

-- 2. Tabla de templates de consentimiento
CREATE TABLE IF NOT EXISTS consent_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clinica_id BIGINT NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) DEFAULT 'text/html',
    variables_requeridas TEXT,
    variables_version VARCHAR(20) DEFAULT '1.0',
    requiere_firma BOOLEAN DEFAULT TRUE,
    requiere_fecha BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_template_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
    CONSTRAINT uk_template_codigo_version UNIQUE (clinica_id, codigo, version),
    INDEX idx_template_clinica (clinica_id),
    INDEX idx_template_codigo (codigo),
    INDEX idx_template_active (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Consentimiento digital en PacienteConsentimiento
ALTER TABLE paciente_consentimientos
    ADD COLUMN template_id BIGINT NULL AFTER user_agent,
    ADD COLUMN paciente_snapshot TEXT AFTER template_id,
    ADD COLUMN firma_fecha TIMESTAMP NULL AFTER paciente_snapshot,
    ADD COLUMN storage_path VARCHAR(500) AFTER firma_fecha,
    ADD COLUMN nombre_archivo VARCHAR(255) AFTER storage_path,
    ADD COLUMN hash_documento VARCHAR(64) AFTER nombre_archivo,
    ADD COLUMN tamano_archivo INT AFTER hash_documento,
    ADD COLUMN estado_documento VARCHAR(20) NOT NULL DEFAULT 'ACEPTADO' AFTER tamano_archivo,
    ADD COLUMN tratamiento_id BIGINT NULL AFTER estado_documento,
    ADD COLUMN consulta_id BIGINT NULL AFTER tratamiento_id,
    ADD CONSTRAINT fk_paccon_template FOREIGN KEY (template_id) REFERENCES consent_templates(id),
    ADD CONSTRAINT fk_paccon_tratamiento FOREIGN KEY (tratamiento_id) REFERENCES tratamientos(id),
    ADD CONSTRAINT fk_paccon_consulta FOREIGN KEY (consulta_id) REFERENCES consultas(id),
    ADD INDEX idx_paccon_template (template_id),
    ADD INDEX idx_paccon_tratamiento (tratamiento_id),
    ADD INDEX idx_paccon_consulta (consulta_id),
    ADD INDEX idx_paccon_estado (estado_documento);
