# Backups

---
Document ID: SEC-006
Status: Draft
Version: 2.0.0
Owner: Security
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [SEC-001]
---

## 1. Backup Strategy

### 1.1 Backup Philosophy

| Principle | Description |
|---|---|
| Regularity | Daily backups minimum |
| Redundancy | Multiple backup locations |
| Testing | Regular restore tests |
| Security | Encrypted backups |

### 1.2 Backup Goals

| Goal | Target |
|---|---|
| Recovery Point Objective (RPO) | 24 hours |
| Recovery Time Objective (RTO) | 1 hour |
| Backup retention | Local: 30 days / Off-site: Daily (indefinido) |
| Test frequency | Monthly |

### 1.3 Backup Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKUP ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  2:00 AM (Backup Local)          3:00 AM (Backup Off-site)     │
│  ─────────────────────           ─────────────────────────     │
│  ┌─────────────────┐             ┌─────────────────┐           │
│  │ MySQL dump      │             │ rclone copy     │           │
│  │ PDFs + Firmas   │ ──1 hr──▶  │ Google Drive    │           │
│  │ Configuration   │             │                 │           │
│  └─────────────────┘             └─────────────────┘           │
│         │                                 │                     │
│         ▼                                 ▼                     │
│  /var/backups/                  drive://medical-erp/           │
│  (30 días local)                (diario, sin límite)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Backup Types

| Type | Frequency | Retention | Scope |
|---|---|---|---|
| Full | Daily | Local: 30 days | Database + Files |
| Off-site | Daily at 3:00 AM | Daily (indefinido) | Full backup del día |
| Incremental | Hourly | 7 days | Changed data |
| WAL | Continuous | 3 days | Transaction log |

### 2.1 Full Backup

| Property | Value |
|---|---|
| Frequency | Daily at 2:00 AM |
| Method | mysqldump + tar |
| Retention | 30 days |
| Storage | Local |

### 2.2 Off-site Backup

| Property | Value |
|---|---|
| Frequency | Daily at 3:00 AM (1 hora después del local) |
| Method | rclone → Google Drive |
| Retention | Daily (sin límite, crecimiento controlado) |
| Storage | Google Drive (15 GB gratis) |
| Contenido | Solo backup del día (no acumulado) |

---

## 3. What to Backup

### 3.1 Database

| Component | Method | Frequency |
|---|---|---|
| Schema | mysqldump | Daily |
| Data | mysqldump | Daily |
| Binary logs | mysqlbinlog | Hourly |

**Database Backup Script:**

```bash
#!/bin/bash
# Backup MySQL database

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/medical-erp/backups"
DB_NAME="medical_erp_db"
DB_USER="root"
DB_PASS="${DB_PASSWORD}"

# Full backup
mysqldump -u${DB_USER} -p${DB_PASS} ${DB_NAME} | gzip > ${BACKUP_DIR}/db_${DATE}.sql.gz

# Keep only last 30 days
find ${BACKUP_DIR} -name "db_*.sql.gz" -mtime +30 -delete
```

### 3.2 Files

| Component | Method | Frequency |
|---|---|---|
| PDFs | tar + gzip | Daily |
| Signatures | tar + gzip | Daily |
| Configuration | cp | Daily |

**File Backup Script:**

```bash
#!/bin/bash
# Backup files

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/medical-erp/backups"
SOURCE_DIR="/var/medical-erp"

# Backup PDFs and signatures
tar -czf ${BACKUP_DIR}/files_${DATE}.tar.gz \
    -C ${SOURCE_DIR} \
    pdfs/ \
    signatures/ \
    --exclude='*.tmp'

# Keep only last 30 days
find ${BACKUP_DIR} -name "files_*.tar.gz" -mtime +30 -delete
```

### 3.3 Configuration

| Component | Method | Frequency |
|---|---|---|
| application.properties | cp | Daily |
| Nginx config | cp | Daily |
| System config | cp | Daily |

**Config Backup Script:**

```bash
#!/bin/bash
# Backup configuration

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/medical-erp/backups"

# Backup configs
tar -czf ${BACKUP_DIR}/config_${DATE}.tar.gz \
    /etc/nginx/sites-available/ \
    /opt/medical-erp/application.properties

# Keep only last 30 days
find ${BACKUP_DIR} -name "config_*.tar.gz" -mtime +30 -delete
```

