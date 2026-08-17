-- V4__create_historias_consultas_documentos.sql
-- Description: Create historia_clinica, consultas, and documentos tables
-- Author: Medical ERP System
-- Date: 2026-07-29

CREATE TABLE IF NOT EXISTS historias_clinicas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    paciente_id BIGINT NOT NULL,
    numero_historia VARCHAR(50),
    alergia_medicamentos TEXT,
    cardiopatias_personales TEXT,
    cardiopatias_familiares TEXT,
    diabetes_personal TEXT,
    diabetes_familiar TEXT,
    hepatitis TEXT,
    otras_enfermedades TEXT,
    observaciones TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_historias_paciente UNIQUE (paciente_id),
    CONSTRAINT fk_historias_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consultas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    historia_id BIGINT NOT NULL,
    cita_id BIGINT,
    fecha TIMESTAMP NOT NULL,
    motivo VARCHAR(500) NOT NULL,
    tiempo_enfermedad VARCHAR(255),
    signos_sintomas TEXT,
    relato_cronologico TEXT,
    signos_vitales JSON,
    examen_clinico_general TEXT,
    diagnostico_lista JSON,
    plan_tratamiento JSON,
    notas TEXT,
    firmado BOOLEAN DEFAULT FALSE,
    firmado_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_consultas_historia FOREIGN KEY (historia_id) REFERENCES historias_clinicas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documentos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    paciente_id BIGINT NOT NULL,
    cita_id BIGINT,
    consulta_id BIGINT,
    usuario_id BIGINT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    archivo_ruta VARCHAR(500) NOT NULL,
    archivo_nombre VARCHAR(255) NOT NULL,
    hash_sha256 VARCHAR(64),
    firma_imagen TEXT,
    firmado BOOLEAN DEFAULT FALSE,
    firmado_at TIMESTAMP NULL,
    estado VARCHAR(20) DEFAULT 'borrador',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_documentos_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_documentos_consulta FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE SET NULL,
    CONSTRAINT fk_documentos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_consultas_historia ON consultas(historia_id);
CREATE INDEX idx_consultas_fecha ON consultas(fecha);
CREATE INDEX idx_documentos_paciente ON documentos(paciente_id);
CREATE INDEX idx_documentos_tipo ON documentos(tipo);
