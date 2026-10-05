-- Add requiere_medicacion column to tratamientos
ALTER TABLE tratamientos ADD COLUMN requiere_medicacion TINYINT(1) DEFAULT 0;

-- Create recetas table
CREATE TABLE recetas (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    clinica_id BIGINT NOT NULL,
    paciente_id BIGINT NOT NULL,
    tratamiento_id BIGINT,
    sesion_id BIGINT,
    consulta_id BIGINT,
    medicamento VARCHAR(200) NOT NULL,
    dosis VARCHAR(100),
    frecuencia VARCHAR(100),
    duracion VARCHAR(100),
    indicaciones TEXT,
    fecha DATETIME NOT NULL,
    archivo_ruta VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_recetas_paciente (paciente_id),
    INDEX idx_recetas_tratamiento (tratamiento_id),
    INDEX idx_recetas_sesion (sesion_id),
    INDEX idx_recetas_consulta (consulta_id),
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    FOREIGN KEY (tratamiento_id) REFERENCES tratamientos(id) ON DELETE SET NULL,
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id)
);
