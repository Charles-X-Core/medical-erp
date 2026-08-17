-- V27__add_tratamiento_id_to_citas.sql
-- Description: Add tratamiento_id column to citas table
-- Links a cita to the specific treatment it belongs to

-- Only add if not already present (handles case where DB was manually modified)
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'citas'
    AND COLUMN_NAME = 'tratamiento_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE citas ADD COLUMN tratamiento_id BIGINT AFTER consulta_id',
    'SELECT "Column tratamiento_id already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
