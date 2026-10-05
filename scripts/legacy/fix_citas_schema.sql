-- ============================================
-- SCRIPT MANUAL: Arreglar esquema de tabla citas
-- Ejecutar en MySQL si V26/V27 no corrieron por Flyway
-- ============================================

-- 1. Agregar fecha_hora si no existe (V26)
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'citas'
    AND COLUMN_NAME = 'fecha_hora'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE citas ADD COLUMN fecha_hora DATETIME NOT NULL DEFAULT ''2026-01-01 00:00:00'' AFTER tipo_cita_id',
    'SELECT "fecha_hora ya existe"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Copiar datos de fecha+hora a fecha_hora si fecha column aun existe
SET @old_col = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'citas'
    AND COLUMN_NAME = 'fecha'
);

SET @sql2 = IF(@old_col > 0,
    'UPDATE citas SET fecha_hora = CONCAT(fecha, '' '', hora) WHERE fecha IS NOT NULL',
    'SELECT 1'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

SET @sql3 = IF(@old_col > 0,
    'ALTER TABLE citas DROP COLUMN fecha, DROP COLUMN hora',
    'SELECT 1'
);
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- 3. Agregar tratamiento_id si no existe (V27)
SET @trat_col = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'citas'
    AND COLUMN_NAME = 'tratamiento_id'
);

SET @sql4 = IF(@trat_col = 0,
    'ALTER TABLE citas ADD COLUMN tratamiento_id BIGINT AFTER consulta_id',
    'SELECT "tratamiento_id ya existe"'
);
PREPARE stmt4 FROM @sql4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

-- 4. Verificar estructura final
DESCRIBE citas;
