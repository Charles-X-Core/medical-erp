-- V20__add_estado_to_tratamientos.sql
-- Description: Ensure estado column exists and update default for state machine
-- Author: Medical ERP System
-- Date: 2026-08-03

-- Column may already exist from previous migration attempts
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'medical_erp_dev'
    AND TABLE_NAME = 'tratamientos'
    AND COLUMN_NAME = 'estado'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE tratamientos ADD COLUMN estado VARCHAR(30) NOT NULL DEFAULT ''PENDIENTE'' AFTER tipo_tratamiento',
    'ALTER TABLE tratamientos ALTER COLUMN estado SET DEFAULT ''PENDIENTE'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing records that have the old defaults
UPDATE tratamientos SET estado = 'PENDIENTE' WHERE estado = 'PENDIENTE_INICIO';
UPDATE tratamientos SET estado = 'EN_CURSO' WHERE estado = 'ACTIVO';
