#!/bin/bash
# Prueba signos vitales (peso/estatura) y consulta instantanea (walk-in).
# Credenciales via entorno (ver deploy/.env.example):
#   set -a && . deploy/.env && set +a && bash deploy/test-signos-walkin.sh
set -e
: "${MYSQL_PASSWORD:?define MYSQL_PASSWORD (ver deploy/.env.example)}"

LOGIN=$(curl -s -X POST http://127.0.0.1:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@clinica.com","password":"Admin123"}')
TOKEN=$(echo "$LOGIN" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
AUTH="Authorization: Bearer $TOKEN"
echo "token_len=${#TOKEN}"

echo "=== 1. Crear paciente de prueba ==="
CREADO=$(curl -s -X POST http://127.0.0.1:8080/api/v1/pacientes \
  -H 'Content-Type: application/json' -H "$AUTH" \
  -d '{"documento":"99999999","licenciaConducir":"TEST9999","apellidoPaterno":"PRUEBA","apellidoMaterno":"API","nombres":"Test Signos","sexo":"M","fechaNacimiento":"1990-01-01","direccionPais":"US"}')
echo "$CREADO"
PID=$(echo "$CREADO" | sed -n 's/.*"id":\([0-9]*\).*/\1/p' | head -1)
echo "pacienteId=$PID"
if [ -z "$PID" ]; then echo "FALLO crear paciente"; exit 1; fi

echo
echo "=== 2. PATCH signos-vitales (esperado 200 + peso 70.5 / estatura 165) ==="
curl -s -o /tmp/p1 -w 'http=%{http_code}\n' -X PATCH \
  -H 'Content-Type: application/json' -H "$AUTH" \
  -d '{"peso":70.5,"estatura":165}' \
  "http://127.0.0.1:8080/api/v1/pacientes/$PID/signos-vitales"
cat /tmp/p1; echo

echo
echo "=== 3. Verificar en BD ==="
mysql -u root -p"$MYSQL_PASSWORD" medical_erp -N -e \
  "SELECT CONCAT('peso=',peso,' estatura=',estatura) FROM pacientes WHERE id=$PID;"

echo
echo "=== 4. GET paciente (debe reflejar los valores) ==="
curl -s "http://127.0.0.1:8080/api/v1/pacientes/$PID" -H "$AUTH" \
  | sed -n 's/.*"peso":\([^,]*\).*"estatura":\([^,]*\).*/peso=\1 estatura=\2/p'

echo
echo "=== 5. POST walk-in (esperado 201 + estado en_atencion) ==="
WALK=$(curl -s -o /tmp/p2 -w '%{http_code}' -X POST \
  -H "$AUTH" \
  "http://127.0.0.1:8080/api/v1/citas/walk-in?pacienteId=$PID&motivo=Atenci%C3%B3n%20directa")
echo "http=$WALK"
cat /tmp/p2; echo
CID=$(cat /tmp/p2 | sed -n 's/.*"id":\([0-9]*\).*/\1/p' | head -1)
echo "citaId=$CID"

echo
echo "=== 6. Verificar cita en BD ==="
mysql -u root -p"$MYSQL_PASSWORD" medical_erp -N -e \
  "SELECT CONCAT('id=',id,' estado=',estado,' motivo=',motivo,' fecha_hora=',fecha_hora,' inicio_atencion=',IFNULL(inicio_atencion,'NULL')) FROM citas WHERE id=$CID;"

echo
echo "=== LIMPIEZA ==="
if [ -n "$CID" ]; then
  mysql -u root -p"$MYSQL_PASSWORD" medical_erp -e "SET FOREIGN_KEY_CHECKS=0; DELETE FROM citas WHERE id=$CID; SET FOREIGN_KEY_CHECKS=1;"
  echo "cita $CID borrada"
fi
if [ -n "$PID" ]; then
  curl -s -o /dev/null -w 'delete paciente http=%{http_code}\n' -X DELETE \
    -H "$AUTH" "http://127.0.0.1:8080/api/v1/pacientes/$PID"
  mysql -u root -p"$MYSQL_PASSWORD" medical_erp -e "SET FOREIGN_KEY_CHECKS=0; DELETE FROM pacientes WHERE id=$PID; SET FOREIGN_KEY_CHECKS=1;"
  echo "paciente $PID borrado"
fi
echo "pacientes restantes: $(mysql -u root -p"$MYSQL_PASSWORD" medical_erp -N -e 'SELECT COUNT(*) FROM pacientes;')"
echo "citas restantes: $(mysql -u root -p"$MYSQL_PASSWORD" medical_erp -N -e 'SELECT COUNT(*) FROM citas;')"
