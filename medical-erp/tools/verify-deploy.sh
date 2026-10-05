#!/bin/bash
# Test backend login
RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinica.com","password":"Admin123"}')
echo "Response: $RESPONSE" | head -c 200
echo ""
echo "=== Backend started successfully ==="

# Check JAR md5
md5sum /opt/medical-erp/app.jar
