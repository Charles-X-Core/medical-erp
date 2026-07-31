# Technology Stack

---
Document ID: ARCH-004
Status: Draft
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [ARCH-001]
---

## 1. Core Backend Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Language | Java | 21 LTS | Backend language (LTS until 2029) |
| Framework | Spring Boot | 3.x | Application framework |
| Security | Spring Security | 6.x | Authentication/Authorization |
| ORM | Spring Data JPA | 3.x | Database abstraction |
| ORM Implementation | Hibernate | 6.x | JPA implementation |
| Database | MySQL | 8.x | Primary data store |
| Connection Pool | HikariCP | (included) | Database connection pooling |
| PDF Generation | iText | 7.x | PDF document generation |
| Email | Spring Mail | (included) | Email notifications |
| Auth Tokens | jjwt (io.jsonwebtoken) | 0.12.x | JWT token creation/validation |
| Validation | Jakarta Validation | 3.x | Bean validation |
| Mapping | MapStruct | 1.x | DTO ↔ Entity mapping |
| Boilerplate | Lombok | latest | Reduce Java boilerplate |

### 1.1 Rationale: Backend

| Choice | Why |
|---|---|
| Java 21 LTS | Long-term support, modern features (records, sealed classes, pattern matching) |
| Spring Boot 3.x | Industry standard for Java backends, excellent ecosystem |
| Spring Security 6.x | Robust auth framework, integrates with Spring Boot |
| JPA/Hibernate | Standard ORM, works with Spring Data |
| MySQL 8.x | Reliable, free, good performance for single-server |
| iText 7.x | PDF generation standard, digital signature support |
| jjwt 0.12.x | Lightweight JWT library, actively maintained |
| MapStruct | Compile-time mapping, no reflection overhead |
| Lombok | Reduces boilerplate (getters, setters, builders) |

---

## 2. Frontend Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| UI Framework | React | 18.x | Component-based UI |
| Build Tool | Vite | 5.x | Fast bundling and HMR |
| Routing | React Router | 6.x | Client-side routing |
| Styling | SCSS/Sass | 1.x | CSS preprocessing |
| HTTP Client | Axios | 1.x | API communication |
| PWA | Service Worker | (browser) | Offline capability |
| State | React Context | (built-in) | State management |
| Forms | React Hook Form | 7.x | Form handling |

### 2.1 Rationale: Frontend

| Choice | Why |
|---|---|
| React 18 | Large ecosystem, easy to find developers, good PWA support |
| Vite | Faster than Webpack, modern tooling |
| React Router 6 | Standard routing for React |
| SCSS | Variables, nesting, maintainable CSS |
| Axios | Interceptors for JWT, easy error handling |
| React Hook Form | Performant forms with validation |

---

## 3. PDF & Email Stack

| Layer | Technology | Purpose |
|---|---|---|
| PDF Generation | iText 7.x | Create PDF documents |
| PDF Signing | iText 7.x (pdfSign) | Digital signature on PDF |
| Email SMTP | Spring Mail | Send emails |
| SMTP Provider | Gmail SMTP | Production email |
| SMTP Testing | Mailtrap | Development testing |

### 3.1 SMTP Configuration

| Environment | Server | Port | Auth |
|---|---|---|---|
| Production | smtp.gmail.com | 587 | Yes (App Password) |
| Development | smtp.mailtrap.io | 587 | Yes (API Key) |

---

## 4. Development Tools

| Tool | Version | Purpose |
|---|---|---|
| Build | Maven | Dependency management, build lifecycle |
| IDE | IntelliJ IDEA | Java development |
| Version Control | Git | Source code management |
| API Testing | Postman | REST API testing |
| DB Client | MySQL Workbench | Database management |

### 4.1 Maven Dependencies

```xml
<!-- Core -->
spring-boot-starter-web
spring-boot-starter-data-jpa
spring-boot-starter-security
spring-boot-starter-validation
spring-boot-starter-mail

<!-- Database -->
mysql-connector-j

<!-- Auth -->
jjwt-api
jjwt-impl
jjwt-jackson

<!-- PDF -->
itext-core
itext-pdfa
itext-sign

<!-- Mapping -->
mapstruct
lombok

<!-- Testing -->
spring-boot-starter-test
```

---

## 5. Infrastructure

| Component | Technology | Location |
|---|---|---|
| Server | VPS (6 vCPU, 12GB RAM, 200GB SSD) | Custom |
| OS | Ubuntu/Debian | VPS |
| Java Runtime | OpenJDK 21 | VPS |
| Database | MySQL 8.x | VPS (same server) |
| Web Server | Nginx | VPS (reverse proxy) |
| SSL | Let's Encrypt | VPS |
| Domain | Custom | DNS |

### 5.1 Why No Docker

| Reason | Explanation |
|---|---|
| Simplicity | Direct installation is simpler for single-server |
| Resources | No Docker overhead on VPS |
| Debugging | Easier to debug without container layer |
| Maintenance | Less moving parts to maintain |

---

## 6. Version Policy

### 6.1 Backend Versions

| Dependency | Update Policy |
|---|---|
| Java | LTS versions only (21, 25, ...) |
| Spring Boot | Minor updates monthly, major annually |
| MySQL | Patch updates quarterly |
| iText | Minor updates as needed |

### 6.2 Frontend Versions

| Dependency | Update Policy |
|---|---|
| React | Minor updates monthly |
| Vite | Minor updates as needed |
| Node.js | LTS versions only |

### 6.3 Security Updates

| Priority | Action |
|---|---|
| Critical | Update within 24 hours |
| High | Update within 1 week |
| Medium | Update within 1 month |
| Low | Update in next release |

---

## 7. Development Environment

### 7.1 Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Java | 21+ | Compile and run backend |
| Maven | 3.9+ | Build backend |
| Node.js | 20+ LTS | Build frontend |
| npm | 10+ | Frontend dependencies |
| MySQL | 8.x | Local database |
| Git | 2.x | Version control |

### 7.2 IDE Setup

| IDE | Plugin |
|---|---|
| IntelliJ IDEA | Lombok, MapStruct, Spring Boot |
| VS Code | ESLint, Prettier, React snippets |

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
