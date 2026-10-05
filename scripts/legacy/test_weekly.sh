#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@clinica.com","password":"Admin123"}' | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("token",""))')
echo "Token: ${TOKEN:0:30}..."

echo ""
echo "=== TEST DAILY (should work) ==="
timeout 15 curl -s -o /tmp/daily.json -w "HTTP %{http_code} in %{time_total}s\n" -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/v1/agenda/4/disponibilidad?fecha=2026-08-27&duracion=30&soloDisponibles=true"
python3 -c "import json; d=json.load(open('/tmp/daily.json')); print('Daily slots:', len(d.get('data',[])))"

echo ""
echo "=== TEST WEEKLY (hangs) ==="
timeout 30 curl -s -o /tmp/weekly.json -w "HTTP %{http_code} in %{time_total}s\n" -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/v1/agenda/4/disponibilidad-semana?inicio=2026-08-25&fin=2026-08-29&duracion=30&soloDisponibles=true"
EXIT=$?
echo "curl exit: $EXIT"
if [ $EXIT -eq 0 ]; then
  python3 -c "import json; d=json.load(open('/tmp/weekly.json')); print('Weekly slots:', len(d.get('data',[])))"
elif [ $EXIT -eq 124 ]; then
  echo "TIMEOUT after 30s!"
fi

echo ""
echo "=== MEMORY ==="
ps -C java -o pid,rss,%mem,etime --no-headers
