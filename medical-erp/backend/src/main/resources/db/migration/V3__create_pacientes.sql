-- V3__create_pacientes.sql
-- Description: Create pacientes table
-- Author: Medical ERP System
-- Date: 2026-07-29

CREATE TABLE IF NOT EXISTS pacientes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
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
    CONSTRAINT uk_pacientes_dni UNIQUE (dni)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_pacientes_apellido ON pacientes(apellido_paterno);
CREATE INDEX idx_pacientes_nombres ON pacientes(nombres);
CREATE INDEX idx_pacientes_estado ON pacientes(estado);
