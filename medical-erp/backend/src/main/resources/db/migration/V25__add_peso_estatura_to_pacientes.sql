-- V25: Add peso and estatura columns to pacientes table (safe/conditional)

SET @peso_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pacientes'
    AND COLUMN_NAME = 'peso'
);

SET @sql = IF(@peso_exists = 0,
    'ALTER TABLE pacientes ADD COLUMN peso DECIMAL(5,2) NULL',
    'SELECT "Column peso already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @estatura_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pacientes'
    AND COLUMN_NAME = 'estatura'
);

SET @sql2 = IF(@estatura_exists = 0,
    'ALTER TABLE pacientes ADD COLUMN estatura DECIMAL(5,2) NULL',
    'SELECT "Column estatura already exists"'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
