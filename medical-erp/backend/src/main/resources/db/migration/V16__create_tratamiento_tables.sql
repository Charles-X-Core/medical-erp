-- V12__create_tratamiento_tables.sql
-- Description: Create treatment module tables (tratamientos, protocolos, sesiones, evidencias, historial, tipos_sesion)
-- Author: Medical ERP System
-- Date: 2026-08-02

-- 1. Tipos de sesion de tratamiento (catalogo)
CREATE TABLE IF NOT EXISTS tipos_sesion_tratamiento (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clinica_id BIGINT NOT NULL,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500),
    duracion_minutos INT NOT NULL DEFAULT 60,
    requiere_protocolo BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    orden INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_tipo_sesion_codigo UNIQUE (clinica_id, codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tratamientos
CREATE TABLE IF NOT EXISTS tratamientos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clinica_id BIGINT NOT NULL,
    paciente_id BIGINT NOT NULL,
    historia_clinica_id BIGINT,
    consulta_origen_id BIGINT,
    tipo_tratamiento VARCHAR(100) NOT NULL,
    diagnostico_inicial TEXT,
    objetivo TEXT NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_INICIO',
    sesiones_planeadas INT NOT NULL DEFAULT 1,
    sesiones_realizadas INT NOT NULL DEFAULT 0,
    costo_estimado DECIMAL(10,2),
    costo_total DECIMAL(10,2) DEFAULT 0,
    observaciones TEXT,
    resultado_final TEXT,
    motivo_cancelacion VARCHAR(500),
    motivo_pausa VARCHAR(500),
    usuario_asignado_id BIGINT,
    version INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_tratamientos_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tratamientos_historia FOREIGN KEY (historia_clinica_id) REFERENCES historias_clinicas(id) ON DELETE SET NULL,
    CONSTRAINT fk_tratamientos_consulta FOREIGN KEY (consulta_origen_id) REFERENCES consultas(id) ON DELETE SET NULL,
    CONSTRAINT fk_tratamientos_usuario FOREIGN KEY (usuario_asignado_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Protocolos clinicos (obligatorio para el negocio, no NOT NULL en BD)
CREATE TABLE IF NOT EXISTS protocolos_clinicos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tratamiento_id BIGINT NOT NULL,
    clinica_id BIGINT NOT NULL,
    frecuencia_dias INT,
    duracion_sesion_minutos INT DEFAULT 60,
    notas_protocolo TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_protocolo_tratamiento UNIQUE (tratamiento_id),
    CONSTRAINT fk_protocolo_tratamiento FOREIGN KEY (tratamiento_id) REFERENCES tratamientos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Sesiones de tratamiento
CREATE TABLE IF NOT EXISTS sesiones_tratamiento (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tratamiento_id BIGINT NOT NULL,
    clinica_id BIGINT NOT NULL,
    tipo_sesion_id BIGINT NOT NULL,
    numero_sesion INT NOT NULL,
    fecha TIMESTAMP NOT NULL,
    motivo_visita VARCHAR(500),
    signos_vitales JSON,
    procedimiento_realizado TEXT,
    medicamentos VARCHAR(1000),
    dosis VARCHAR(500),
    observaciones TEXT,
    evolucion TEXT,
    costo_sesion DECIMAL(10,2) DEFAULT 0,
    requiere_cita BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sesiones_tratamiento FOREIGN KEY (tratamiento_id) REFERENCES tratamientos(id) ON DELETE CASCADE,
    CONSTRAINT fk_sesiones_tipo_sesion FOREIGN KEY (tipo_sesion_id) REFERENCES tipos_sesion_tratamiento(id) ON DELETE RESTRICT,
    CONSTRAINT uk_sesion_numero UNIQUE (tratamiento_id, numero_sesion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Evidencias de tratamiento
CREATE TABLE IF NOT EXISTS evidencias_tratamiento (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sesion_id BIGINT NOT NULL,
    clinica_id BIGINT NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    archivo_ruta VARCHAR(500) NOT NULL,
    archivo_nombre VARCHAR(255) NOT NULL,
    archivo_mime_type VARCHAR(100),
    archivo_tamano BIGINT,
    descripcion VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evidencias_sesion FOREIGN KEY (sesion_id) REFERENCES sesiones_tratamiento(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Historial clinico
CREATE TABLE IF NOT EXISTS historial_clinico (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tratamiento_id BIGINT NOT NULL,
    clinica_id BIGINT NOT NULL,
    tipo_cambio VARCHAR(50) NOT NULL,
    campo_modificado VARCHAR(100),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    motivo TEXT,
    usuario_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_clinico_tratamiento FOREIGN KEY (tratamiento_id) REFERENCES tratamientos(id) ON DELETE CASCADE,
    CONSTRAINT fk_historial_clinico_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Historial administrativo
CREATE TABLE IF NOT EXISTS historial_administrativo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tratamiento_id BIGINT NOT NULL,
    clinica_id BIGINT NOT NULL,
    tipo_cambio VARCHAR(50) NOT NULL,
    campo_modificado VARCHAR(100),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    motivo TEXT,
    usuario_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_admin_tratamiento FOREIGN KEY (tratamiento_id) REFERENCES tratamientos(id) ON DELETE CASCADE,
    CONSTRAINT fk_historial_admin_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes
CREATE INDEX idx_tratamientos_clinica ON tratamientos(clinica_id);
CREATE INDEX idx_tratamientos_paciente ON tratamientos(paciente_id);
CREATE INDEX idx_tratamientos_estado ON tratamientos(estado);
CREATE INDEX idx_tratamientos_tipo ON tratamientos(tipo_tratamiento);
CREATE INDEX idx_protocolos_clinica ON protocolos_clinicos(clinica_id);
CREATE INDEX idx_sesiones_tratamiento ON sesiones_tratamiento(tratamiento_id);
CREATE INDEX idx_sesiones_clinica ON sesiones_tratamiento(clinica_id);
CREATE INDEX idx_sesiones_fecha ON sesiones_tratamiento(fecha);
CREATE INDEX idx_evidencias_sesion ON evidencias_tratamiento(sesion_id);
CREATE INDEX idx_evidencias_clinica ON evidencias_tratamiento(clinica_id);
CREATE INDEX idx_historial_clinico_tratamiento ON historial_clinico(tratamiento_id);
CREATE INDEX idx_historial_clinico_clinica ON historial_clinico(clinica_id);
CREATE INDEX idx_historial_admin_tratamiento ON historial_administrativo(tratamiento_id);
CREATE INDEX idx_historial_admin_clinica ON historial_administrativo(clinica_id);
CREATE INDEX idx_tipos_sesion_clinica ON tipos_sesion_tratamiento(clinica_id);

-- Seed data: Tipos de sesion para clinica default (id=1)
INSERT INTO tipos_sesion_tratamiento (clinica_id, codigo, nombre, descripcion, duracion_minutos, requiere_protocolo, activo, orden) VALUES
(1, 'EVAL', 'Evaluacion Inicial', 'Primera evaluacion del paciente para inicio de tratamiento', 60, false, true, 1),
(1, 'APL', 'Aplicacion', 'Sesion de aplicacion de tratamiento', 60, true, true, 2),
(1, 'CTRL', 'Control', 'Sesion de control y seguimiento', 30, false, true, 3),
(1, 'AJUS', 'Ajuste', 'Ajuste de plan de tratamiento', 30, false, true, 4),
(1, 'CIER', 'Cierre', 'Sesion final de tratamiento', 45, false, true, 5),
(1, 'PROC', 'Procedimiento', 'Procedimiento especial de tratamiento', 60, true, true, 6),
(1, 'SEGU', 'Seguimiento', 'Seguimiento post-tratamiento', 30, false, true, 7);

-- Seed data: Tipos de cita adicionales para tratamientos
INSERT INTO tipos_cita (nombre, duracion_minutos, descripcion, activo) VALUES
('Evaluacion Inicial Tratamiento', 45, 'Primera evaluacion para inicio de tratamiento', true),
('Sesion de Tratamiento', 60, 'Sesion regular de tratamiento', true),
('Control de Tratamiento', 30, 'Control y seguimiento de tratamiento', true),
('Ajuste de Tratamiento', 30, 'Ajuste de plan de tratamiento', true),
('Cierre de Tratamiento', 45, 'Sesion final de tratamiento', true),
('Revision Post-Tratamiento', 30, 'Revision despues de finalizar tratamiento', true),
('Procedimiento Especial', 60, 'Procedimiento especial de tratamiento', true);
