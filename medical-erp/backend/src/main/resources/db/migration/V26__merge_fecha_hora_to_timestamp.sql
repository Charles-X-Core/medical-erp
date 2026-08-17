-- V26__merge_fecha_hora_to_timestamp.sql
-- Description: Merge fecha DATE + hora TIME into fecha_hora TIMESTAMP in citas table
-- The Cita entity maps to fecha_hora but V5 created fecha/hora as separate columns
-- Safe: checks if fecha_hora already exists before altering

SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'citas'
    AND COLUMN_NAME = 'fecha_hora'
);

SET @old_col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'citas'
    AND COLUMN_NAME = 'fecha'
);

-- Only merge if fecha_hora does NOT exist but fecha does
SET @sql = IF(@col_exists = 0 AND @old_col_exists > 0,
    'ALTER TABLE citas ADD COLUMN fecha_hora DATETIME NOT NULL DEFAULT ''2026-01-01 00:00:00'' AFTER tipo_cita_id',
    'SELECT "Skip: fecha_hora already exists or fecha column missing"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql2 = IF(@col_exists = 0 AND @old_col_exists > 0,
    'UPDATE citas SET fecha_hora = CONCAT(fecha, '' '', hora)',
    'SELECT 1'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

SET @sql3 = IF(@col_exists = 0 AND @old_col_exists > 0,
    'ALTER TABLE citas DROP COLUMN fecha, DROP COLUMN hora',
    'SELECT 1'
);
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;
