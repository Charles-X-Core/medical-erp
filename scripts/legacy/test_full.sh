#!/bin/bash
# Login
RESP=$(curl -4 -sS http://127.0.0.1:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@clinica.com","password":"Admin123"}')
TOKEN=$(echo "$RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "TOKEN=$TOKEN"

# Test dashboard
echo "=== DASHBOARD ==="
curl -4 -sS http://127.0.0.1:8080/api/v1/dashboard/resumen -H "Authorization: Bearer $TOKEN" 2>&1

# Check logs for errors
echo ""
echo "=== RECENT ERRORS ==="
journalctl -u medical-erp.service --since '1 min ago' --no-pager 2>&1 | grep -i 'Exception\|ERROR\|tipo.*did not match' || echo "No errors found"
