#!/bin/bash
curl -4 -sS http://127.0.0.1:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinica.com","password":"Admin123"}' 2>&1
