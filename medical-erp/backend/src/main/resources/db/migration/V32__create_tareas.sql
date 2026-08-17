-- V32__create_tareas.sql
-- Description: Create tareas table for inter-role task assignment
-- Author: Medical ERP System
-- Date: 2026-08-12

CREATE TABLE tareas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clinica_id BIGINT NOT NULL,
    origen_usuario_id BIGINT NOT NULL,
    destino_rol VARCHAR(30) NOT NULL COMMENT 'enfermera, doctora, admin',
    paciente_id BIGINT,
    tipo VARCHAR(30) NOT NULL COMMENT 'BUSCAR_CITA, REGISTRAR_PACIENTE, FIRMAR_DOCUMENTO, OTRO',
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' COMMENT 'pendiente, en_proceso, completada, cancelada',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_tarea_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
    CONSTRAINT fk_tarea_origen_usuario FOREIGN KEY (origen_usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_tarea_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    CONSTRAINT chk_tarea_estado CHECK (estado IN ('pendiente', 'en_proceso', 'completada', 'cancelada'))
);

CREATE INDEX idx_tarea_destino ON tareas(destino_rol, estado);
CREATE INDEX idx_tarea_clinica ON tareas(clinica_id);
CREATE INDEX idx_tarea_paciente ON tareas(paciente_id);
