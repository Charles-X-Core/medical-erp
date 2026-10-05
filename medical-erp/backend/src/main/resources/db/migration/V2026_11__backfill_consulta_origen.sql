-- Backfill: enlaza tratamientos sin consulta_origen_id con la consulta mas reciente
-- 1) Tratamientos con historia_clinica_id: busca via historia
UPDATE tratamientos t
SET t.consulta_origen_id = (
    SELECT c.id
    FROM consultas c
    WHERE c.historia_id = t.historia_clinica_id
      AND c.fecha < t.created_at
    ORDER BY c.fecha DESC
    LIMIT 1
)
WHERE t.consulta_origen_id IS NULL
  AND t.historia_clinica_id IS NOT NULL;

-- 2) Tratamientos sin historia_clinica_id: busca via paciente_id -> historias_clinicas
UPDATE tratamientos t
SET t.consulta_origen_id = (
    SELECT c.id
    FROM consultas c
    INNER JOIN historias_clinicas h ON c.historia_id = h.id
    WHERE h.paciente_id = t.paciente_id
      AND c.fecha < t.created_at
    ORDER BY c.fecha DESC
    LIMIT 1
),
t.historia_clinica_id = (
    SELECT h2.id
    FROM historias_clinicas h2
    WHERE h2.paciente_id = t.paciente_id
    LIMIT 1
)
WHERE t.consulta_origen_id IS NULL;
