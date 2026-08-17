-- V31__create_membresias.sql
-- Description: Create membresias table for patient membership tracking
-- Author: Medical ERP System
-- Date: 2026-08-12

CREATE TABLE membresias (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    paciente_id BIGINT NOT NULL,
    clinica_id BIGINT NOT NULL,
    tipo VARCHAR(50) NOT NULL COMMENT 'BASICA, PREMIUM, VIP, CORPORATIVA',
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activa' COMMENT 'activa, vencida, cancelada',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_membresia_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    CONSTRAINT fk_membresia_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
    CONSTRAINT chk_membresia_estado CHECK (estado IN ('activa', 'vencida', 'cancelada'))
);

CREATE INDEX idx_membresia_paciente ON membresias(paciente_id);
CREATE INDEX idx_membresia_clinica ON membresias(clinica_id);
CREATE INDEX idx_membresia_estado ON membresias(estado);
