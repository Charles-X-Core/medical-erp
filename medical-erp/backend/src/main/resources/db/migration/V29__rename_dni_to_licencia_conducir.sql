-- V29: Rename dni to licencia_conducir, drop tipo_documento
-- California DL format: 1 letter + 7 digits = 8 chars

SET @db = (SELECT DATABASE());

-- Rename dni column to licencia_conducir
SET @col = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'pacientes' AND COLUMN_NAME = 'dni');
SET @sql = IF(@col > 0, 'ALTER TABLE pacientes CHANGE dni licencia_conducir VARCHAR(8)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop tipo_documento column
SET @col2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'pacientes' AND COLUMN_NAME = 'tipo_documento');
SET @sql2 = IF(@col2 > 0, 'ALTER TABLE pacientes DROP COLUMN tipo_documento', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- Recreate unique index on licencia_conducir
SET @idx = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'pacientes' AND INDEX_NAME = 'uk_pacientes_dni');
SET @sql3 = IF(@idx > 0, 'ALTER TABLE pacientes DROP INDEX uk_pacientes_dni', 'SELECT 1');
PREPARE stmt3 FROM @sql3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

SET @idx2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'pacientes' AND INDEX_NAME = 'uk_pacientes_licencia');
SET @sql4 = IF(@idx2 = 0, 'ALTER TABLE pacientes ADD UNIQUE KEY uk_pacientes_licencia (licencia_conducir)', 'SELECT 1');
PREPARE stmt4 FROM @sql4; EXECUTE stmt4; DEALLOCATE PREPARE stmt4;