---

## 4. Recovery Procedures

### 4.1 Database Recovery

**From Full Backup:**

```bash
#!/bin/bash
# Restore database from backup

BACKUP_FILE=$1
DB_NAME="medical_erp_db"
DB_USER="root"
DB_PASS="${DB_PASSWORD}"

# Drop and recreate database
mysql -u${DB_USER} -p${DB_PASS} -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME};"

# Restore from backup
gunzip < ${BACKUP_FILE} | mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME}
```

**From Binary Logs:**

```bash
#!/bin/bash
# Restore from binary logs

mysqlbinlog --start-datetime="2026-07-28 10:00:00" \
            --stop-datetime="2026-07-28 12:00:00" \
            /var/lib/mysql/mysql-bin.* | mysql -u root -p
```

### 4.2 File Recovery

```bash
#!/bin/bash
# Restore files from backup

BACKUP_FILE=$1
RESTORE_DIR="/var/medical-erp"

# Extract backup
tar -xzf ${BACKUP_FILE} -C ${RESTORE_DIR}
```

### 4.3 Configuration Recovery

```bash
#!/bin/bash
# Restore configuration from backup

BACKUP_FILE=$1

# Extract backup
tar -xzf ${BACKUP_FILE} -C /

# Restart services
systemctl restart nginx
systemctl restart medical-erp
```

---

## 5. Backup Testing

### 5.1 Test Frequency

| Test Type | Frequency |
|---|---|
| Restore test | Monthly |
| Integrity check | Weekly |
| Full recovery drill | Quarterly |

### 5.2 Test Procedure

**Monthly Restore Test:**

```bash
#!/bin/bash
# Monthly backup test

# 1. Create test database
mysql -u root -p -e "CREATE DATABASE medical_erp_test;"

# 2. Restore backup
gunzip < /var/medical-erp/backups/db_latest.sql.gz | mysql -u root -p medical_erp_test

# 3. Verify data
mysql -u root -p -e "SELECT COUNT(*) FROM medical_erp_test.pacientes;"

# 4. Clean up
mysql -u root -p -e "DROP DATABASE medical_erp_test;"
```

### 5.3 Test Checklist

- [ ] Backup file exists
- [ ] Backup file is not corrupted
- [ ] Database restores successfully
- [ ] Data integrity verified
- [ ] Files restore successfully
- [ ] Configuration restores successfully
- [ ] Services start correctly

---

## 6. Backup Storage

### 6.1 Storage Locations

| Location | Type | Retention |
|---|---|---|
| Local | Primary | 30 days |
| Google Drive | Off-site | Daily (indefinido) |

### 6.2 Storage Structure

**Local:**

```
/var/medical-erp/backups/
├── db_20260728_020000.sql.gz
├── files_20260728_020000.tar.gz
├── config_20260728_020000.tar.gz
├── db_20260727_020000.sql.gz
├── files_20260727_020000.tar.gz
├── config_20260727_020000.tar.gz
└── ... (30 días)
```

**Google Drive (Off-site):**

```
medical-erp-backups/
├── 20260728/
│   ├── db_20260728_020000.sql.gz
│   ├── files_20260728_020000.tar.gz
│   └── config_20260728_020000.tar.gz
├── 20260727/
│   ├── db_20260727_020000.sql.gz
│   ├── files_20260727_020000.tar.gz
│   └── config_20260727_020000.tar.gz
└── ... (diario, sin límite)
```

### 6.3 Backup Naming Convention

| Pattern | Example |
|---|---|
| db_{date}_{time}.sql.gz | db_20260728_020000.sql.gz |
| files_{date}_{time}.tar.gz | files_20260728_020000.tar.gz |
| config_{date}_{time}.tar.gz | config_20260728_020000.tar.gz |

---

## 7. Automated Backup Schedule

### 7.1 Cron Jobs

```bash
# /etc/crontab

# Backup local principal (2:00 AM)
0 2 * * * root /opt/medical-erp/scripts/backup-local.sh

# Backup off-site Google Drive (3:00 AM)
0 3 * * * root /opt/medical-erp/scripts/backup-offsite.sh

# Verificación semanal de integridad (domingos a las 4:00 AM)
0 4 * * 0 root /opt/medical-erp/scripts/verify-backups.sh

# Prueba mensual de restauración (1er día del mes a las 5:00 AM)
0 5 1 * * root /opt/medical-erp/scripts/test-restore.sh
```

