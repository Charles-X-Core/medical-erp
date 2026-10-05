-- V45: Add motivoInicial (Reason for Visit) field to consultas
ALTER TABLE consultas ADD COLUMN motivo_inicial VARCHAR(500) NULL;
