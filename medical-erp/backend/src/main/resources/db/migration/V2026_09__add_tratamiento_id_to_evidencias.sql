-- EvidenciaTratamiento: permitir evidencias a nivel de tratamiento (foto inicio/fin)
-- sin estar ligadas a una sesión. Se agrega tratamiento_id y sesion_id pasa a ser opcional.
ALTER TABLE evidencias_tratamiento
    ADD COLUMN tratamiento_id BIGINT NULL AFTER sesion_id;

ALTER TABLE evidencias_tratamiento
    MODIFY COLUMN sesion_id BIGINT NULL;