### 7.2 Backup Monitoring

| Check | Action |
|---|---|
| Backup fails | Send email alert |
| Backup size unusual | Send warning |
| Restore test fails | Send critical alert |
| Google Drive space low | Send warning |

---

## 8. Off-site Backup (Google Drive)

### 8.1 Off-site Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    OFF-SITE BACKUP FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LOCAL (2:00 AM)              OFF-SITE (3:00 AM)               │
│  ─────────────────            ────────────────────             │
│  ┌─────────────────┐          ┌─────────────────────┐         │
│  │ backup-local.sh │          │ backup-offsite.sh   │         │
│  │                 │          │                     │         │
│  │ • mysqldump     │  ──1h──▶ │ • Verify local      │         │
│  │ • tar files     │          │ • rclone to GDrive  │         │
│  │ • tar config    │          │ • Verify integrity  │         │
│  └─────────────────┘          │ • Send notification │         │
│         │                     └─────────────────────┘         │
│         ▼                              │                       │
│  /var/backups/                         ▼                       │
│  (30 días)                     drive://medical-erp/            │
│                                (diario, sin límite)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 rclone Configuration

**Instalación:**

```bash
# Instalar rclone
curl https://rclone.org/install.sh | sudo bash

# Verificar instalación
rclone version
```

**Configuración con Google Drive:**

```bash
# Iniciar configuración
rclone config

# Pasos:
# 1. n (nuevo remote)
# 2. gdrive (nombre del remote)
# 3. Google Drive (tipo de servicio)
# 4. Client ID (dejar vacío)
# 5. Client Secret (dejar vacío)
# 6. 1 (Full access)
# 7. root_folder_id (dejar vacío)
# 8. service_account_file (dejar vacío)
# 9. n (no auto config)
# 10. Copiar URL → Abrir en navegador → Autorizar
# 11. y (usar auto config)
# 12. n (no shared drives)
# 13. y (terminar)
```

**Estructura de Carpetas en Google Drive:**

```
medical-erp-backups/
├── 20260728/
│   ├── db_20260728_020000.sql.gz
│   ├── files_20260728_020000.tar.gz
│   └── config_20260728_020000.tar.gz
├── 20260727/
│   └── ...
└── ... (cada día es una carpeta)
```

### 8.3 Professional Backup Script

**Script Principal: backup-offsite.sh**

