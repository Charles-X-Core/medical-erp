#!/bin/bash
TOKEN=$(curl -4 -sS http://127.0.0.1:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"$APP_USER_EMAIL","password":"$APP_USER_PASSWORD"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "TOKEN=$TOKEN"

echo "=== PREVIEW ==="
curl -4 -sS "http://127.0.0.1:8080/api/v1/contrato-pwa/preview?pacienteId=1&templateCode=CONTRATO_MEMBRESIA" -H "Authorization: Bearer $TOKEN" 2>&1 | head -c 500

echo ""
echo ""
echo "=== ERRORS ==="
journalctl -u medical-erp.service --since '1 min ago' --no-pager 2>&1 | grep -i 'exception\|error\|TEMPLATE_NOT' || echo "No errors"
