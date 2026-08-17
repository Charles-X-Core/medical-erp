-- V34: Add solicitada_por to citas + new states
-- Column, FK, and index may already exist from partial apply

SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'citas' AND column_name = 'solicitada_por'
);

SET @sql = IF(@column_exists = 0,
  'ALTER TABLE citas ADD COLUMN solicitada_por BIGINT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'citas' AND constraint_name = 'fk_citas_solicitada_por'
);

SET @sql2 = IF(@fk_exists = 0,
  'ALTER TABLE citas ADD CONSTRAINT fk_citas_solicitada_por FOREIGN KEY (solicitada_por) REFERENCES usuarios(id)',
  'SELECT 1'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'citas' AND index_name = 'idx_citas_solicitada_estado'
);

SET @sql3 = IF(@idx_exists = 0,
  'CREATE INDEX idx_citas_solicitada_estado ON citas(estado, solicitada_por)',
  'SELECT 1'
);
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;
