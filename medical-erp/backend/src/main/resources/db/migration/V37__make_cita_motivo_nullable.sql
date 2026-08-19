-- Make motivo column nullable in citas table
-- Previously motivo was NOT NULL, but appointments can be created without a motivo
ALTER TABLE citas MODIFY COLUMN motivo VARCHAR(500) NULL;
