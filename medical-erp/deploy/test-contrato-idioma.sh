#!/bin/bash
# Verifica que el contrato se emita en español para pacientes con pais=PE.
# Credenciales via entorno (ver deploy/.env.example):
#   set -a && . deploy/.env && set +a && bash deploy/test-contrato-idioma.sh
set -e
: "${MYSQL_PASSWORD:?define MYSQL_PASSWORD (ver deploy/.env.example)}"

LOGIN=$(curl -s -X POST http://127.0.0.1:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@clinica.com","password":"Admin123"}')
TOKEN=$(echo "$LOGIN" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
AUTH="Authorization: Bearer $TOKEN"

for PID in 13 10; do
  HTML=$(curl -s -G "http://127.0.0.1:8080/api/v1/contrato-pwa/preview" \
    --data-urlencode "pacienteId=$PID" \
    --data-urlencode "templateCode=CONTRATO_MEMBRESIA" \
    -H "$AUTH")
  PAIS=$(mysql -u root -p"$MYSQL_PASSWORD" medical_erp -N -e "SELECT direccion_pais FROM pacientes WHERE id=$PID;" 2>/dev/null)
  MES=$(echo "$HTML" | grep -o -E 'Septiembre|September|septiembre' | head -1)
  printf "paciente=%s pais=%s mes_en_html=%s\n" "$PID" "$PAIS" "$MES"
done

echo "--- PDFs generados (idioma por tamaño/tipo) ---"
ls -la /opt/medical-erp/uploads/pacientes/ 2>/dev/null | tail -5

echo "--- consentimientos actuales ---"
mysql -u root -p"$MYSQL_PASSWORD" medical_erp -e \
  "SELECT id, paciente_id, tipo, storage_path FROM paciente_consentimientos;" 2>/dev/null

echo "--- ERRORs recientes ---"
journalctl -u medical-erp --since '10 minutes ago' --no-pager | grep -Ei ' ERROR |resolveTemplate' | tail -10
echo "--- fin ---"
