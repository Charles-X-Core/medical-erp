#!/bin/bash
echo "=== TEST LOGIN ==="
RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinica.com","password":"Admin123"}')
echo "$RESPONSE" | head -c 300
echo ""
echo "=== DONE ==="
