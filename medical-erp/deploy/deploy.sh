#!/bin/bash
# ============================================
# Medical ERP - VPS Deployment Script
# Server: 217.216.41.38
# ============================================
set -e

echo "=== Medical ERP Deployment ==="
echo ""

# --- PHASE 1: Create directory structure ---
echo "[1/8] Creating directory structure..."
mkdir -p /opt/medical-erp/{config,uploads,logs,scripts,frontend,backups}
chmod 755 /opt/medical-erp/uploads
chmod 755 /opt/medical-erp/logs

# --- PHASE 2: Setup MySQL ---
echo "[2/8] Setting up MySQL database..."

# Check if MySQL is running
if ! systemctl is-active --quiet mysql; then
    echo "  Starting MySQL..."
    systemctl start mysql
fi

# Create database and user
mysql -u root <<'SQL'
CREATE DATABASE IF NOT EXISTS medical_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'medicalerp'@'localhost' IDENTIFIED BY 'MedicalErp2026!';
GRANT ALL PRIVILEGES ON medical_erp.* TO 'medicalerp'@'localhost';
FLUSH PRIVILEGES;
SQL

echo "  Database 'medical_erp' created, user 'medicalerp' granted."

# --- PHASE 3: Install Java if not present ---
echo "[3/8] Checking Java..."
if ! command -v java &> /dev/null; then
    echo "  Installing Java 21..."
    apt-get update -qq
    apt-get install -y openjdk-21-jre-headless
fi
java -version 2>&1 | head -1

# --- PHASE 4: Upload files (manual step) ---
echo "[4/8] Waiting for files..."
echo "  >>> MANUAL STEP: Upload these files to /opt/medical-erp/:"
echo "      1. medical-erp-1.0.0.jar -> /opt/medical-erp/app.jar"
echo "      2. frontend/dist/ -> /opt/medical-erp/frontend/"
echo ""
echo "  From your Windows machine, run:"
echo "    pscp -pw YOUR_PASSWORD medical-erp\\backend\\target\\medical-erp-1.0.0.jar root@217.216.41.38:/opt/medical-erp/app.jar"
echo "    pscp -r -pw YOUR_PASSWORD medical-erp\\frontend\\dist\\* root@217.216.41.38:/opt/medical-erp/frontend/"
echo ""
echo "  Press ENTER when files are uploaded..."
read -r

# --- PHASE 5: Configure backend ---
echo "[5/8] Configuring backend..."

# The application.properties should already be uploaded
# If not, copy it from the deploy package
if [ ! -f /opt/medical-erp/config/application.properties ]; then
    echo "  ERROR: /opt/medical-erp/config/application.properties not found!"
    echo "  Please upload it first."
    exit 1
fi

# Ensure correct permissions
chmod 644 /opt/medical-erp/config/application.properties
chmod 755 /opt/medical-erp/app.jar

# --- PHASE 6: Setup systemd service ---
echo "[6/8] Setting up systemd service..."

cat > /etc/systemd/system/medical-erp.service << 'EOF'
[Unit]
Description=Medical ERP Backend
After=network.target mysql.service
Requires=mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/medical-erp
ExecStart=/usr/bin/java -Xms256m -Xmx2g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -Dspring.profiles.active=prod -jar /opt/medical-erp/app.jar
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=medical-erp

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
echo "  Service 'medical-erp' created."

# --- PHASE 7: Start backend ---
echo "[7/8] Starting backend..."
systemctl enable medical-erp
systemctl start medical-erp

echo "  Waiting for startup (Flyway migrations)..."
sleep 15

# Health check
echo "  Checking health..."
HEALTH=$(curl -s http://127.0.0.1:8080/actuator/health 2>/dev/null || echo '{"status":"DOWN"}')
if echo "$HEALTH" | grep -q '"status":"UP"'; then
    echo "  ✅ Backend is running!"
else
    echo "  ⚠️ Backend might still be starting. Check: systemctl status medical-erp"
    echo "  Logs: journalctl -u medical-erp -f"
fi

# --- PHASE 8: Configure Nginx ---
echo "[8/8] Configuring Nginx..."

# Remove default config if it conflicts
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm -f /etc/nginx/sites-enabled/default
fi

cat > /etc/nginx/sites-available/medical-erp << 'EOF'
server {
    listen 80;
    server_name 217.216.41.38;

    root /opt/medical-erp/frontend;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_read_timeout 60s;
        client_max_body_size 10M;
    }

    location /actuator/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

ln -sf /etc/nginx/sites-available/medical-erp /etc/nginx/sites-enabled/medical-erp
nginx -t && systemctl reload nginx

echo ""
echo "============================================"
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo "  Frontend: http://217.216.41.38"
echo "  Backend:  http://217.216.41.38/api/v1/"
echo "  Health:   http://217.216.41.38/actuator/health"
echo ""
echo "  Admin Login:"
echo "    Email:    admin@clinica.com"
echo "    Password: Admin123"
echo ""
echo "  Doctora: Create later when credentials are ready."
echo ""
echo "  Useful commands:"
echo "    systemctl status medical-erp    # Check status"
echo "    journalctl -u medical-erp -f    # View logs"
echo "    systemctl restart medical-erp   # Restart"
echo "============================================"
