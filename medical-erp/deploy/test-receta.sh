#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@clinica.com","password":"Admin123"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["token"])')
echo "TOKEN_LEN=${#TOKEN}"

echo "--- Create receta ---"
curl -s -X POST http://localhost:8080/api/v1/recetas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"clinicaId":1,"pacienteId":8,"medicamento":"Test Medication","dosis":"500mg","frecuencia":"3 veces al dia","duracion":"7 dias","fecha":"2026-08-30T12:00:00"}'

echo ""
echo "--- Get recetas by paciente ---"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/recetas/paciente/8 | python3 -c 'import sys,json; d=json.load(sys.stdin); print("Count:", len(d.get("data",[])) if isinstance(d.get("data"), list) else 0)'
