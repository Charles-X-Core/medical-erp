# Montar el proyecto en una PC nueva

Todo el codigo esta en el repo. Clonar, instalar las herramientas y ya se
puede desarrollar. Este documento es la lista completa.

---

## 1. Herramientas que hay que instalar

| Herramienta | Version | Para que |
|---|---|---|
| **JDK** | 21 LTS | El backend. `backend/pom.xml` pide `<java.version>21</java.version>`. Verifica con `java -version`. |
| **Maven** | 3.9.6 | Compilar el backend. |
| **Node.js** | 20.19+ o 22.12+ (probado con v25.9.0) | El frontend. Vite 8 pide esa base. |
| **Git** | cualquiera | Clonar y pushear. |
| **PuTTY** | cualquiera | `pscp` y `plink` para desplegar al VPS. En `C:\Program Files\PuTTY\`. |
| **Cliente MySQL** | 8.x | Consultar la base del VPS. Solo si vas a tocar datos. |

Comprueba que Maven tiene Java bien configurado:

```cmd
set JAVA_HOME=C:\Program Files\Java\jdk-21
mvn -version
```

---

## 2. Clonar

```cmd
git clone https://github.com/Charles-X-Core/medical-erp.git
cd medical-erp
```

La landing page (el sitio de Vercel) **no viene aqui**: es otro repo.

```cmd
git clone https://github.com/Charles-X-Core/optimal-health-now-pagina-web.git
```

Esta carpeta esta en el `.gitignore` del repo del ERP a proposito, para que un
`git add -A` no la convierta en un submodulo roto.

---

## 3. Dependencias del frontend

```cmd
cd frontend
npm install
npm run build      # genera dist/
```

`node_modules/` y `dist/` estan en `.gitignore`, por eso hay que instalarlos.

---

## 4. Credenciales de los scripts

Los scripts de `deploy/` y `tools/` ya no llevan la password escrita: la leen
del entorno. Copia el ejemplo y completalo.

```cmd
copy deploy\.env.example deploy\.env
```

`deploy/.env` esta en `.gitignore`. Despues, en la misma consola:

```cmd
set -a && . deploy\.env && set +a
bash deploy\test-signos-walkin.sh
```

---

## 5. Donde NO esta la informacion importante

Esto vive solo en el VPS y hay que leerlo por SSH cuando haga falta:

| Que | Donde |
|---|---|
| Credenciales reales (MySQL, JWT, correo) | `/opt/medical-erp/application.properties` |
| Base de datos | MySQL 8 en el VPS, base `medical_erp` |
| Contratos firmados, firmas, evidencias | `/opt/medical-erp/uploads/` (22 MB) |
| JAR en ejecucion | `/opt/medical-erp/app.jar` |
| Frontend servido | `/opt/medical-erp/frontend/` |

```cmd
plink -ssh root@217.216.41.38 "cat /opt/medical-erp/application.properties"
```

**Por que el backend funciona sin las credenciales del repo:** el servicio
arranca con `java -jar /opt/medical-erp/app.jar` y su `WorkingDirectory` es
`/opt/medical-erp`. Spring Boot carga automaticamente el `application.properties`
de ese directorio, y ese gana sobre el que va empaquetado dentro del JAR. Por eso
el repo puede tener valores de desarrollo.

---

## 6. Desplegar

### Backend

```cmd
cd backend
mvn package -Dmaven.test.skip=true
```

Sube el JAR como `app.jar.new` y luego el swap:

```cmd
pscp -batch -pw %VPS_PASSWORD% ^
  backend\target\medical-erp-1.0.0.jar ^
  root@217.216.41.38:/tmp/app.jar.new

plink -batch -pw %VPS_PASSWORD% root@217.216.41.38 ^
  "cp /opt/medical-erp/app.jar /opt/medical-erp/app.jar.bak.$(date +%F-%H%M%S) && cp /tmp/app.jar.new /opt/medical-erp/app.jar && rm /tmp/app.jar.new && systemctl restart medical-erp"
```

Espera ~40 s y comprueba:

```cmd
plink -batch -pw %VPS_PASSWORD% root@217.216.41.38 "systemctl is-active medical-erp; journalctl -u medical-erp -n 20 --no-pager"
```

Al arrancar debe aparecer `Started MedicalErpApplication in ... seconds` y el
servicio queda `active`.

> El `NoClassDefFoundError: ch/qos/logback/...` que sale en el log durante el
> reinicio es del proceso **anterior** apagandose (su classloader ya no
> encuentra clases del JAR que se acaba de reemplazar). Es inofensivo.

### Frontend

```cmd
cd frontend
npm run build
```

Empaqueta `dist/` y subelo a `/opt/medical-erp/frontend/`:

```cmd
plink -batch -pw %VPS_PASSWORD% root@217.216.41.38 "rm -rf /opt/medical-erp/frontend/*"
pscp -batch -pw %VPS_PASSWORD% -r dist\* root@217.216.41.38:/opt/medical-erp/frontend/
```

Comprueba que sirve el bundle nuevo:

```cmd
curl -s https://erp.myoptimalhealthnow.com/ | findstr /i "index-"
```

> Ojo con `Compress-Archive` en Windows: crea el zip con separadores `\`, y
> `unzip` en Linux avisa pero funciona. Si prefieres evitar el aviso, sube los
> archivos sueltos en vez de un zip.

---

## 7. Datos que NO se pueden recuperar del repo

- **`uploads/`**: contratos ya firmados, imagenes de firma y evidencias. Se
  generan con el uso normal. Si borras `/opt/medical-erp/uploads`, se pierden de
  forma irreversible.
- **Base de datos**: no hay dump versionado. Si hay que reconstruirla, las
  migraciones de Flyway reconstructen el esquema, pero **no los datos**.

Las plantillas de contrato si estan en el repo
(`backend/src/main/resources/plantillas/`), y `ConsentTemplateInitializer` las
restaura solas al arrancar. Ese caso esta cubierto.

---

## 8. Si algo sale mal

**El frontend sirve la version vieja.** El service worker cachea el bundle.
Recarga con `Ctrl+Shift+R`.

**"building embedded git repository" al hacer add.** No uses `git add -A` ni
`git add .`; siempre rutas explicitas. El `.gitignore` ya protege la carpeta de
la landing, pero por costumbre usa siempre rutas.

**Login 422 con `PACIENTE_TIENE_CITA_HOY`.** Es el guard de la consulta
instantanea: el paciente ya tiene cita hoy, hay que usar "Atencion con cita".

**El backend no arranca y el log dice que no encuentra la config.** El
`application.properties` del working directory esta pisando al del JAR. Revisalo
por SSH.

**Al compilar el backend con Maven, JDK equivocado.** `mvn -version` debe
mostrar Java 21.