```bash
#!/bin/bash
###############################################################################
# backup-offsite.sh - Backup off-site a Google Drive
# Ejecuta: 3:00 AM diario (1 hora después del backup local)
# Autor: Medical ERP Backup System
# Versión: 1.0.0
###############################################################################

set -euo pipefail

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

# Directorios
BACKUP_DIR="/var/medical-erp/backups"
LOG_DIR="/var/log/medical-erp"
REMOTE="gdrive:medical-erp-backups"

# Fecha
DATE=$(date +%Y%m%d)
TIME=$(date +%H:%M:%S)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Logs
LOG_FILE="${LOG_DIR}/backup-offsite-${DATE}.log"
LOG_RETENTION_DAYS=90

# Email
EMAIL_TO="admin@clinica.com"
EMAIL_FROM="backup@clinica.com"
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="backup@clinica.com"
SMTP_PASS="${SMTP_PASSWORD}"  # Variable de entorno

# Umbrales
MIN_BACKUP_SIZE=1024  # 1KB mínimo para considerar válido
MAX_REMOTE_SIZE=10GB  # Alertar si supera este tamaño

# ============================================================================
# FUNCIONES DE LOGGING
# ============================================================================

# Colores para terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging con timestamp
log() {
    local level="$1"
    local message="$2"
    local color="$3"
    
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] [${level}] ${message}${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    log "INFO" "$1" "$BLUE"
}

log_success() {
    log "SUCCESS" "$1" "$GREEN"
}

log_warning() {
    log "WARNING" "$1" "$YELLOW"
}

log_error() {
    log "ERROR" "$1" "$RED"
}

# ============================================================================
# FUNCIONES DE NOTIFICACIÓN POR EMAIL
# ============================================================================

# Enviar email de notificación
send_email() {
    local subject="$1"
    local body="$2"
    local priority="${3:-normal}"  # high, normal, low
    
    # Verificar si mail está instalado
    if ! command -v mail &> /dev/null; then
        log_warning "Comando 'mail' no encontrado. Instalando mailutils..."
        apt-get install -y mailutils 2>/dev/null || {
            log_error "No se pudo instalar mailutils"
            return 1
        }
    fi
    
    # Enviar email
    echo "$body" | mail -S "X-Priority: $priority" \
        -S smtp="smtp://${SMTP_SERVER}:${SMTP_PORT}" \
        -S smtp-auth=login \
        -S smtp-auth-user="$SMTP_USER" \
        -S smtp-auth-password="$SMTP_PASS" \
        -S ssl \
        -s "$subject" \
        "$EMAIL_TO" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log_info "Email enviado a ${EMAIL_TO}"
    else
        log_warning "Error enviando email a ${EMAIL_TO}"
    fi
}

# ============================================================================
# FUNCIONES DE VERIFICACIÓN
# ============================================================================

# Verificar que existan backups locales del día
verify_local_backup() {
    log_info "Verificando backups locales del día ${DATE}..."
    
    local db_backup_count=$(ls ${BACKUP_DIR}/db_${DATE}_*.sql.gz 2>/dev/null | wc -l)
    local files_backup_count=$(ls ${BACKUP_DIR}/files_${DATE}_*.tar.gz 2>/dev/null | wc -l)
    local config_backup_count=$(ls ${BACKUP_DIR}/config_${DATE}_*.tar.gz 2>/dev/null | wc -l)
    
    local total_backups=$((db_backup_count + files_backup_count + config_backup_count))
    
    if [ "$total_backups" -eq 0 ]; then
        log_error "No se encontraron backups locales del día ${DATE}"
        send_email "BACKUP OFF-SITE FALLÓ - $(hostname)" \
            "No se encontraron backups locales del día ${DATE}.
            
Fecha: ${DATE}
Hora: ${TIME}
Servidor: $(hostname)
Directorio: ${BACKUP_DIR}

Por favor, verifique el backup local." \
            "high"
        exit 1
    fi
    
    log_info "Backups locales encontrados: BD(${db_backup_count}) Archivos(${files_backup_count}) Config(${config_backup_count})"
    
    # Verificar tamaño mínimo
    for backup in ${BACKUP_DIR}/*_${DATE}_*; do
        if [ -f "$backup" ]; then
            local size=$(stat -f%z "$backup" 2>/dev/null || stat -c%s "$backup" 2>/dev/null)
            if [ "$size" -lt "$MIN_BACKUP_SIZE" ]; then
                log_warning "Backup $(basename $backup) es muy pequeño (${size} bytes)"
            fi
        fi
    done
    
    log_success "Verificación de backups locales completada"
}

# Verificar conexión con Google Drive
verify_gdrive_connection() {
    log_info "Verificando conexión con Google Drive..."
    
    if ! rclone lsd ${REMOTE}/ &>/dev/null; then
        log_error "No se pudo conectar a Google Drive"
        send_email "BACKUP OFF-SITE FALLÓ - $(hostname)" \
            "No se pudo conectar a Google Drive.
            
Remote: ${REMOTE}
Fecha: ${DATE}
Hora: ${TIME}

Verifique la configuración de rclone." \
            "high"
        exit 1
    fi
    
    log_success "Conexión con Google Drive verificada"
}

# ============================================================================
# FUNCIONES DE BACKUP
# ============================================================================

# Copiar backups a Google Drive
copy_to_gdrive() {
    log_info "Iniciando copia a Google Drive..."
    
    # Crear carpeta del día en Google Drive
    log_info "Creando carpeta ${DATE} en Google Drive..."
    rclone mkdir "${REMOTE}/${DATE}" 2>/dev/null
    
    if [ $? -ne 0 ]; then
        log_error "Error creando carpeta en Google Drive"
        send_email "BACKUP OFF-SITE FALLÓ - $(hostname)" \
            "Error creando carpeta ${DATE} en Google Drive.
            
Fecha: ${DATE}
Hora: ${TIME}" \
            "high"
        exit 1
    fi
    
    # Copiar cada backup del día
    local files_copied=0
    local total_size=0
    
    for backup in ${BACKUP_DIR}/*_${DATE}_*; do
        if [ -f "$backup" ]; then
            local filename=$(basename "$backup")
            local filesize=$(stat -f%z "$backup" 2>/dev/null || stat -c%s "$backup" 2>/dev/null)
            
            log_info "Copiando: ${filename} ($(numfmt --to=iec $filesize))"
            
            # Copiar con rclone
            rclone copy "$backup" "${REMOTE}/${DATE}/" \
                --stats-log-level=ERROR \
                --log-level=ERROR 2>/dev/null
            
            if [ $? -eq 0 ]; then
                log_success "Copiado exitosamente: ${filename}"
                files_copied=$((files_copied + 1))
                total_size=$((total_size + filesize))
            else
                log_error "Error copiando: ${filename}"
                send_email "BACKUP OFF-SITE FALLÓ - $(hostname)" \
                    "Error copiando archivo a Google Drive.
                    
Archivo: ${filename}
Fecha: ${DATE}
Hora: ${TIME}" \
                    "high"
                exit 1
            fi
        fi
    done
    
    log_success "Copia completada: ${files_copied} archivos, $(numfmt --to=iec $total_size) total"
}

# Verificar integridad post-copia
verify_integrity() {
    log_info "Verificando integridad de archivos copiados..."
    
    # Contar archivos locales
    local local_count=$(ls ${BACKUP_DIR}/*_${DATE}_* 2>/dev/null | wc -l)
    
    # Contar archivos en Google Drive
    local remote_count=$(rclone ls ${REMOTE}/${DATE}/ 2>/dev/null | wc -l)
    
    if [ "$local_count" -ne "$remote_count" ]; then
        log_error "Discrepancia en cantidad de archivos: local=${local_count}, remoto=${remote_count}"
        send_email "BACKUP OFF-SITE - ERROR DE INTEGRIDAD - $(hostname)" \
            "Discrepancia en archivos copiados.
            
Archivos locales: ${local_count}
Archivos remotos: ${remote_count}
Fecha: ${DATE}
Hora: ${TIME}" \
            "high"
        exit 1
    fi
    
    # Verificar tamaños
    for backup in ${BACKUP_DIR}/*_${DATE}_*; do
        if [ -f "$backup" ]; then
            local filename=$(basename "$backup")
            local local_size=$(stat -f%z "$backup" 2>/dev/null || stat -c%s "$backup" 2>/dev/null)
            
            # Obtener tamaño del archivo remoto
            local remote_size=$(rclone size ${REMOTE}/${DATE}/${filename} --json 2>/dev/null | grep -o '"bytes":[0-9]*' | cut -d: -f2)
            
            if [ "$local_size" -ne "$remote_size" ]; then
                log_error "Discrepancia de tamaño en ${filename}: local=${local_size}, remoto=${remote_size}"
                send_email "BACKUP OFF-SITE - ERROR DE INTEGRIDAD - $(hostname)" \
                    "Discrepancia de tamaño en archivo.
                    
Archivo: ${filename}
Tamaño local: ${local_size}
Tamaño remoto: ${remote_size}
Fecha: ${DATE}
Hora: ${TIME}" \
                    "high"
                exit 1
            fi
        fi
    done
    
    log_success "Integridad verificada: ${local_count} archivos, todos los tamaños correctos"
}

# Verificar espacio en Google Drive
check_gdrive_space() {
    log_info "Verificando espacio en Google Drive..."
    
    # Obtener información de espacio
    local about_info=$(rclone about ${REMOTE}/ 2>/dev/null)
    
    if [ -n "$about_info" ]; then
        log_info "Información de espacio:"
        echo "$about_info" | tee -a "$LOG_FILE"
        
        # Extraer espacio libre (esto puede variar según el formato de salida)
        local free_space=$(echo "$about_info" | grep -i "free" | awk '{print $2}' || echo "unknown")
        
        if [ "$free_space" != "unknown" ]; then
            log_info "Espacio libre: ${free_space}"
        fi
    fi
    
    log_success "Verificación de espacio completada"
}

# ============================================================================
# FUNCIONES DE MANTENIMIENTO
# ============================================================================

# Limpiar logs antiguos
cleanup_old_logs() {
    log_info "Limpiando logs antiguos..."
    
    # Eliminar logs mayores a 90 días
    find ${LOG_DIR} -name "backup-offsite-*.log" -mtime +${LOG_RETENTION_DAYS} -delete 2>/dev/null
    
    log_success "Limpieza de logs completada"
}

# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

main() {
    # Crear directorio de logs si no existe
    mkdir -p ${LOG_DIR} 2>/dev/null
    
    log_info "================================================================"
    log_info "INICIO BACKUP OFF-SITE - Medical ERP"
    log_info "================================================================"
    log_info "Fecha: ${DATE}"
    log_info "Hora: ${TIME}"
    log_info "Servidor: $(hostname)"
    log_info "================================================================"
    
    # Ejecutar en orden
    verify_local_backup
    verify_gdrive_connection
    copy_to_gdrive
    verify_integrity
    check_gdrive_space
    cleanup_old_logs
    
    # Enviar email de éxito
    send_email "BACKUP OFF-SITE EXITOSO - $(hostname)" \
        "Backup off-site completado exitosamente.

Fecha: ${DATE}
Hora: ${TIME}
Servidor: $(hostname)

Resumen:
- Backups copiados: $(ls ${BACKUP_DIR}/*_${DATE}_* 2>/dev/null | wc -l) archivos
- Carpeta remota: ${REMOTE}/${DATE}/
- Verificación de integridad: OK

El sistema de backup está funcionando correctamente." \
        "normal"
    
    log_info "================================================================"
    log_success "FIN BACKUP OFF-SITE - EXITOSO"
    log_info "================================================================"
}

# ============================================================================
# EJECUCIÓN
# ============================================================================

# Ejecutar función principal
main "$@"
```

