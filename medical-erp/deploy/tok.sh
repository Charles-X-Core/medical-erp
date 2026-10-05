#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@clinica.com","password":"Admin123"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["token"])')
echo "TOKEN_LEN=${#TOKEN}"
curl -s -o /dev/null -w 'WITH_AUTH=%{http_code}\n' -H "Authorization: Bearer $TOKEN" 'http://localhost:8080/api/v1/evidencias/file/1/pacientes/8/tratamientos/5/sesion_2/44376b4a-ccb8-4b41-aeb8-63d0a69714a9.png'
