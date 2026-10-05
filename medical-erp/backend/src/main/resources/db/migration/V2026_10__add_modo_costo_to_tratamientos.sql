-- Tratamiento: agregar el modo de costeo del plan (IGUAL / DIFERENTE / MEMBRESIA)
ALTER TABLE tratamientos
    ADD COLUMN modo_costo VARCHAR(20) NULL;
