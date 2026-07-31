# Production Deployment

---
Document ID: OPS-002
Status: Draft
Version: 1.0.0
Owner: DevOps
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [ARCH-001, ARCH-004, SEC-006]
---

## 1. Infrastructure

### 1.1 VPS Specifications

| Resource | Value |
|---|---|
| CPU | 6 vCPU Cores |
| RAM | 12 GB |
| Storage | 200 GB SSD |
| Network | 300 Mbit/s Port |
| Snapshots | 2 (backup) |
| OS | Ubuntu 22.04 LTS (recommended) |

### 1.2 Required Software

| Software | Version | Purpose |
|---|---|---|
| Java | 21 LTS (Temurin) | Runtime |
| MySQL | 8.x | Database |
| Nginx | latest | Reverse proxy |
| Certbot | latest | SSL certificates |
| rclone | latest | Off-site backups |
| Git | latest | Version control |

### 1.3 Server Layout

```
/opt/medical-erp/                    # Application home
├── app.jar                          # Application JAR
├── config/                          # External configuration
│   ├── application.properties       # Production config
│   └── logback-spring.xml           # Logging config
├── scripts/                         # Deployment scripts
├── logs/                            # Application logs
└── uploads/                         # Uploaded files (PDFs, signatures)

/var/lib/mysql/                      # MySQL data
/etc/nginx/sites-available/          # Nginx config
/etc/letsencrypt/                    # SSL certificates
/var/backups/medical-erp/            # Local backups
```

---

## 2. Installation Steps

### 2.1 System Update

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip
```

### 2.2 Java 21 Installation

```bash
# Install Temurin JDK 21
wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo apt-key add -
sudo add-apt-repository --yes https://packages.adoptium.net/artifactory/deb/
sudo apt update
sudo apt install -y temurin-21-jdk

# Verify installation
java --version
# Expected: openjdk 21.0.x

# Set JAVA_HOME
echo 'export JAVA_HOME=/usr/lib/jvm/temurin-21-jdk-amd64' | sudo tee -a /etc/profile.d/java.sh
source /etc/profile.d/java.sh
```

### 2.3 MySQL 8.x Installation

```bash
# Install MySQL
sudo apt install -y mysql-server mysql-client

# Secure installation
sudo mysql_secure_installation

# Start and enable
sudo systemctl start mysql
sudo systemctl enable mysql

# Create database and user
sudo mysql -u root -p
```

```sql
-- Create database
CREATE DATABASE medical_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (change password!)
CREATE USER 'medical_erp'@'localhost' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';

-- Grant permissions
GRANT ALL PRIVILEGES ON medical_erp.* TO 'medical_erp'@'localhost';
FLUSH PRIVILEGES;
```

### 2.4 MySQL Configuration

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
[mysqld]
# Basic
bind-address = 127.0.0.1
port = 3306
max_connections = 50

# InnoDB
innodb_buffer_pool_size = 4G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 1
innodb_flush_method = O_DIRECT

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# Binary logging (for point-in-time recovery)
log-bin = mysql-bin
binlog_expire_logs_seconds = 604800  # 7 days
max_binlog_size = 100M
```

```bash
sudo systemctl restart mysql
```

### 2.5 Nginx Installation

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 3. Application Deployment

### 3.1 Build Application

```bash
# On development machine
cd medical-erp
mvn clean package -DskipTests

# Verify JAR exists
ls -la target/medical-erp-*.jar
```

### 3.2 Upload to VPS

```bash
# From development machine
scp target/medical-erp-*.jar user@vps-ip:/tmp/medical-erp.jar
```

### 3.3 Deploy Application

```bash
# SSH into VPS
ssh user@vps-ip

# Create directories
sudo mkdir -p /opt/medical-erp/{config,scripts,logs,uploads}
sudo chown -R $USER:$USER /opt/medical-erp

# Move JAR
mv /tmp/medical-erp.jar /opt/medical-erp/app.jar

# Create production configuration
nano /opt/medical-erp/config/application.properties
```

### 3.4 Production Configuration

