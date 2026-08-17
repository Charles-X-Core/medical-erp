-- V17__add_cita_id_to_sesiones_tratamiento.sql
-- Description: Add cita_id FK to sesiones_tratamiento for traceability
-- Author: Medical ERP System
-- Date: 2026-08-03

ALTER TABLE sesiones_tratamiento
ADD COLUMN cita_id BIGINT NULL AFTER tratamiento_id;

ALTER TABLE sesiones_tratamiento
ADD CONSTRAINT fk_sesiones_cita FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE SET NULL;

CREATE INDEX idx_sesiones_cita ON sesiones_tratamiento(cita_id);
