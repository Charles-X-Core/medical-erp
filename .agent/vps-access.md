# Acceso al VPS desde el agente

Como un agente de IA (opencode o similar) llega al servidor de produccion.
Todo lo que hace falta esta aqui: no hay que inventar comandos ni adivinar.

Documento de agente. NO decide que construir.

---

## 1. Datos de conexion

| Que | Valor |
|---|---|
| Host | `217.216.41.38` |
| Usuario | `root` |
| Puerto | 22 (por defecto) |
| Autenticacion | Solo password (no hay clave SSH registrada) |
| Dominio | `https://erp.myoptimalhealthnownow.com` (ver nota al pie) |
| Sistema | Ubuntu 24.04.4 LTS |
| Java | OpenJDK 21.0.12.1 |
| MySQL | 8.0.46, base `medical_erp` |

**Hostkey del servidor** (imprescindible en modo `-batch`):

```
SHA256:vp2qMLW6b5RAx/IhhOI9BMd6k4TEyxXng/TA4b//sk0
```

La password **no** esta en el repo. Sale de la variable `VPS_PASSWORD`:

```powershell
$env:VPS_PASSWORD = Read-Host -AsSecureString | ConvertFrom-SecureString -AsPlainText
```

> Nota: el dominio correcto es `erp.myoptimalhealthnow.com`. Si lees
> `myoptimalhealthnow.com` con "nownow", es un error de tipeo.

---

## 2. Herramientas

Se usa **PuTTY**, no el `ssh`/`scp` de OpenSSH, porque el servidor no tiene
registrada ninguna clave publica y `plink` permite pasar la password en linea de
comandos sin abrir un prompt interactivo.

```
C:\Program Files\PuTTY\plink.exe   -> ejecutar comandos
C:\Program Files\PuTTY\pscp.exe    -> copiar archivos
```

---

## 3. Los dos comandos base

Siempre con los cuatro flags. `-batch` es obligatorio: sin el, si la
autenticacion falla, `plink` se queda esperando una confirmacion interactiva y
la llamada se cuelga para siempre.

```powershell
$PLINK  = "C:\Program Files\PuTTY\plink.exe"
$PSCP   = "C:\Program Files\PuTTY\pscp.exe"
$HOSTKEY = "SHA256:vp2qMLW6b5RAx/IhhOI9BMd6k4TEyxXng/TA4b//sk0"
$TARGET = "root@217.216.41.38"
```

**Ejecutar en el servidor:**

```powershell
& $PLINK -batch -hostkey $HOSTKEY -pw $env:VPS_PASSWORD $TARGET "systemctl is-active medical-erp"
```

**Copiar un archivo hacia el servidor** (`pscp` acepta **un solo** origen: para
varios hay que repetirse, no poner dos rutas):

```powershell
& $PSCP -batch -hostkey $HOSTKEY -pw $env:VPS_PASSWORD "origen\archivo" "$TARGET`:/tmp/archivo"
```

Fíjate en el `` `: `` de `"$TARGET`:/tmp/archivo"``. En PowerShell el `:` se
interpreta como letra de unidad de disco (`C:`), y sin el escape falla con un
error de ruta. Alternativa: deja el destino como argumento suelto sin comillas.

---

## 4. La trampa de PowerShell (causa numero uno de fallos)

**El shell de las herramientas es Windows PowerShell 5.1**, no bash. Y
PowerShell **rompe** los comandos que contienen:

- Comillas dobles anidadas
- `$(...)` — lo interpreta como subexpresión de PowerShell, no de bash
- `2>&1`, `|`, `>` fuera de comillas
- Parentesis en argumentos

### Sintoma tipico

```powershell
# INCORRECTO: PowerShell ejecuta $(date +%s) y daña el comando
& $PLINK ... "cp app.jar app.jar.bak.$(date +%s)"

# ERROR: cp: cannot stat 'app.jar.new': No such file or directory
```

### Regla: si el comando remoto tiene comillas dobles internas, usa archivos

Es la unica forma fiable. Escribe el script en local, subelo, quita los CR y
ejecutalo:

```powershell
# 1) escribir el script local (en el repo o en %TEMP%)
$script = "deploy-jar.sh"
& $PSCP -batch -hostkey $HOSTKEY -pw $env:VPS_PASSWORD $script "$TARGET`:/tmp/$script"

# 2) quitar los CR de Windows: si no, bash da ^M: command not found
& $PLINK -batch -hostkey $HOSTKEY -pw $env:VPS_PASSWORD $TARGET "sed -i 's/\r$//' /tmp/$script; bash /tmp/$script"