```properties
# /opt/medical-erp/config/application.properties

# Server
server.port=8080
server.address=127.0.0.1

# Spring
spring.profiles.active=production
spring.application.name=medical-erp

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/medical_erp?useSSL=true&requireSSL=true
spring.datasource.username=medical_erp
spring.datasource.password=CHANGE_THIS_PASSWORD
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.max-lifetime=1200000

# JPA
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false

# JWT
jwt.secret=CHANGE_THIS_TO_RANDOM_64_CHARS
jwt.expiration=86400000

# Email
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=clinic-email@gmail.com
spring.mail.password=APP_PASSWORD_HERE
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# PDF
pdf.storage.path=/opt/medical-erp/uploads/pdfs
pdf.signature.path=/opt/medical-erp/uploads/signatures

# Backup
backup.local.path=/var/backups/medical-erp
backup.offsite.remote=drive
backup.offsite.path=medical-erp

# Logging
logging.level.root=WARN
logging.level.com.clinica=INFO
logging.level.org.springframework.web=WARN
logging.file.name=/opt/medical-erp/logs/medical-erp.log
logging.logback.rollingpolicy.max-file-size=50MB
logging.logback.rollingpolicy.max-history=30

# Actuator
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=when-authorized
```

---

## 4. Systemd Service

### 4.1 Create Service File

```bash
sudo nano /etc/systemd/system/medical-erp.service
```

```ini
[Unit]
Description=Medical ERP Application
After=network.target mysql.service
Requires=mysql.service

[Service]
Type=simple
User=medical-erp
Group=medical-erp
WorkingDirectory=/opt/medical-erp
ExecStart=/usr/lib/jvm/temurin-21-jdk-amd64/bin/java \
  -Xms512m \
  -Xmx4g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -Dspring.config.location=file:/opt/medical-erp/config/ \
  -jar /opt/medical-erp/app.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=medical-erp

# Security
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/medical-erp/logs /opt/medical-erp/uploads /var/backups/medical-erp

# Environment
Environment=SPRING_PROFILES_ACTIVE=production
Environment=JAVA_HOME=/usr/lib/jvm/temurin-21-jdk-amd64

[Install]
WantedBy=multi-user.target
```

### 4.2 Enable and Start

```bash
# Create service user
sudo useradd -r -s /bin/false medical-erp
sudo chown -R medical-erp:medical-erp /opt/medical-erp

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable medical-erp

# Start service
sudo systemctl start medical-erp

# Check status
sudo systemctl status medical-erp
```

### 4.3 Service Commands

| Command | Description |
|---|---|
| `sudo systemctl start medical-erp` | Start application |
| `sudo systemctl stop medical-erp` | Stop application |
| `sudo systemctl restart medical-erp` | Restart application |
| `sudo systemctl status medical-erp` | Check status |
| `sudo journalctl -u medical-erp -f` | View live logs |
| `sudo journalctl -u medical-erp --since "1 hour ago"` | Recent logs |

---

## 5. SSL/TLS Setup

### 5.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 Obtain Certificate

```bash
# First, configure DNS (see section 6)
# Then obtain certificate
sudo certbot --nginx -d clinica.example.com -d www.clinica.example.com

# Or standalone (without Nginx)
sudo certbot certonly --standalone -d clinica.example.com
```

### 5.3 Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically creates a cron job
# Verify: sudo systemctl list-timers | grep certbot
```

### 5.4 SSL Configuration

Nginx will be auto-configured by Certbot. Manual config:

```nginx
server {
    listen 443 ssl http2;
    server_name clinica.example.com;

    ssl_certificate /etc/letsencrypt/live/clinica.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/clinica.example.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name clinica.example.com www.clinica.example.com;
    return 301 https://$host$request_uri;
}
```

---

## 6. Nginx Configuration

### 6.1 Server Block

```bash
sudo nano /etc/nginx/sites-available/medical-erp
```

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name clinica.example.com www.clinica.example.com;
    return 301 https://$host$request_uri;
}

# Main server
server {
    listen 443 ssl http2;
    server_name clinica.example.com www.clinica.example.com;

    # SSL (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/clinica.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/clinica.example.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'" always;

    # Logging
    access_log /var/log/nginx/medical-erp-access.log;
    error_log /var/log/nginx/medical-erp-error.log;

    # Max upload size
    client_max_body_size 10M;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Landing page (existing React app)
    location / {
        root /var/www/landing-page;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # ERP Frontend (future)
    location /erp/ {
        alias /var/www/erp-frontend/;
        try_files $uri $uri/ /erp/index.html;
    }

    # Actuator (internal only)
    location /actuator {
        allow 127.0.0.1;
        deny all;
        proxy_pass http://127.0.0.1:8080;
    }
}
```

