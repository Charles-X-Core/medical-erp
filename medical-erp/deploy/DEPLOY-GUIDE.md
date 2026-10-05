# Medical ERP - Deploy Guide

> **Para despliegue rutinario, empieza por `.agent/vps-access.md`.** Ahi esta el
> metodo real de conexion (PuTTY con hostkey) y la trampa de quoting de
> PowerShell, que es la causa numero uno de fallos al desplegar.
>
> Este documento tiene dos partes:
> 1. **Despliegue rutinario** — el dia a dia. Es lo que se usa casi siempre.
> 2. **Instalacion inicial del servidor** — una sola vez, cuando el servidor
>    esta vacio. Sirve de referencia; **no** se repite en cada deploy.

---

# Parte 1 — Despliegue rutinario

El deploy es **manual**. No hay pipeline: el build es local y el artefacto se
sube a mano. El backend y el frontend se pueden subir por separado.

## 1.1 Variables de sesion

```powershell
$PLINK   = "C:\Program Files\PuTTY\plink.exe"
$PSCP    = "C:\Program Files\PuTTY\pscp.exe"
$HOSTKEY = "SHA256:vp2qMLW6b5RAx/IhhOI9BMd6k4TEyxXng/TA4b//sk0"
$TARGET  = "root@217.216.41.38"

$env:VPS_PASSWORD = Read-Host -AsSecureString | ConvertFrom-SecureString -AsPlainText
```

Sin `-batch` la llamada se cuelga esperando confirmacion interactiva. Es el flag
mas importante.

## 1.2 Compilar (primero, para no dejar el servicio caido)

```powershell
cd medical-erp\backend
mvn package -Dmaven.test.skip=true

cd ..\frontend
npm install
npm run build
```

## 1.3 Backend

Se sube como `.new` y se hace el swap con backup. Nunca encima del `app.jar`
activo: si el JAR esta malo, el servicio no vuelve.

```powershell
& $PSCP -batch -hostkey $HOSTKEY -pw $env:VPS_PASSWORD `
  backend\target\medical-erp-1.0.0.jar "$TARGET`:/tmp/app.jar.new"
```

Despues el swap. Va **en un script**, porque el `$(date ...)` lo destruye
PowerShell si se manda inline:

```bash
# deploy-jar.sh
set -e
cp /opt/medical-erp/app.jar /opt/medical-erp/app.jar.bak.$(date +%Y%m%d-%H%M%S)
cp /tmp/app.jar.new /opt/medical-erp/app.jar
rm /tmp/app.jar.new
systemctl restart medical-erp
```

```powershell
& $PSCP -batch -hostkey $HOSTKEY -pw $env:VPS_PASSWORD deploy-jar.sh "$TARGET`:/tmp/deploy-jar.sh"
& $PLINK  -batch -hostkey $HOSTKEY -pw $env:VPS_PASSWORD $TARGET "sed -i 's/\r$//' /tmp/deploy-jar.sh; bash /tmp/deploy-jar.sh"
```

**Verificar** (tarda ~40 s en arrancar):

```powershell
& $PLINK -batch -hostkey $HOSTKEY -pw $env:VPS_PASSWORD $TARGET `
  "systemctl is-active medical-erp; journalctl -u medical-erp --since '2 min ago' --no-pager | grep -E 'Started MedicalErp|ERROR' | tail -5"
```

Debe salir `active` y `Started MedicalErpApplication in ... seconds`.

## 1.4 Frontend

