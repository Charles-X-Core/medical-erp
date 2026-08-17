-- V9__add_circular_foreign_keys.sql
-- Description: Add circular foreign keys after all tables exist
-- Author: Medical ERP System
-- Date: 2026-07-29

-- Add FK from consultas to citas (removed from V4, added here after citas table exists in V5)
ALTER TABLE consultas
    ADD CONSTRAINT fk_consultas_cita FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE SET NULL;

-- Add FK from documentos to citas (removed from V4, added here after citas table exists in V5)
ALTER TABLE documentos
    ADD CONSTRAINT fk_documentos_cita FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE SET NULL;

-- Add FK from citas to consultas (removed from V5, added here after consultas table exists in V4)
ALTER TABLE citas
    ADD CONSTRAINT fk_citas_consulta FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE SET NULL;