# 3) limpiar
& $PLINK -batch -hostkey $HOSTKEY -pw $env:VPS_PASSWORD $TARGET "rm -f /tmp/$script"
```

### SQL y JSON: siempre por archivo

Un `mysql -e "SELECT ..."` o un `curl -d '{...}'` con comillas internas casi
siempre llega corrupto al servidor, y el backend responde `500` con un error
engañoso de "JSON parse error" que en realidad es un problema de escapado local.

```powershell
# INCORRECTO: el JSON llega mal formado y el backend devuelve 500
& $PLINK ... "curl -s http://localhost:8080/api/v1/auth/login -X POST -d '{\"email\":\"a@b.com\",...}'"
# ERROR: {"success":false,"message":"Error interno del servidor"}
#         org.springframework.http.converter.HttpMessageNotReadableException:
#         JSON parse error: Unrecognized character escape ':'

# CORRECTO: el payload va en un archivo
"@{`"email`":`"admin@clinica.com`",`"password`":`"Admin123`"}" | Set-Content /tmp/login.json -Encoding UTF8
& $PLINK ... "curl -s http://localhost:8080/api/v1/auth/login -X POST -H 'Content-Type: application/json' -d @/tmp/login.json"
```

Esto **no** es un bug del backend. Antes de culpar a la aplicacion, sospechar del
escapado.

### Salida a archivo cuando el comando se traba

Si `plink` devuelve una salida enorme o se corta a la mitad, el problema suele
ser la tubereria. Guarda la salida en un archivo y despues filtrala:

```powershell
& $PLINK -batch -hostkey $HOSTKEY -pw $env:VPS_PASSWORD $TARGET "bash /tmp/script.sh" 2>&1 | Out-File -Encoding UTF8 "$env:TEMP\out.txt"
Get-Content "$env:TEMP\out.txt" | Select-String -Pattern "Started|ERROR"
```

Cuidado: `2>&1` **fuera** de las comillas del argumento lo interpreta
PowerShell. Ponlo dentro del string que se le pasa a `plink`.

---

## 5. Tareas frecuentes

### Estado del servicio

```powershell
& $PLINK -batch -hostkey $HOSTKEY -pw $env:VPS_PASSWORD $TARGET "systemctl is-active medical-erp; systemctl is-active nginx"
```

### Logs

```powershell
& $PLINK ... "journalctl -u medical-erp --since '10 min ago' --no-pager | tail -40"
& $PLINK ... "journalctl -u medical-erp -p err --since '1 hour ago' --no-pager"
& $PLINK ... "journalctl -u medical-erp -n 200 --no-pager | grep -E 'Started MedicalErp|Tomcat started'"
```

La aplicacion tarda **~40 segundos** en levantar. Espera antes de concluir que
falló.

### Consulta rapida a la API

```powershell
& $PLINK ... "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/v1/auth/login -X POST -H 'Content-Type: application/json' -d @/tmp/login.json"
```

Para el token de sesion:

```powershell
& $PLINK ... "curl -s http://localhost:8080/api/v1/auth/login -X POST -H 'Content-Type: application/json' -d @/tmp/login.json | sed -n 's/.*\"token\":\"\([^\"]*\)\".*/\1/p'"
```

### MySQL (leer y escribir)

```powershell
# modo batch: sin tabla, una fila por linea, facil de parsear
& $PLINK ... "mysql -u root -p$env:MYSQL_PASSWORD medical_erp -N -B -e 'SELECT ...'"

# Con tabla y cabecera
& $PLINK ... "mysql -u root -p$env:MYSQL_PASSWORD medical_erp -e 'SELECT ...'"
```

`-p$env:MYSQL_PASSWORD` sin espacio entre `-p` y el valor. En `pscp`/`plink` el
valor llega a bash, que lo expande.

Evita `SELECT ... (...)` con funciones dentro del `-e` cuando el comando travela
por varias capas de quoting; usa primero `-N -B` y parses en local.

### Desplegar el backend

Ver `medical-erp/deploy/DEPLOY-GUIDE.md`. Resumen:

```powershell
# 1) compilar local
cd medical-erp\backend; mvn package -Dmaven.test.skip=true

# 2) subir como .new (nunca encima del app.jar activo)
& $PSCP -batch -hostkey $HOSTKEY -pw $env:VPS_PASSWORD `
  target\medical-erp-1.0.0.jar "$TARGET`:/tmp/app.jar.new"

# 3) swap con backup + restart, via script (por el $() de date)
# 4) verificar
& $PLINK ... "systemctl is-active medical-erp"
```

## 6. Desplegar el frontend

`Compress-Archive` de Windows crea el zip con separadores `\`, y `unzip` en Linux
avisa `appears to use backslashes as path separators`. **El unzip devuelve
codigo 1 aunque extraiga bien.** Con `set -e` el script se aborta ahi.

Dos salidas: subir los archivos sueltos, o normalizar el zip:

```bash
unzip -oq /tmp/fe-dist.zip || true    # el || true es obligatorio
```

## 7. Estructura del servidor

```
/opt/medical-erp/
  app.jar              <- JAR activo (lo ejecuta el servicio)
  application.properties  <- config REAL: credenciales, JWT, correo
  frontend/            <- dist servida por nginx
  uploads/             <- contratos firmados, firmas, evidencias (22 MB)
  app.jar.bak.*        <- backups