```powershell
& $PLINK -batch -hostkey $HOSTKEY -pw $env:VPS_PASSWORD $TARGET "cp -a /opt/medical-erp/frontend /opt/medical-erp/frontend.bak.$(Get-Date -Format yyyyMMdd-HHmmss)"
& $PLINK -batch -hostkey $HOSTKEY -pw $env:VPS_PASSWORD $TARGET "rm -rf /opt/medical-erp/frontend/*"
& $PSCP  -batch -hostkey $HOSTKEY -pw $env:VPS_PASSWORD -r frontend\dist\* "$TARGET`:/opt/medical-erp/frontend/"
```

**Verificar** que sirve el bundle nuevo:

```powershell
curl -s https://erp.myoptimalhealthnow.com/ | Select-String "index-"
```

> Si empaquetas el `dist` en zip desde Windows, `unzip` en Linux devuelve
> codigo **1** aunque extraiga bien, porque el zip lleva separadores `\`.
> Toleralo con `unzip ... || true`, o sube los archivos sueltos.

> Si el navegador sigue viendo la version anterior, es el **service worker**.
> Recarga con `Ctrl+Shift+R`.

## 1.5 Migraciones de base de datos

No se aplican a mano. Spring Boot corre Flyway al arrancar
(`spring.flyway.enabled=true`, `out-of-order=true`). Si una migracion falla, el
servicio no levanta:

```powershell
& $PLINK -batch -hostkey $HOSTKEY -pw $env:VPS_PASSWORD $TARGET `
  "mysql -u root -p$env:MYSQL_PASSWORD medical_erp -e 'SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 8;'"
```

Para **deshacer** una migracion no se borran filas de `flyway_schema_history` a
mano: se escribe una migracion nueva que la corrija.

## 1.6 Rollback

```bash
ls -1t /opt/medical-erp/app.jar.bak.* | head -1
cp /opt/medical-erp/app.jar /opt/medical-erp/app.jar.rollback
cp <el backup> /opt/medical-erp/app.jar
systemctl restart medical-erp
```

Para el frontend, restaurar `frontend.bak.<timestamp>`.

## 1.7 Comandos utiles

```bash
systemctl status medical-erp
systemctl restart medical-erp
journalctl -u medical-erp -f                      # logs en vivo
journalctl -u medical-erp -p err --since '1 hour ago'   # solo errores
journalctl -u medical-erp --since '10 min ago' --no-pager | tail -40
df -h /opt                                          # espacio
```

## 1.8 Estructura del servidor

```
/opt/medical-erp/
  app.jar                 <- JAR activo
  application.properties  <- config REAL (credenciales, JWT, correo)
  frontend/               <- dist servida por nginx
  uploads/                <- contratos firmados, firmas, evidencias
  app.jar.bak.*           <- backups
  frontend.bak.*          <- backups
```

**Ojo**: el servicio arranca con `WorkingDirectory=/opt/medical-erp` y sin
`--spring.config.location`. Spring Boot carga automaticamente el
`./application.properties` de ahi, y ese **gana** sobre el que va dentro del JAR.

Consecuencias:

- Las credenciales reales **no estan en el repo**. Cambiar un `.properties` del
  repo no cambia produccion.
- Para cambiar la config en vivo hay que editar
  `/opt/medical-erp/application.properties` por SSH y reiniciar.

---

# Parte 2 — Instalacion inicial del servidor

> Solo cuando el servidor esta vacio. Requiere acceso root. Si el servidor ya
> tiene el proyecto, usa la Parte 1.

## 2.1 Preparacion

```bash
apt update && apt upgrade -y
apt install -y openjdk-21-jdk nginx mysql-server
```

## 2.2 Base de datos

Flyway crea el esquema solo. La base si hay que crearla:

```bash
mysql -u root <<'SQL'
CREATE DATABASE IF NOT EXISTS medical_erp
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SQL
```

> El backend conecta **como `root`**, con la password en
> `/opt/medical-erp/application.properties`. Si se prefiere un usuario dedicado
> en vez de `root`, hay que cambiar ahi el `spring.datasource.username` /
> `spring.datasource.password` **y** conceder los permisos sobre `medical_erp`.
> La password **nunca** va en este repositorio.

## 2.3 Servicio systemd

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
Environment="TZ=America/Los_Angeles"
ExecStart=/usr/bin/java -Duser.timezone=America/Los_Angeles -Xms2g -Xmx4g -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/heapdump.hprof -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -Dspring.profiles.active=prod -jar /opt/medical-erp/app.jar
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=medical-erp

