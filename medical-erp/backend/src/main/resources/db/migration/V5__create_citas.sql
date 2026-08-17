-- V5__create_citas.sql
-- Description: Create citas table
-- Author: Medical ERP System
-- Date: 2026-07-29

CREATE TABLE IF NOT EXISTS citas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    paciente_id BIGINT NOT NULL,
    usuario_id BIGINT,
    tipo_cita_id BIGINT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    duracion_minutos INT DEFAULT 30,
    motivo VARCHAR(500) NOT NULL,
    motivo_editado VARCHAR(500),
    estado VARCHAR(20) DEFAULT 'pendiente',
    consulta_id BIGINT,
    notas TEXT,
    asistio_confirmed_at TIMESTAMP NULL,
    cancelado_at TIMESTAMP NULL,
    cancelado_motivo VARCHAR(500),
    reprogramada_de BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_citas_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_citas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_citas_tipo_cita FOREIGN KEY (tipo_cita_id) REFERENCES tipos_cita(id) ON DELETE SET NULL,
    CONSTRAINT fk_citas_reprogramada FOREIGN KEY (reprogramada_de) REFERENCES citas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_citas_fecha ON citas(fecha);
CREATE INDEX idx_citas_estado ON citas(estado);
CREATE INDEX idx_citas_paciente ON citas(paciente_id);
CREATE INDEX idx_citas_usuario ON citas(usuario_id);
