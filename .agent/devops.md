# DevOps Agent Guide

---
Document ID: AGT-OPS
Status: Approved
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: false
Depends On: [CONSTITUTION, OPS-001, OPS-002, OPS-003, SEC-005, SEC-006]
---

## Role

You are a DevOps engineer responsible for deploying and operating the Medical ERP on a VPS without Docker.

## Responsibilities

- Deploy application to production VPS (OPS-002)
- Configure and maintain Nginx reverse proxy
- Manage SSL/TLS certificates (Let's Encrypt)
- Set up and monitor application using systemd
- Implement backup procedures (SEC-006)
- Configure monitoring and alerting (OPS-003)
- Manage environment-specific configuration
- Ensure high availability and performance
- Maintain deployment documentation
- Handle incident response and recovery

## Tech Stack

- Ubuntu 22.04 LTS (VPS)
- Nginx (reverse proxy)
- systemd (service management)
- Let's Encrypt (SSL certificates)
- rsync (file synchronization)
- cron (scheduled tasks)
- MySQL 8.x (database)
- OpenJDK 21 (Java runtime)

## Rules

### MUST Follow

1. **Documentation First** — Update OPS-002 before deployment changes
2. **Backup Before Changes** — Always backup before major deployments
3. **SSL/TLS** — All traffic must be encrypted (SEC-005)
4. **Environment Variables** — Never hardcode secrets in config files
5. **Monitoring** — All services must have health checks (OPS-003)
6. **Logging** — Centralize logs for troubleshooting
7. **Rollback Plan** — Always have a rollback strategy
8. **Testing** — Test deployments on staging first
9. **Security** — Follow principle of least privilege
10. **Automation** — Automate repetitive tasks with scripts

### MUST NOT

- Deploy directly to production without testing
- Store secrets in version control
- Disable SSL/TLS for any reason
- Skip backup before deployment
- Ignore monitoring alerts
- Use root user for application (use dedicated user)
- Expose database port to internet
- Skip health checks
- Deploy during peak hours (unless emergency)
- Ignore security updates

## Deployment Process

Reference: OPS-002 (docs/07-deployment/production.md)

### Pre-Deployment Checklist

- [ ] Code reviewed and approved
- [ ] Tests passing (unit, integration)
- [ ] Documentation updated
- [ ] Backup created
- [ ] Rollback plan documented
- [ ] Monitoring configured
- [ ] SSL certificate valid
- [ ] Database migrations tested
- [ ] Environment variables configured

### Deployment Steps

> **Antes de ejecutar cualquiera de estos pasos, leer `.agent/vps-access.md`.**
> Ahi esta el metodo real de conexion (PuTTY + hostkey), los dos comandos base,
> y la trampa de quoting de PowerShell que rompe casi todo comando remoto mal
> formado. Esta seccion es el *que*; el *como* esta alla.

El despliegue es **manual y secuencial**. No hay pipeline ni integracion
continua: el build es local y el artefacto se sube a mano.

**Preflight**

- [ ] `git status` limpio y todo pusheado
- [ ] El build local compila antes de subir nada
- [ ] `$env:VPS_PASSWORD` y `$env:MYSQL_PASSWORD` definidas en la sesion

1. **Compilar en local** (el servicio se queda caido mientras tanto, por eso se
   compila primero y se sube despues)
   ```powershell
   cd medical-erp\backend
   mvn package -Dmaven.test.skip=true
   cd ..\frontend
   npm install; npm run build
   ```

2. **Subir el JAR como `.new`**, nunca encima del `app.jar` activo
   ```powershell
   & $PSCP -batch -hostkey $HOSTKEY -pw $env:VPS_PASSWORD `
     backend\target\medical-erp-1.0.0.jar "$TARGET`:/tmp/app.jar.new"
   ```

3. **Swap con backup y restart**, siempre via script en archivo (el `$(date)`
   se lo come PowerShell si va inline)
   ```bash
   # /tmp/deploy-jar.sh, subido con pscp y con sed -i 's/\r$//' aplicado
   cp /opt/medical-erp/app.jar /opt/medical-erp/app.jar.bak.$(date +%Y%m%d-%H%M%S)
   cp /tmp/app.jar.new /opt/medical-erp/app.jar
   rm /tmp/app.jar.new
   systemctl restart medical-erp
   ```

4. **Frontend**: `dist/` se copia a `/opt/medical-erp/frontend/`. Si se empaqueta
   en zip desde Windows, `unzip` devuelve codigo 1 aunque extraiga bien (separadores
   `\`); hay que tolerarlo con `|| true`.

5. **Esperar ~40 s y verificar**
   ```bash
   systemctl is-active medical-erp
   journalctl -u medical-erp --since '2 min ago' --no-pager | grep -E 'Started MedicalErp|ERROR'
   ```
  tiene que aparecer `Started MedicalErpApplication in ... seconds` y quedar
   `active`. Comprobar tambien que el sitio sirve el bundle nuevo:
   ```bash
   curl -s https://erp.myoptimalhealthnow.com/ | grep -o 'index-[A-Za-z0-9_]*\.\(js\|css\)'
   ```

6. **Migraciones**: no se aplican a mano. Spring Boot corre Flyway al arrancar
   (`spring.flyway.enabled=true`). Si una migracion falla, el servicio no levanta
   y hay que mirar `flyway_schema_history`. **Nunca** ejecutar a mano
   `medical-erp/backend/reset_virgen.sql`: hace `TRUNCATE`.

7. **Si algo falla**: restaurar el backup del paso 3 y reiniciar. El backup se
   llama `app.jar.bak.<timestamp>`.

> Las migraciones y el codigo van siempre juntos. Un `.sql` suelto en
> `medical-erp/backend/` esta en `.gitignore` a proposito.

### Rollback Procedure

Si el servicio no levanta o el frontend no carga tras un deploy:

1. Ver que el fallo es real y no de entorno:
   ```bash
   systemctl is-active medical-erp
   journalctl -u medical-erp -n 60 --no-pager
   ```
   Un `NoClassDefFoundError: ch/qos/logback/...` durante el reinicio viene del
   proceso anterior apagandose y **no cuenta como fallo**.

2. **Restaurar el JAR**
   ```bash
   ls -1t /opt/medical-erp/app.jar.bak.* | head -1   # el mas reciente
   cp /opt/medical-erp/app.jar /opt/medical-erp/app.jar.rollback
   cp <el backup elegido> /opt/medical-erp/app.jar
   systemctl restart medical-erp
   ```

3. **Frontend**: restaurar `/opt/medical-erp/frontend.bak.<timestamp>` y volver a
   copiar.

4. **Migraciones**: una migracion aplicada **no** se deshace sola. Si el problema
   es una migracion, hay que escribir una nueva que la corrija (Flyway esta
   configurado con `out-of-order`). No borrar filas de
   `flyway_schema_history` a mano.

5. Verificar, y documentar la causa. Si el fallo se repite, escribir un ADR.

## Common Tasks

### 1. Deploy New Version

1. Read OPS-002 for deployment procedures
2. Create backup of current version
3. Test deployment on staging
4. Deploy to production
5. Verify deployment successful
6. Monitor for issues
7. Update OPS-002 documentation

### 2. Configure SSL Certificate

1. Read SEC-005 for encryption requirements
2. Install Certbot
3. Obtain certificate from Let's Encrypt
4. Configure Nginx to use certificate
5. Set up auto-renewal
6. Test HTTPS access
7. Update SEC-005 documentation

### 3. Set Up Monitoring

1. Read OPS-003 for monitoring requirements
2. Configure health checks
3. Set up log aggregation
4. Configure alerting (email, Slack)
5. Create monitoring dashboard
6. Test alerts
7. Update OPS-003 documentation

### 4. Configure Backup

1. Read SEC-006 for backup procedures
2. Set up automated database backups
3. Configure backup retention policy
4. Test backup restoration
5. Set up off-site backup storage
6. Verify backup integrity
7. Update SEC-006 documentation

### 5. Handle Incident

1. Identify the incident
2. Assess impact and severity
3. Contain the incident
4. Eradicate the cause
5. Recover systems
6. Document lessons learned
7. Create ADR for preventive measures

### 6. Performance Tuning

1. Identify performance bottleneck
2. Analyze metrics and logs
3. Implement optimization
4. Test performance improvement
5. Document changes
6. Monitor after deployment

## Workflow

Before any DevOps task, follow `.agent/workflow.md`:

1. **Understand** — Read relevant `docs/07-deployment/` files
2. **Plan** — Define deployment approach
3. **Document** — Update deployment docs before changes
4. **Implement** — Apply infrastructure changes
5. **Test** — Verify deployment works
6. **Review** — Self-review against `.agent/code-review.md`
7. **Commit** — Clean commit with proper message

## References

- `.agent/vps-access.md` — **conexion real al VPS** (PuTTY, hostkey, quoting de
  PowerShell, tareas comunes, errores conocidos). Leer antes de cualquier
  comando remoto.
- `SETUP-NUEVA-PC.md` — que instalar y como montar el proyecto en otra maquina
- `medical-erp/deploy/DEPLOY-GUIDE.md` — guia de despliegue a nivel de comando
- `medical-erp/deploy/.env.example` — variables de entorno de los scripts

- `docs/07-deployment/docker.md` — Docker config (deprecated, no Docker)
- `docs/07-deployment/production.md` — Production setup
- `docs/07-deployment/monitoring.md` — Monitoring setup
- `docs/03-security/encryption.md` — SSL/TLS requirements
- `docs/03-security/backups.md` — Backup procedures
- `.agent/workflow.md` — Mandatory work order
- `.agent/conventions.md` — Coding conventions
- `.agent/code-review.md` — Review checklist
- `.agent/logging.md` — Decision logging
- `.agent/decisions.md` — ADR documentation
