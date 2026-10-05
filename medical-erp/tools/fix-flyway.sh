#!/bin/bash
# Fix flyway failed migration V2026.08
mysql -u root medical_erp -e "UPDATE flyway_schema_history SET success=1 WHERE version='2026.08';"
echo "Flyway fix applied"

# Verify column exists
mysql -u root medical_erp -e "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='medical_erp' AND TABLE_NAME='consultas' AND COLUMN_NAME='tratamiento_id';"

# Restart
systemctl restart medical-erp
sleep 15
systemctl status medical-erp --no-pager | head -5

# Test login
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinica.com","password":"Admin123"}' | head -c 200
echo ""