### 8.4 Verification Script

**Script: verify-backups.sh**

```bash
#!/bin/bash
###############################################################################
# verify-backups.sh - Verificación semanal de integridad de backups
# Ejecuta: Domingos a las 4:00 AM
# Autor: Medical ERP Backup System
# Versión: 1.0.0
###############################################################################

set -euo pipefail

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

BACKUP_DIR="/var/medical-erp/backups"
LOG_DIR="/var/log/medical-erp"
REMOTE="gdrive:medical-erp-backups"
DATE=$(date +%Y%m%d)
WEEKLY_DATE=$(date -d "7 days ago" +%Y%m%d)
LOG_FILE="${LOG_DIR}/verify-backups-${DATE}.log"

# Email
EMAIL_TO="admin@clinica.com"
EMAIL_FROM="backup@clinica.com"

# ============================================================================
# FUNCIONES
# ============================================================================

log() {
    local level="$1"
    local message="$2"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [${level}] ${message}" | tee -a "$LOG_FILE"
}

send_email() {
    local subject="$1"
    local body="$2"
    echo "$body" | mail -s "$subject" "$EMAIL_TO" 2>/dev/null
}

# Verificar backups locales
verify_local_backups() {
    log "INFO" "Verificando backups locales de los últimos 7 días..."
    
    local errors=0
    
    for i in {0..6}; do
        local check_date=$(date -d "${i} days ago" +%Y%m%d)
        local backup_count=$(ls ${BACKUP_DIR}/*_${check_date}_* 2>/dev/null | wc -l)
        
        if [ "$backup_count" -eq 0 ]; then
            log "WARNING" "No se encontraron backups del día ${check_date}"
            errors=$((errors + 1))
        else
            log "INFO" "Backups del ${check_date}: ${backup_count} archivos"
        fi
    done
    
    return $errors
}

# Verificar backups en Google Drive
verify_remote_backups() {
    log "INFO" "Verificando backups en Google Drive..."
    
    local remote_folders=$(rclone lsd ${REMOTE}/ 2>/dev/null | awk '{print $NF}' | sort -r | head -7)
    
    if [ -z "$remote_folders" ]; then
        log "ERROR" "No se encontraron carpetas en Google Drive"
        return 1
    fi
    
    local folder_count=$(echo "$remote_folders" | wc -l)
    log "INFO" "Carpetas encontradas en Google Drive: ${folder_count}"
    
    echo "$remote_folders" | while read folder; do
        local file_count=$(rclone ls ${REMOTE}/${folder}/ 2>/dev/null | wc -l)
        log "INFO" "Carpeta ${folder}: ${file_count} archivos"
    done
    
    return 0
}

# ============================================================================
# PRINCIPAL
# ============================================================================

main() {
    mkdir -p ${LOG_DIR} 2>/dev/null
    
    log "INFO" "================================================================"
    log "INFO" "INICIO VERIFICACIÓN SEMANAL DE BACKUPS"
    log "INFO" "================================================================"
    
    local local_errors=0
    local remote_errors=0
    
    verify_local_backups || local_errors=$?
    verify_remote_backups || remote_errors=$?
    
    local total_errors=$((local_errors + remote_errors))
    
    if [ "$total_errors" -gt 0 ]; then
        log "WARNING" "Verificación completada con ${total_errors} advertencias"
        
        send_email "VERIFICACIÓN DE BACKUPS - ADVERTENCIAS - $(hostname)" \
            "La verificación semanal de backups encontró advertencias.

Fecha: ${DATE}
Servidor: $(hostname)

Advertencias locales: ${local_errors}
Advertencias remotas: ${remote_errors}

Por favor, revise los logs en ${LOG_DIR}" \
            "normal"
    else
        log "INFO" "Verificación completada exitosamente"
        
        send_email "VERIFICACIÓN DE BACKUPS EXITOSA - $(hostname)" \
            "La verificación semanal de backups se completó exitosamente.

Fecha: ${DATE}
Servidor: $(hostname)

Todos los backups de los últimos 7 días están presentes y verificados." \
            "low"
    fi
    
    log "INFO" "================================================================"
    log "INFO" "FIN VERIFICACIÓN SEMANAL DE BACKUPS"
    log "INFO" "================================================================"
}

main "$@"
```

