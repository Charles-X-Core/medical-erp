# Monitoring

---
Document ID: OPS-003
Status: Draft
Version: 1.0.0
Owner: DevOps
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [OPS-002]
---

## 1. Monitoring Strategy

### 1.1 Philosophy

| Principle | Description |
|---|---|
| Local-first | All monitoring runs on VPS |
| Email alerts | Gmail SMTP for notifications |
| Simple scripts | Bash-based, no external tools |
| Cron-based | Scheduled checks via crontab |

### 1.2 What We Monitor

| Category | What | Frequency | Alert |
|---|---|---|---|
| Application | Health endpoint | Every 5 min | Email |
| Disk | Usage percentage | Every hour | Email |
| Memory | Usage percentage | Every hour | Email |
| Database | Connection check | Every hour | Email |
| SSL | Certificate expiry | Daily | Email |
| Backups | Success check | Daily | Email |

---

## 2. Logging Strategy

### 2.1 Logback Configuration

```xml
<!-- config/logback-spring.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<configuration>

    <property name="LOG_DIR" value="/opt/medical-erp/logs"/>
    <property name="APP_NAME" value="medical-erp"/>

    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${LOG_DIR}/${APP_NAME}.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <fileNamePattern>${LOG_DIR}/${APP_NAME}.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
            <maxFileSize>50MB</maxFileSize>
            <maxHistory>30</maxHistory>
            <totalSizeCap>1GB</totalSizeCap>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <appender name="ERROR_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${LOG_DIR}/${APP_NAME}-error.log</file>
        <filter class="ch.qos.logback.classic.filter.ThresholdFilter">
            <level>ERROR</level>
        </filter>
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <fileNamePattern>${LOG_DIR}/${APP_NAME}-error.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
            <maxFileSize>50MB</maxFileSize>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <logger name="com.clinica" level="INFO"/>
    <logger name="org.springframework" level="WARN"/>
    <logger name="org.springframework.security" level="WARN"/>
    <logger name="org.hibernate" level="WARN"/>

    <root level="WARN">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="FILE"/>
        <appender-ref ref="ERROR_FILE"/>
    </root>

</configuration>
```

### 2.2 Log Files

| Log | Location | Retention | Purpose |
|---|---|---|---|
| Application | `/opt/medical-erp/logs/medical-erp.log` | 30 days | General logs |
| Error | `/opt/medical-erp/logs/medical-erp-error.log` | 30 days | Errors only |
| Health Check | `/opt/medical-erp/logs/health-check.log` | 30 days | Monitoring results |
| Nginx Access | `/var/log/nginx/medical-erp-access.log` | 30 days | HTTP requests |
| Nginx Error | `/var/log/nginx/medical-erp-error.log` | 30 days | Nginx errors |
| MySQL Slow | `/var/log/mysql/slow.log` | 7 days | Slow queries |

---

## 3. Health Checks

### 3.1 Spring Boot Actuator

```properties
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=when-authorized
management.endpoint.health.show-components=when-authorized
```

### 3.2 Health Check Response

```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "MySQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": {
      "status": "UP"
    }
  }
}
```

### 3.3 Health Check Script

```bash
#!/bin/bash
# scripts/monitoring/health-check.sh

HEALTH_URL="http://localhost:8080/actuator/health"
LOG_FILE="/opt/medical-erp/logs/health-check.log"
ALERT_EMAIL="admin@clinica.com"

check_health() {
    HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" --connect-timeout 10 "$HEALTH_URL" 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "$(date -Iseconds) HEALTHY" >> "$LOG_FILE"
        return 0
    else
        echo "$(date -Iseconds) UNHEALTHY (HTTP $HTTP_CODE)" >> "$LOG_FILE"
        return 1
    fi
}

send_alert() {
    SUBJECT="[ALERT] Medical ERP Application DOWN"
    BODY="Application health check failed at $(date).\n\nHTTP Code: $HTTP_CODE\n\nPlease check the server immediately."
    echo -e "$BODY" | mail -s "$SUBJECT" "$ALERT_EMAIL"
}

if ! check_health; then
    send_alert
    echo "$(date -Iseconds) Attempting restart..." >> "$LOG_FILE"
    sudo systemctl restart medical-erp
    sleep 15
    if check_health; then
        echo "$(date -Iseconds) Restart successful" >> "$LOG_FILE"
    else
        echo "$(date -Iseconds) Restart FAILED" >> "$LOG_FILE"
    fi
fi
```

---

## 4. Disk Monitoring

### 4.1 Disk Check Script

