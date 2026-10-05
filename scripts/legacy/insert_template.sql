#!/bin/bash
mysql -u root -p"$MYSQL_PASSWORD" medical_erp <<'EOSQL'
INSERT INTO consent_templates
(clinica_id, codigo, version, titulo, storage_path, mime_type, variables_requeridas, variables_version, requiere_firma, requiere_fecha, activo, created_at, updated_at)
VALUES
(1, 'CONTRATO_MEMBRESIA', '1.0', 'Contrato de Membresia - Optimal Health NOW',
 'templates/contrato_membresia_v1.html', 'text/html',
 'nombre_completo,numero_documento,fecha_nacimiento,direccion_completa,telefono,email,sexo,fecha_dia,fecha_mes,fecha_anio',
 '1.0', 1, 1, 1, NOW(), NOW());
EOSQL

echo "=== Verify ==="
mysql -u root -p"$MYSQL_PASSWORD" medical_erp -s -e "SELECT id, clinica_id, codigo, version, titulo, storage_path, activo FROM consent_templates;"