### 8.5 Monitoring & Alerts

| Check | Frequency | Action |
|---|---|---|
| Backup success | Daily | Email notification |
| Backup failure | Daily | Email alert (high priority) |
| Integrity error | Daily | Email alert (high priority) |
| Google Drive space | Weekly | Email warning |
| Local disk space | Daily | Email warning |

### 8.6 Recovery from Google Drive

**Procedimiento para restaurar desde Google Drive:**

```bash
#!/bin/bash
# restore-from-gdrive.sh - Restaurar backup desde Google Drive

REMOTE="gdrive:medical-erp-backups"
RESTORE_DIR="/var/medical-erp/backups/restored"
DATE=$1  # Fecha a restaurar (YYYYMMDD)

# Crear directorio de restauración
mkdir -p ${RESTORE_DIR}

# Descargar backups del día específico
rclone copy ${REMOTE}/${DATE}/ ${RESTORE_DIR}/ --progress

# Verificar archivos descargados
ls -lh ${RESTORE_DIR}/

echo "Backups restaurados en: ${RESTORE_DIR}"
echo "Para restaurar la base de datos:"
echo "  gunzip < ${RESTORE_DIR}/db_${DATE}_*.sql.gz | mysql -u root -p medical_erp_db"
```

---

## 9. Security Considerations