```bash
#!/bin/bash
# scripts/monitoring/disk-check.sh

THRESHOLD=80
ALERT_EMAIL="admin@clinica.com"
LOG_FILE="/opt/medical-erp/logs/disk-check.log"

USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
echo "$(date -Iseconds) Disk usage: ${USAGE}%" >> "$LOG_FILE"

if [ "$USAGE" -gt "$THRESHOLD" ]; then
    SUBJECT="[ALERT] Disk usage critical: ${USAGE}%"
    BODY="Disk usage has reached ${USAGE}% (threshold: ${THRESHOLD}%).\n\nCurrent usage:\n$(df -h /)\n\nPlease clean up disk space."
    echo -e "$BODY" | mail -s "$SUBJECT" "$ALERT_EMAIL"
fi
```

### 4.2 Disk Cleanup Script

```bash
#!/bin/bash
# scripts/monitoring/disk-cleanup.sh

LOG_DIR="/opt/medical-erp/logs"
BACKUP_DIR="/var/backups/medical-erp"
LOG_FILE="/opt/medical-erp/logs/cleanup.log"

echo "$(date -Iseconds) Starting cleanup..." >> "$LOG_FILE"
find "$LOG_DIR" -name "*.log.gz" -mtime +30 -delete
find "$BACKUP_DIR/mysql/" -name "*.sql.gz" -mtime +30 -delete 2>/dev/null
ls -t "$BACKUP_DIR/jars/" 2>/dev/null | tail -n +6 | xargs -r rm --
echo "$(date -Iseconds) Cleanup complete" >> "$LOG_FILE"
```

---

## 5. Memory Monitoring

### 5.1 Memory Check Script

```bash
#!/bin/bash
# scripts/monitoring/memory-check.sh

THRESHOLD=85
ALERT_EMAIL="admin@clinica.com"
LOG_FILE="/opt/medical-erp/logs/memory-check.log"

TOTAL=$(free -m | awk '/Mem:/ {print $2}')
USED=$(free -m | awk '/Mem:/ {print $3}')
USAGE=$((USED * 100 / TOTAL))

echo "$(date -Iseconds) Memory usage: ${USAGE}% (${USED}MB/${TOTAL}MB)" >> "$LOG_FILE"

if [ "$USAGE" -gt "$THRESHOLD" ]; then
    SUBJECT="[ALERT] Memory usage critical: ${USAGE}%"
    BODY="Memory usage has reached ${USAGE}% (threshold: ${THRESHOLD}%).\n\nCurrent usage:\n$(free -h)\n\nTop consumers:\n$(ps aux --sort=-%mem | head -10)"
    echo -e "$BODY" | mail -s "$SUBJECT" "$ALERT_EMAIL"
fi
```

---

## 6. Database Monitoring

### 6.1 Database Check Script

```bash
#!/bin/bash
# scripts/monitoring/database-check.sh

ALERT_EMAIL="admin@clinica.com"
LOG_FILE="/opt/medical-erp/logs/database-check.log"
DB_USER="medical_erp"
DB_PASS="CHANGE_THIS_PASSWORD"

if mysql -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1" > /dev/null 2>&1; then
    echo "$(date -Iseconds) Database: CONNECTED" >> "$LOG_FILE"
else
    echo "$(date -Iseconds) Database: DISCONNECTED" >> "$LOG_FILE"
    SUBJECT="[ALERT] Database connection failed"
    echo -e "Cannot connect to MySQL database at $(date)." | mail -s "$SUBJECT" "$ALERT_EMAIL"
    exit 1
fi

CONNECTIONS=$(mysql -u"$DB_USER" -p"$DB_PASS" -e "SHOW STATUS LIKE 'Threads_connected'" | awk 'NR==2 {print $2}')
echo "$(date -Iseconds) Database connections: ${CONNECTIONS}" >> "$LOG_FILE"

DB_SIZE=$(mysql -u"$DB_USER" -p"$DB_PASS" -e "SELECT ROUND(SUM(data_length+index_length)/1024/1024,2) FROM information_schema.tables WHERE table_schema='medical_erp'" | awk 'NR==2 {print $1}')
echo "$(date -Iseconds) Database size: ${DB_SIZE} MB" >> "$LOG_FILE"
```

---

## 7. SSL Certificate Monitoring

### 7.1 SSL Check Script

```bash
#!/bin/bash
# scripts/monitoring/ssl-check.sh

DOMAIN="clinica.example.com"
DAYS_WARNING=14
ALERT_EMAIL="admin@clinica.com"
LOG_FILE="/opt/medical-erp/logs/ssl-check.log"

EXPIRY_DATE=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN":443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_LEFT=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))

echo "$(date -Iseconds) SSL certificate expires in ${DAYS_LEFT} days" >> "$LOG_FILE"

if [ "$DAYS_LEFT" -lt "$DAYS_WARNING" ]; then
    SUBJECT="[ALERT] SSL certificate expiring in ${DAYS_LEFT} days"
    BODY="SSL certificate for ${DOMAIN} expires on ${EXPIRY_DATE}.\n\nRenew: sudo certbot renew"
    echo -e "$BODY" | mail -s "$SUBJECT" "$ALERT_EMAIL"
fi
```