### 6.2 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/medical-erp /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. Deployment Scripts

### 7.1 deploy.sh — Deploy New Version

```bash
#!/bin/bash
# scripts/deploy.sh — Deploy new application version
# Usage: ./scripts/deploy.sh /path/to/medical-erp.jar

set -e

APP_DIR="/opt/medical-erp"
BACKUP_DIR="/var/backups/medical-erp"
JAR_SOURCE="${1:?Usage: $0 /path/to/medical-erp.jar}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== Medical ERP Deployment ==="
echo "Timestamp: $TIMESTAMP"

# 1. Verify source JAR exists
if [ ! -f "$JAR_SOURCE" ]; then
    echo "ERROR: JAR file not found: $JAR_SOURCE"
    exit 1
fi

# 2. Backup current JAR
echo "Backing up current JAR..."
mkdir -p "$BACKUP_DIR/jars"
cp "$APP_DIR/app.jar" "$BACKUP_DIR/jars/app_${TIMESTAMP}.jar"

# 3. Keep only last 5 JAR backups
echo "Cleaning old backups..."
ls -t "$BACKUP_DIR/jars/" | tail -n +6 | xargs -r rm --

# 4. Stop application
echo "Stopping application..."
sudo systemctl stop medical-erp

# 5. Deploy new JAR
echo "Deploying new JAR..."
cp "$JAR_SOURCE" "$APP_DIR/app.jar"
chown medical-erp:medical-erp "$APP_DIR/app.jar"

# 6. Start application
echo "Starting application..."
sudo systemctl start medical-erp

# 7. Wait for health check
echo "Waiting for application to start..."
sleep 15

# 8. Health check
echo "Running health check..."
if curl -sf http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "✅ Deployment successful! Application is healthy."
else
    echo "⚠️  Application started but health check failed. Check logs."
    echo "Logs: sudo journalctl -u medical-erp --since '2 minutes ago'"
fi

echo "=== Deployment Complete ==="
```

### 7.2 rollback.sh — Rollback to Previous Version

```bash
#!/bin/bash
# scripts/rollback.sh — Rollback to previous JAR version
# Usage: ./scripts/rollback.sh [timestamp]
# If no timestamp, rolls back to most recent backup

set -e

APP_DIR="/opt/medical-erp"
BACKUP_DIR="/var/backups/medical-erp/jars"

TIMESTAMP="${1:-$(ls -t "$BACKUP_DIR" | head -1 | sed 's/app_//;s/\.jar//')}"
BACKUP_JAR="$BACKUP_DIR/app_${TIMESTAMP}.jar"

echo "=== Medical ERP Rollback ==="
echo "Rolling back to: $TIMESTAMP"

# 1. Verify backup JAR exists
if [ ! -f "$BACKUP_JAR" ]; then
    echo "ERROR: Backup JAR not found: $BACKUP_JAR"
    echo "Available backups:"
    ls -la "$BACKUP_DIR/"
    exit 1
fi

# 2. Stop application
echo "Stopping application..."
sudo systemctl stop medical-erp

# 3. Restore JAR
echo "Restoring JAR..."
cp "$BACKUP_JAR" "$APP_DIR/app.jar"
chown medical-erp:medical-erp "$APP_DIR/app.jar"

# 4. Start application
echo "Starting application..."
sudo systemctl start medical-erp

# 5. Health check
sleep 15
if curl -sf http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "✅ Rollback successful!"
else
    echo "⚠️  Rollback completed but health check failed. Check logs."
fi

echo "=== Rollback Complete ==="
```

### 7.3 backup-db.sh — Database Backup

