-- V42: Add sesion_id to citas for bidirectional cita <-> sesion_tratamiento link
-- Adds a nullable FK from citas -> sesiones_tratamiento(id).
-- This enables the strict link: a cita of a treatment points to the specific session
-- that will run when the appointment date arrives.

SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'citas'
    AND COLUMN_NAME = 'sesion_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE citas ADD COLUMN sesion_id BIGINT NULL AFTER tratamiento_id',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'citas'
    AND CONSTRAINT_NAME = 'fk_citas_sesion'
);

SET @sql2 = IF(@fk_exists = 0,
    'ALTER TABLE citas ADD CONSTRAINT fk_citas_sesion FOREIGN KEY (sesion_id) REFERENCES sesiones_tratamiento(id)',
    'SELECT 1'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

SET @idx_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'citas'
    AND INDEX_NAME = 'idx_citas_sesion'
);

SET @sql3 = IF(@idx_exists = 0,
    'CREATE INDEX idx_citas_sesion ON citas(sesion_id)',
    'SELECT 1'
);
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;
