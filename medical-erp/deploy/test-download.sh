#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@clinica.com","password":"Admin123"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["token"])')
echo "TOKEN=${TOKEN:0:20}..."
echo "--- Test unencoded path ---"
curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" 'http://localhost:8080/api/v1/evidencias/download/1/pacientes/8/tratamientos/5/sesion_1/21cb5b7e-ccdd-49dd-ae06-e667b52ed7f4.png'
echo ''
echo "--- Test encoded path ---"
curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" 'http://localhost:8080/api/v1/evidencias/download/1%2Fpacientes%2F8%2Ftratamientos%2F5%2Fsesion_1%2F21cb5b7e-ccdd-49dd-ae06-e667b52ed7f4.png'
echo ''
echo "--- Test file endpoint ---"
curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" 'http://localhost:8080/api/v1/evidencias/file/1/pacientes/8/tratamientos/5/sesion_1/21cb5b7e-ccdd-49dd-ae06-e667b52ed7f4.png'
echo ''
