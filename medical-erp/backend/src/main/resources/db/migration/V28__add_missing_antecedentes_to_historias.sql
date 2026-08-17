-- Add missing antecedentes columns to historias_clinicas
SET @db = (SELECT DATABASE());

SET @col1 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'historias_clinicas' AND COLUMN_NAME = 'propension_hemorragias');
SET @sql1 = IF(@col1 = 0, CONCAT('ALTER TABLE historias_clinicas ADD COLUMN propension_hemorragias TEXT AFTER hepatitis'), 'SELECT 1');
PREPARE stmt1 FROM @sql1; EXECUTE stmt1; DEALLOCATE PREPARE stmt1;

SET @col2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'historias_clinicas' AND COLUMN_NAME = 'complicaciones_anestesia');
SET @sql2 = IF(@col2 = 0, CONCAT('ALTER TABLE historias_clinicas ADD COLUMN complicaciones_anestesia TEXT AFTER propension_hemorragias'), 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

SET @col3 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'historias_clinicas' AND COLUMN_NAME = 'presion_arterial_medicacion');
SET @sql3 = IF(@col3 = 0, CONCAT('ALTER TABLE historias_clinicas ADD COLUMN presion_arterial_medicacion TEXT AFTER complicaciones_anestesia'), 'SELECT 1');
PREPARE stmt3 FROM @sql3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

SET @col4 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'historias_clinicas' AND COLUMN_NAME = 'enfermedad_actual_medicacion');
SET @sql4 = IF(@col4 = 0, CONCAT('ALTER TABLE historias_clinicas ADD COLUMN enfermedad_actual_medicacion TEXT AFTER presion_arterial_medicacion'), 'SELECT 1');
PREPARE stmt4 FROM @sql4; EXECUTE stmt4; DEALLOCATE PREPARE stmt4;
