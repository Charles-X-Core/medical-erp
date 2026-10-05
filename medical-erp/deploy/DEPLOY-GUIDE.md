# Medical ERP - Deploy Guide

## Pre-requisitos
- Acceso SSH al VPS: `ssh root@217.216.41.38`
- Password del VPS

## Paso 1: Subir archivos al VPS

Desde tu terminal en Windows (en `C:\Users\Administrator\Desktop\pagina\medical-erp`):

### 1.1 Subir el JAR del backend
```powershell
scp backend\target\medical-erp-1.0.0.jar root@217.216.41.38:/opt/medical-erp/app.jar
```

### 1.2 Subir el frontend (carpeta dist/)
```powershell
scp -r frontend\dist\* root@217.216.41.38:/opt/medical-erp/frontend/
```

### 1.3 Subir la configuración de producción
```powershell
scp deploy\application.properties root@217.216.41.38:/opt/medical-erp/config/
```

## Paso 2: Conectar al VPS

```bash
ssh root@217.216.41.38
```

## Paso 3: Crear estructura de directorios

```bash
mkdir -p /opt/medical-erp/{config,uploads,logs,backups}
```

## Paso 4: Configurar MySQL

```bash
mysql -u root <<'SQL'
CREATE DATABASE IF NOT EXISTS medical_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'medicalerp'@'localhost' IDENTIFIED BY 'MedicalErp2026!';
GRANT ALL PRIVILEGES ON medical_erp.* TO 'medicalerp'@'localhost';
FLUSH PRIVILEGES;
SQL
```

## Paso 5: Crear servicio systemd

```bash
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
```

## Paso 6: Iniciar el backend

```bash
systemctl enable medical-erp
systemctl start medical-erp
```

Flyway crea automáticamente todas las tablas y el usuario admin.

Esperar ~15 segundos y verificar:
```bash
curl http://127.0.0.1:8080/actuator/health
```

## Paso 7: Configurar Nginx

```bash
# Eliminar config default si existe
rm -f /etc/nginx/sites-enabled/default

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
```

## Paso 8: Verificar

Abrir en el navegador:
- **Frontend:** http://217.216.41.38
- **Health:** http://217.216.41.38/actuator/health

### Login Admin:
- **Email:** admin@clinica.com
- **Password:** Admin123

## Comandos útiles

```bash
systemctl status medical-erp         # Ver estado
journalctl -u medical-erp -f         # Ver logs en tiempo real
systemctl restart medical-erp        # Reiniciar
cat /opt/medical-erp/logs/medical-erp.log  # Ver log del archivo
```

## Agregar doctora después

Cuando tengas el email y contraseña de la doctora:
1. Login como admin en http://217.216.41.38
2. Ir a Data Center → Manual Import
3. Crear la doctora con su email
4. O insertar directo en MySQL:
```sql
-- Cambiar CONTRASENA_AQUI con la contraseña real
-- Generar hash BCrypt con: java -cp app.jar org.springframework.boot.loader.JarLauncher (o usar una tool online)
INSERT INTO usuarios (nombre, email, password, activo, created_at, updated_at)
VALUES ('Doctora', 'EMAIL_AQUI', 'HASH_BCRYPT_AQUI', TRUE, NOW(), NOW());

INSERT INTO usuario_roles (usuario_id, rol_id, created_at)
VALUES (
    (SELECT id FROM usuarios WHERE email = 'EMAIL_AQUI'),
    (SELECT id FROM roles WHERE nombre = 'doctora'),
    NOW()
);
```