```

El servicio arranca asi:

```
WorkingDirectory=/opt/medical-erp
ExecStart=/usr/bin/java -Duser.timezone=America/Los_Angeles -Xms2g -Xmx4g \
  -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/heapdump.hprof \
  -XX:+UseG1GC -XX:MaxGCPauseMillis=200 \
  -Dspring.profiles.active=prod -jar /opt/medical-erp/app.jar
```

### Consecuencia que hay que tener presente

**No hay `--spring.config.location`.** Spring Boot carga automaticamente el
`./application.properties` del directorio de trabajo, y ese **gana** sobre el
`application-prod.properties` que va dentro del JAR.

Por eso:

- Las credenciales reales viven en `/opt/medical-erp/application.properties`, y
  **no estan en el repo**.
- Cambiar un `.properties` del repo **no** cambia produccion. Para cambiar la
  config en vivo hay que editar el del servidor por SSH.
- Los `-Xms2g -Xmx4g` son obligatorios: con menos, el agendador tira
  `OutOfMemoryError` al generar los slots de la semana.

---

## 8. Zona horaria: dos relojes, no uno

| Cual | Que representa |
|---|---|
| **Hora de negocio** | `America/Los_Angeles`. Es el "hoy" y el "ahora" de la aplicacion: citas, agenda, no-show. La define `BusinessTime`. |
| **Hora del servidor** | La del VPS (`TZ=America/Los_Angeles` en el servicio). |

MySQL corre en UTC, asi que `CURDATE()` **no** coincide con el dia de negocio.
Al comparar fechas desde la consola hay que decirlo explicitamente:

```sql
-- MAL: devuelve el dia UTC, que puede ser el siguiente
WHERE DATE(fecha_hora) = CURDATE()

-- BIEN
WHERE fecha_hora >= '<fecha-de-negocio>' AND fecha_hora < '<fecha-de-negocio+1d>'
```

Mismo cuidado con "hoy" en un `SELECT`: el backend usa `BusinessTime.today()`,
no `LocalDate.now()`.

---

## 9. Errores conocidos

| Lo que ves | Que pasa realmente | Que hacer |
|---|---|---|
| `NoClassDefFoundError: ch/qos/logback/...` en el reinicio | Es del proceso **anterior** apagandose; su classloader ya no encuentra clases del JAR ya reemplazado | Ignorarlo. Si el servicio queda `active`, arrancó bien |
| `Unrecognized character escape ':'` (HTTP 500) | El JSON se corrompio en el quoting de PowerShell, no es un bug del backend | Reintentar con el payload en archivo |
| El frontend sirve el bundle viejo | El service worker lo cachea | Recarga con `Ctrl+Shift+R` |
| `cp: cannot stat 'app.jar.new'` | El `cd` del script dejo el archivo en `/tmp`, no en el directorio de trabajo | Usar rutas absolutas en el script |
| `plink` se cuelga sin devolver nada | Falta `-batch`, y esta esperando confirmacion interactiva | Anadir `-batch -hostkey` |
| `OutOfMemoryError` al abrir el agendador | Heap insuficiente | Los `-Xmx4g` del servicio; no bajar |
| `command not found` con `^M` | Script de Windows sin quitar los CR | `sed -i 's/\r$//' <archivo>` |

## 10. Reglas para el agente

1. **Nunca** escribir la password en un archivo del repo. Va en `$env:VPS_PASSWORD`.
2. **Nunca** usar `ssh`/`scp` de OpenSSH: no hay clave registrada, fallan.
3. **Siempre** `-batch -hostkey ...`. Sin `-batch`, la llamada se cuelga.
4. **Siempre** usar rutas absolutas en los scripts remotos.
5. **Siempre** un script en archivo si el comando tiene comillas dobles internas.
6. **Nunca** `git add -A` en este repo: la carpeta de la landing es un repo
   anidado y se agregaria como submodulo roto. Usar rutas explicitas.
7. **Nunca** ejecutar `medical-erp/backend/reset_virgen.sql`: hace `TRUNCATE` de
   tratamientos, sesiones y evidencias.
8. Antes de un deploy, confirmar que el build local paso. El servicio se queda
   caido mientras compila.
9. Si un comando remoto falla, **leer el error antes de reintentar**. Casi siempre
   es quoting, no logica.
