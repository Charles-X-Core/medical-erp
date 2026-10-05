#!/bin/bash
curl -4 -sS http://127.0.0.1:8080/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"admin@clinica.com","password":"Admin123"}' 2>&1
echo ""
echo "EXIT=$?"
