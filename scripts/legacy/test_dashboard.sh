#!/bin/bash
TOKEN=$1
curl -4 -sS http://127.0.0.1:8080/api/v1/dashboard/resumen \
  -H "Authorization: Bearer $TOKEN" 2>&1 | python3 -m json.tool 2>&1 || curl -4 -sS http://127.0.0.1:8080/api/v1/dashboard/resumen -H "Authorization: Bearer $TOKEN" 2>&1