```bash
#!/bin/bash
# scripts/backup-db.sh — Backup MySQL database
# Usage: ./scripts/backup-db.sh

set -e

BACKUP_DIR="/var/backups/medical-erp/mysql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/medical_erp_${TIMESTAMP}.sql.gz"

echo "=== Database Backup ==="
echo "Timestamp: $TIMESTAMP"

# 1. Create backup directory
mkdir -p "$BACKUP_DIR"

# 2. Backup database
echo "Backing up database..."
mysqldump \
  --user=medical_erp \
  --password=CHANGE_THIS_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  medical_erp | gzip > "$BACKUP_FILE"

# 3. Verify backup
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup successful: $BACKUP_FILE ($SIZE)"
else
    echo "ERROR: Backup failed or empty"
    exit 1
fi

# 4. Clean old backups (keep 30 days)
echo "Cleaning old backups..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

# 5. Sync to off-site (rclone)
echo "Syncing to off-site..."
rclone copy "$BACKUP_FILE" "drive:medical-erp/mysql/" --progress

echo "=== Backup Complete ==="
```

### 7.4 health-check.sh — Health Check

```bash
#!/bin/bash
# scripts/health-check.sh — Check application health
# Usage: ./scripts/health-check.sh

HEALTH_URL="http://localhost:8080/actuator/health"
LOG_FILE="/opt/medical-erp/logs/health-check.log"

check_health() {
    RESPONSE=$(curl -sf -w "\n%{http_code}" "$HEALTH_URL" 2>/dev/null)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo "$(date -Iseconds) HEALTHY" >> "$LOG_FILE"
        return 0
    else
        echo "$(date -Iseconds) UNHEALTHY (HTTP $HTTP_CODE)" >> "$LOG_FILE"
        return 1
    fi
}

check_health
if [ $? -ne 0 ]; then
    echo "Application is DOWN! Attempting restart..."
    sudo systemctl restart medical-erp
    sleep 10
    check_health
    if [ $? -ne 0 ]; then
        echo "Restart failed. Manual intervention required."
        exit 1
    fi
fi
```

### 7.5 Make Scripts Executable

```bash
chmod +x /opt/medical-erp/scripts/*.sh
```

---

## 8. Database Migrations

### 8.1 Flyway Setup

```bash
# Run migrations on deploy
flyway -url=jdbc:mysql://localhost:3306/medical_erp \
  -user=medical_erp \
  -password=CHANGE_THIS_PASSWORD \
  -locations=filesystem:/opt/medical-erp/migrations \
  migrate
```

### 8.2 Migration Scripts Location

```
/opt/medical-erp/migrations/
├── V1_0__create_tables.sql
├── V1_1__seed_admin.sql
└── ...
```

---

## 9. Rollback Procedure

### 9.1 Application Rollback

```bash
# Quick rollback to previous version
./scripts/rollback.sh

# Rollback to specific version
./scripts/rollback.sh 20260728_143000
```

### 9.2 Database Rollback

```bash
# Restore from backup
gunzip < /var/backups/medical-erp/mysql/medical_erp_YYYYMMDD_HHMMSS.sql.gz | \
  mysql -u medical_erp -p medical_erp
```

### 9.3 File Rollback

```bash
# Restore uploads from backup
rclone copy "drive:medical-erp/uploads/" /opt/medical-erp/uploads/ --progress
```

---

## 10. First-Time Deployment Checklist

| Step | Command | Verification |
|---|---|---|
| 1. Update system | `sudo apt update && sudo apt upgrade -y` | No errors |
| 2. Install Java 21 | `java --version` | Shows 21.x |
| 3. Install MySQL 8 | `mysql --version` | Shows 8.x |
| 4. Create database | `mysql -u root -p -e "SHOW DATABASES"` | medical_erp exists |
| 5. Install Nginx | `nginx -v` | Shows version |
| 6. Configure Nginx | `sudo nginx -t` | Syntax OK |
| 7. Deploy JAR | `ls /opt/medical-erp/app.jar` | File exists |
| 8. Configure app | `cat /opt/medical-erp/config/application.properties` | Config present |
| 9. Start service | `sudo systemctl status medical-erp` | active (running) |
| 10. Health check | `curl http://localhost:8080/actuator/health` | `{"status":"UP"}` |
| 11. SSL setup | `sudo certbot --nginx -d clinica.example.com` | Certificate issued |
| 12. Backup cron | `crontab -l` | Backups scheduled |

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