### 9.1 Backup Security

| Risk | Mitigation |
|---|---|
| Unauthorized access | Encrypted backups |
| Data theft | Secure storage |
| Data loss | Multiple locations |
| Corruption | Regular testing |

### 9.2 Encryption

| Component | Method |
|---|---|
| Database backup | gzip + GPG |
| File backup | tar + GPG |
| Config backup | tar + GPG |
| Google Drive | Encrypted in transit (TLS) |

**GPG Encryption (opcional, para mayor seguridad):**

```bash
# Encrypt backup
gpg --symmetric --cipher-algo AES256 backup.sql.gz

# Decrypt backup
gpg --decrypt backup.sql.gz.gpg > backup.sql.gz
```

---

## 10. Disaster Recovery

### 10.1 Recovery Scenarios

| Scenario | Procedure |
|---|---|
| Database corruption | Restore from latest backup |
| File loss | Restore files from backup |
| Server failure | Provision new server, restore from Google Drive |
| Data breach | Restore from clean backup, rotate credentials |

### 10.2 Recovery Steps

**Full Server Recovery from Google Drive:**

1. Provision new VPS
2. Install MySQL 8.x
3. Install rclone and configure Google Drive
4. Restore database backup from Google Drive
5. Restore file backups from Google Drive
6. Restore configuration
7. Install Java 21
8. Deploy application
9. Configure SSL
10. Update DNS
11. Verify functionality

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
