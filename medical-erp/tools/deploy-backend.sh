#!/bin/bash
# Check if tratamiento_id column exists
EXISTS=$(mysql -u root medical_erp -N -e "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='medical_erp' AND TABLE_NAME='consultas' AND COLUMN_NAME='tratamiento_id';")
echo "Column exists: $EXISTS"

if [ "$EXISTS" = "0" ]; then
  mysql -u root medical_erp -e "ALTER TABLE consultas ADD COLUMN tratamiento_id BIGINT NULL AFTER cita_id;"
  mysql -u root medical_erp -e "CREATE INDEX idx_consultas_tratamiento_id ON consultas(tratamiento_id);"
  echo "Column added"
else
  echo "Column already exists"
fi

# Restart service
systemctl restart medical-erp
sleep 3
systemctl status medical-erp --no-pager | head -10
