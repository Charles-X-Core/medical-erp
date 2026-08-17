-- V35: Tabla de sesiones de firma de contrato (kiosco PWA)
CREATE TABLE IF NOT EXISTS contrato_signing_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clinica_id BIGINT NOT NULL,
    paciente_id BIGINT NOT NULL,
    template_code VARCHAR(50) NOT NULL,
    signing_token VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    consentimiento_id BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    signed_at TIMESTAMP NULL,
    CONSTRAINT fk_css_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
    CONSTRAINT fk_css_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    CONSTRAINT fk_css_consentimiento FOREIGN KEY (consentimiento_id) REFERENCES paciente_consentimientos(id),
    CONSTRAINT uk_css_token UNIQUE (signing_token),
    CONSTRAINT chk_css_status CHECK (status IN ('PENDIENTE', 'FIRMADO', 'EXPIRADO')),
    INDEX idx_css_clinica_status (clinica_id, status),
    INDEX idx_css_token (signing_token),
    INDEX idx_css_paciente (paciente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
