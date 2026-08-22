# Docker Configuration

---
Document ID: OPS-001
Status: Deprecated
Version: 1.0.0
Owner: DevOps
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [ARCH-001]
---

## 1. Decision: No Docker

### 1.1 Why No Docker

| Reason | Explanation |
|---|---|
| VPS direct access | Full control over server, no container abstraction |
| Simpler debugging | Direct log access, no docker exec needed |
| No overhead | No container runtime resource consumption |
| Single deployment | Only one application runs on VPS |
| Manual control | Direct file system access for backups, logs, etc. |

### 1.2 Deployment Method

| Aspect | Approach |
|---|---|
| Runtime | Java 21 (Temurin JDK) |
| Process manager | Systemd |
| Reverse proxy | Nginx |
| Database | MySQL 8.x (native) |
| SSL | Let's Encrypt + Certbot |

---

## 2. Local Development Only

**NOT for production** — only for local development environment.

### 2.1 docker-compose.dev.yml

```yaml
# docker-compose.dev.yml — LOCAL DEVELOPMENT ONLY
# Usage: docker-compose -f docker-compose.dev.yml up -d

services:
  mysql:
    image: mysql:8.0
    container_name: medical-erp-mysql-dev
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: medical_erp
      MYSQL_USER: medical
      MYSQL_PASSWORD: medical
    volumes:
      - mysql-dev-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  mailtrap:
    image: mailhog/mailhog
    container_name: medical-erp-mailhog-dev
    ports:
      - "1025:1025"   # SMTP
      - "8025:8025"   # Web UI

volumes:
  mysql-dev-data:
```

### 2.2 Spring Boot Dev Config

```properties
# application-dev.properties (included via SPRING_PROFILES_ACTIVE=dev)
spring.datasource.url=jdbc:mysql://localhost:3306/medical_erp
spring.datasource.username=medical
spring.datasource.password=medical

# Mailtrap
spring.mail.host=localhost
spring.mail.port=1025
spring.mail.username=
spring.mail.password=
```

### 2.3 Usage

```bash
# Start dev services
docker-compose -f docker-compose.dev.yml up -d

# Stop dev services
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Remove volumes (fresh start)
docker-compose -f docker-compose.dev.yml down -v
```

---

## 3. Production Note

For production deployment, see **OPS-002 Production Deployment**.

Docker is intentionally NOT used in production for this project.
