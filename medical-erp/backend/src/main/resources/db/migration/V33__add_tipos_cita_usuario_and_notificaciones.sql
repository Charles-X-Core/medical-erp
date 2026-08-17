-- V33__add_tipos_cita_usuario_and_notificaciones.sql
-- Adds usuario_id to tipos_cita (per-doctor types)
-- Creates notificaciones table (doctora <-> enfermera messaging)

-- 1. Add usuario_id to tipos_cita (nullable = global, non-null = personal del doctor)
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tipos_cita' AND COLUMN_NAME = 'usuario_id'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE tipos_cita ADD COLUMN usuario_id BIGINT NULL AFTER buffer_minutos',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tipos_cita' AND CONSTRAINT_NAME = 'fk_tipos_cita_usuario'
);
SET @sql2 = IF(@fk_exists = 0,
    'ALTER TABLE tipos_cita ADD CONSTRAINT fk_tipos_cita_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tipos_cita' AND INDEX_NAME = 'idx_tipos_cita_usuario_id'
);
SET @sql3 = IF(@idx_exists = 0,
    'CREATE INDEX idx_tipos_cita_usuario_id ON tipos_cita(usuario_id)',
    'SELECT 1'
);
PREPARE stmt3 FROM @sql3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

-- 2. Create notificaciones table (idempotent)
SET @table_exists = (
    SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones'
);
SET @sql4 = IF(@table_exists = 0,
    'CREATE TABLE notificaciones (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        clinica_id BIGINT NOT NULL,
        usuario_destino_id BIGINT NOT NULL,
        usuario_origen_id BIGINT NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        mensaje TEXT NOT NULL,
        referencia_tipo VARCHAR(50) NULL,
        referencia_id BIGINT NULL,
        leida BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_notif_usuario_destino FOREIGN KEY (usuario_destino_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        CONSTRAINT fk_notif_usuario_origen FOREIGN KEY (usuario_origen_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )',
    'SELECT 1'
);
PREPARE stmt4 FROM @sql4; EXECUTE stmt4; DEALLOCATE PREPARE stmt4;

SET @idx1_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones' AND INDEX_NAME = 'idx_notif_destino_leida'
);
SET @sql5 = IF(@idx1_exists = 0,
    'CREATE INDEX idx_notif_destino_leida ON notificaciones(usuario_destino_id, leida)',
    'SELECT 1'
);
PREPARE stmt5 FROM @sql5; EXECUTE stmt5; DEALLOCATE PREPARE stmt5;

SET @idx2_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones' AND INDEX_NAME = 'idx_notif_clinica'
);
SET @sql6 = IF(@idx2_exists = 0,
    'CREATE INDEX idx_notif_clinica ON notificaciones(clinica_id)',
    'SELECT 1'
);
PREPARE stmt6 FROM @sql6; EXECUTE stmt6; DEALLOCATE PREPARE stmt6;