---

## 8. Backup Monitoring

### 8.1 Backup Check Script

```bash
#!/bin/bash
# scripts/monitoring/backup-check.sh

BACKUP_DIR="/var/backups/medical-erp/mysql"
ALERT_EMAIL="admin@clinica.com"
LOG_FILE="/opt/medical-erp/logs/backup-check.log"
TODAY=$(date +%Y%m%d)

BACKUP_FILE=$(find "$BACKUP_DIR" -name "medical_erp_${TODAY}*.sql.gz" -type f 2>/dev/null | head -1)

if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "$(date -Iseconds) Backup OK: ${BACKUP_FILE} (${SIZE})" >> "$LOG_FILE"
else
    echo "$(date -Iseconds) Backup MISSING for today" >> "$LOG_FILE"
    SUBJECT="[ALERT] Daily backup missing"
    BODY="No backup found for ${TODAY}.\n\nPlease check backup scripts."
    echo -e "$BODY" | mail -s "$SUBJECT" "$ALERT_EMAIL"
fi
```

---

## 9. Cron Configuration

### 9.1 Install All Cron Jobs

```bash
# scripts/monitoring/install-cron.sh

# Create monitoring cron entries
cat << 'EOF' > /tmp/medical-erp-cron
# Medical ERP Monitoring
# Health check every 5 minutes
*/5 * * * * /opt/medical-erp/scripts/monitoring/health-check.sh

# Disk check every hour
0 * * * * /opt/medical-erp/scripts/monitoring/disk-check.sh

# Memory check every hour
0 * * * * /opt/medical-erp/scripts/monitoring/memory-check.sh

# Database check every hour
0 * * * * /opt/medical-erp/scripts/monitoring/database-check.sh

# SSL check daily at 9 AM
0 9 * * * /opt/medical-erp/scripts/monitoring/ssl-check.sh

# Backup check daily at 5 AM
0 5 * * * /opt/medical-erp/scripts/monitoring/backup-check.sh

# Disk cleanup daily at 4 AM
0 4 * * * /opt/medical-erp/scripts/monitoring/disk-cleanup.sh
EOF

crontab /tmp/medical-erp-cron
rm /tmp/medical-erp-cron

echo "Cron jobs installed. Verify with: crontab -l"
```

### 9.2 Cron Schedule Summary

| Script | Schedule | Purpose |
|---|---|---|
| health-check.sh | Every 5 min | Application health |
| disk-check.sh | Every hour | Disk usage alert |
| memory-check.sh | Every hour | Memory usage alert |
| database-check.sh | Every hour | DB connectivity |
| ssl-check.sh | Daily 9 AM | Certificate expiry |
| backup-check.sh | Daily 5 AM | Backup verification |
| disk-cleanup.sh | Daily 4 AM | Old file cleanup |

---

## 10. Monitoring Scripts Installation

### 10.1 Setup Commands

```bash
# Create monitoring directory
sudo mkdir -p /opt/medical-erp/scripts/monitoring

# Create all scripts (copy from sections above)
sudo nano /opt/medical-erp/scripts/monitoring/health-check.sh
sudo nano /opt/medical-erp/scripts/monitoring/disk-check.sh
sudo nano /opt/medical-erp/scripts/monitoring/memory-check.sh
sudo nano /opt/medical-erp/scripts/monitoring/database-check.sh
sudo nano /opt/medical-erp/scripts/monitoring/ssl-check.sh
sudo nano /opt/medical-erp/scripts/monitoring/backup-check.sh
sudo nano /opt/medical-erp/scripts/monitoring/disk-cleanup.sh
sudo nano /opt/medical-erp/scripts/monitoring/install-cron.sh

# Make executable
sudo chmod +x /opt/medical-erp/scripts/monitoring/*.sh

# Install cron jobs
/opt/medical-erp/scripts/monitoring/install-cron.sh
```

### 10.2 Verify Installation

```bash
# Check cron jobs
crontab -l

# Test health check
/opt/medical-erp/scripts/monitoring/health-check.sh

# Check log
cat /opt/medical-erp/logs/health-check.log
```

---

## 11. Log Rotation

### 11.1 System Logrotate

```bash
sudo nano /etc/logrotate.d/medical-erp
```

```
/opt/medical-erp/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    dateext
    dateformat -%Y%m%d
}
```

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