[Install]
WantedBy=multi-user.target
EOF

mkdir -p /opt/medical-erp/uploads
systemctl daemon-reload
systemctl enable medical-erp
```

### Los flags de la JVM no son opcionales

| Flag | Por que |
|---|---|
| `-Duser.timezone=America/Los_Angeles` | La zona de negocio. Sin ella el JVM usa la del sistema y las citas se corren. |
| `Environment="TZ=..."` | Idem para las herramientas del sistema. |
| `-Xms2g -Xmx4g` | Con menos, el agendador tira `OutOfMemoryError` al generar los slots de la semana. **Este fue un bug real.** |
| `-XX:+HeapDumpOnOutOfMemoryError` | Deja el heap en `/tmp` para poder diagnosticar la proxima vez. |
| `-XX:+UseG1GC -XX:MaxGCPauseMillis=200` | Collector y pausa maxima corta, para que el backend responda rapido. |

## 2.4 Configuracion de produccion

Se crea **en el servidor**, no desde el repo:

```
/opt/medical-erp/application.properties
```

Con al menos: `spring.datasource.url`, `spring.datasource.username`,
`spring.datasource.password`, `jwt.secret`, `spring.mail.*`,
`spring.flyway.enabled=true`, `app.upload.dir=/opt/medical-erp/uploads`.

Ese archivo pisa al `application-prod.properties` del JAR. Es deliberado: asi
las credenciales reales no viajan en el codigo.

## 2.5 Nginx

```bash
rm -f /etc/nginx/sites-enabled/default
```

```nginx
server {
    listen 80;
    server_name erp.myoptimalhealthnow.com 217.216.41.38;

    root /opt/medical-erp/frontend;
    index index.html;

    client_max_body_size 10M;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_read_timeout 60s;
    }

    location /actuator/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    # El service worker y los assets con hash en el nombre no se cachean mal.
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
ln -sf /etc/nginx/sites-available/medical-erp /etc/nginx/sites-enabled/medical-erp
nginx -t && systemctl reload nginx
```

HTTPS con certbot:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d erp.myoptimalhealthnow.com
```

## 2.6 Arrancar y verificar

```bash
systemctl start medical-erp
sleep 45
systemctl is-active medical-erp
journalctl -u medical-erp -n 30 --no-pager | grep -E 'Started MedicalErp|ERROR'
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/api/v1/auth/login -X POST \
  -H 'Content-Type: application/json' -d '{"email":"admin@clinica.com","password":"Admin123"}'
```

Flyway crea el esquema y el usuario admin en el primer arranque.

## 2.7 Plantillas de contrato

No hay que hacer nada: los HTML van dentro del JAR en
`backend/src/main/resources/plantillas/` y `ConsentTemplateInitializer` los
copia a `/opt/medical-erp/uploads/templates/` al arrancar, registrando la fila
en `consent_templates` si falta. Es idempotente.

Para comprobarlo:

```bash
mysql -u root -p$MYSQL_PASSWORD medical_erp \
  -e "SELECT codigo, version, titulo, storage_path FROM consent_templates;"
ls -l /opt/medical-erp/uploads/templates/
```

## 2.8 Primer arranque: usuario admin

- **Email:** `admin@clinica.com`
- **Password:** `Admin123`

**Cambiarlo en cuanto se entre por primera vez.** Para crear una doctora
despues, usar la interfaz (Data Center → Importacion Manual), que genera el
hash BCrypt correctamente. Insertar a mano en `usuarios` exige el hash; un
BCrypt generado con una herramienta online puede venir mal.

---

## Estructura de este repositorio

```
medical-erp/deploy/
  DEPLOY-GUIDE.md     este archivo
  deploy.sh           setup inicial del servidor
  .env.example        variables para los scripts
  application.properties  plantilla (NO son las credenciales reales)
  test-*.sh           pruebas de API; necesitan MYSQL_PASSWORD
```
