-- Add tratamiento_id column to consultas table
-- Links a consulta to the treatment it initiated
ALTER TABLE consultas ADD COLUMN tratamiento_id BIGINT NULL AFTER cita_id;
CREATE INDEX idx_consultas_tratamiento_id ON consultas(tratamiento_id);
