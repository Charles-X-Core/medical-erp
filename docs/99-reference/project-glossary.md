# Glosario del Proyecto

---
Document ID: REF-001
Status: Draft
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [CONSTITUTION, DOM-UL-001]
---

## 1. Términos Médicos

| Término | Definición | Documento Fuente |
|---|---|---|
| Paciente | Individuo que recibe atención médica en la clínica | DOM-PAC-001 |
| Historia Clínica | Registro completo de la atención médica del paciente | DOM-HCL-001 |
| Consulta | Visita individual o cita con el paciente | DOM-CON-001 |
| Cita | Evento programado de atención médica | DOM-CIT-001 |
| Agenda | Calendario de disponibilidad del doctor | DOM-AGE-001 |
| Disponibilidad | Horarios en los que el doctor está disponible | DOM-AGE-001 |
| Bloqueo | Período de tiempo no disponible en la agenda | DOM-AGE-001 |
| Documento Médico | Documento formal que contiene información médica | DOM-DOC-001 |
| Firma Digital | Firma electrónica para autenticación de documentos | DOM-DOC-001 |
| Tipo de Cita | Categoría de consulta (general, control, emergencia) | DOM-CIT-001 |
| Motivo de Consulta | Razón principal de la visita del paciente | DOM-CON-001 |
| Diagnóstico | Evaluación médica del estado del paciente | DOM-CON-001 |
| Tratamiento | Plan de atención médica prescrito | DOM-CON-001 |
| Signos Vitales | Mediciones biomédicas básicas (T/A, FC, FR, T°) | DOM-CON-001 |
| Notas Médicas | Observaciones y registros del doctor | DOM-CON-001 |
| Mensaje de Contacto | Formulario de contacto desde la landing page | DOM-CON-002 |

---

## 2. Términos de Seguridad

| Término | Definición | Documento Fuente |
|---|---|---|
| Autenticación | Verificación de identidad del usuario | SEC-002 |
| Autorización | Control de acceso basado en roles | SEC-003 |
| RBAC | Role-Based Access Control (Control de Acceso Basado en Roles) | SEC-003 |
| JWT | JSON Web Token — Token de autenticación | SEC-002 |
| Hash | Algoritmo de hashing para contraseñas (bcrypt) | SEC-005 |
| Cifrado | Protección de datos con algoritmos criptográficos | SEC-005 |
| TLS | Transport Layer Security — Protocolo de transporte seguro | SEC-005 |
| Auditoría | Registro de acciones de usuarios en el sistema | SEC-004 |
| Log de Auditoría | Registro detallado de eventos de seguridad | SEC-004 |
| Contraseña | Credencial de autenticación del usuario | SEC-002 |
| Token | Credencial electrónica de sesión | SEC-002 |
| Permiso | Derecho específico de realizar una acción | SEC-003 |
| Rol | Conjunto de permisos asignados a un usuario | SEC-003 |

---

## 3. Términos Técnicos

| Término | Definición | Documento Fuente |
|---|---|---|
| ADR | Architecture Decision Record (Registro de Decisión Arquitectónica) | docs/08-adr/ |
| PWA | Progressive Web App (Aplicación Web Progresiva) | ARCH-004 |
| SPA | Single Page Application (Aplicación de Página Única) | ARCH-004 |
| REST | Representational State Transfer — Arquitectura de API | API-001 |
| ORM | Object-Relational Mapping (Mapeo Objeto-Relacional) | ARCH-004 |
| CRUD | Create, Read, Update, Delete (Crear, Leer, Actualizar, Eliminar) | API-001 |
| DTO | Data Transfer Object — Objeto de transferencia de datos | DEV-001 |
| Entity | Entidad JPA — Mapeo de tabla de base de datos | DEV-001 |
| Repository | Repositorio Spring Data — Capa de acceso a datos | DEV-001 |
| Service | Servicio Spring — Capa de lógica de negocio | DEV-001 |
| Controller | Controlador Spring — Capa de manejo de requests HTTP | DEV-001 |
| Endpoint | Punto de acceso de la API (URL + método HTTP) | API-002 |
| Request | Solicitud HTTP enviada al servidor | API-001 |
| Response | Respuesta HTTP del servidor | API-001 |
| Payload | Cuerpo de la solicitud HTTP (JSON) | API-001 |
| Query Parameter | Parámetro de URL para filtrado (?key=value) | API-001 |
| Path Parameter | Parámetro de URL para identificar recursos (/api/{id}) | API-001 |
| HTTP Status | Código de estado de la respuesta HTTP (200, 404, 500) | API-003 |
| CORS | Cross-Origin Resource Sharing | ARCH-001 |
| Connection Pool | Conjunto de conexiones reutilizables a la DB | ARCH-001 |
| HikariCP | Pool de conexiones por defecto en Spring Boot | ARCH-004 |
| Flyway | Herramienta de migración de base de datos | DB-003 |
| Migration | Script de cambios en la estructura de la DB | DB-003 |
| Seed | Script de datos iniciales (usuarios por defecto) | SEED-001 |
| Actuator | Módulo de Spring Boot para métricas y health checks | OPS-003 |
| Nginx | Servidor web reverso proxy | OPS-002 |
| Systemd | Sistema de gestión de servicios en Linux | OPS-002 |
| rclone | Herramienta de sincronización de archivos en la nube | SEC-006 |
| Let's Encrypt | Autoridad de certificados SSL gratuita | OPS-002 |
| Certbot | Cliente de Let's Encrypt para obtener certificados | OPS-002 |
| Logback | Framework de logging para Java | OPS-003 |
| Cron | Programador de tareas en Linux | OPS-003 |

---

## 4. Términos de Base de Datos

| Término | Definición | Documento Fuente |
|---|---|---|
| ERD | Entity Relationship Diagram (Diagrama Entidad-Relación) | DB-001 |
| Tabla | Estructura de almacenamiento de datos en MySQL | DB-001 |
| Columna | Campo de una tabla de base de datos | DB-001 |
| Primary Key | Clave primaria — Identificador único de una fila | DB-001 |
| Foreign Key | Clave foránea — Referencia a otra tabla | DB-001 |
| Índice | Estructura de optimización de consultas | DB-002 |
| Constraint | Restricción de integridad de datos | DB-002 |
| ENUM | Tipo de datos con valores predefinidos | DB-002 |
| JSON Column | Columna de tipo JSON para datos flexibles | DB-002 |
| Timestamp | Campo de fecha/hora de creación o actualización | DB-002 |
| Soft Delete | Eliminación lógica (estado = inactivo) | DB-002 |
| DDL | Data Definition Language (CREATE, ALTER, DROP) | DB-003 |
| DML | Data Manipulation Language (INSERT, UPDATE, DELETE) | DB-003 |
| Backup | Copia de seguridad de la base de datos | SEC-006 |
| Restore | Restauración de una copia de seguridad | SEC-006 |
| mysqldump | Herramienta de backup de MySQL | SEC-006 |

---

## 5. Términos de API

| Término | Definición | Documento Fuente |
|---|---|---|
| GET | Método HTTP para obtener recursos | API-001 |
| POST | Método HTTP para crear recursos | API-001 |
| PUT | Método HTTP para actualizar recursos completos | API-001 |
| PATCH | Método HTTP para actualizar parcialmente recursos | API-001 |
| DELETE | Método HTTP para eliminar recursos | API-001 |
| 200 OK | Respuesta exitosa | API-003 |
| 201 Created | Recurso creado exitosamente | API-003 |
| 400 Bad Request | Solicitud inválida (validación fallida) | API-003 |
| 401 Unauthorized | No autenticado (token faltante/inválido) | API-003 |
| 403 Forbidden | No autorizado (sin permisos) | API-003 |
| 404 Not Found | Recurso no encontrado | API-003 |
| 409 Conflict | Conflicto (dni duplicado, etc.) | API-003 |
| 422 Unprocessable | Entidad no procesable (datos inválidos) | API-003 |
| 429 Too Many Requests | Límite de solicitudes excedido | API-003 |
| 500 Internal Server Error | Error interno del servidor | API-003 |
| Pagination | Paginación de resultados (page, size) | API-001 |
| Filtering | Filtrado de resultados por parámetros | API-001 |
| Sorting | Ordenamiento de resultados | API-001 |
| Rate Limiting | Limitación de solicitudes por período | API-001 |
| Versioning | Versionado de API (v1, v2) | API-001 |
| Error Response | Formato estándar de errores | API-003 |
| Success Response | Formato estándar de respuestas exitosas | API-001 |

---

## 6. Términos de Documentación

| Término | Definición | Documento Fuente |
|---|---|---|
| Source of Truth | Autoridad canónica para un tema | GOV-001 |
| Document ID | Identificador permanente único de un documento | GOV-001 |
| Documentation Debt | Documentación obsoleta o incompleta | GOV-001 |
| Progressive Context Loading | Carga progresiva de contexto por relevancia | GOV-001 |
| Semantic Versioning | Formato de versión MAJOR.MINOR.PATCH | GOV-001 |
| Constitution | Documento principal de gobernanza (AGENT.md) | AGENT.md |
| Governance | Reglas y procesos de documentación | GOV-001 |
| Stakeholder | Persona con interés en el proyecto (doctora, enfermera) | PRD-001 |
| MVP | Minimum Viable Product (Producto Mínimo Viable) | PRD-003 |
| Sprint | Período de desarrollo (2 semanas) | PRD-003 |
| Epic | Grupo de historias de usuario relacionadas | PRD-003 |
| User Story | Requisito de usuario en formato "Como... quiero... para..." | PRD-001 |
| Acceptance Criteria | Condiciones que deben cumplirse para aceptar una tarea | PRD-001 |
| Definition of Done | Criterios de completitud de una tarea | GOV-001 |

---

## 7. Definiciones de Roles

### 7.1 Roles del Sistema

| Rol | Código | Descripción | Permisos |
|---|---|---|---|
| Admin | admin | Administrador del sistema | Acceso completo, gestión de usuarios |
| Doctora | doctora | Médico principal | Lectura/escrita de pacientes, consultas, historias |
| Enfermera | enfermera | Personal de enfermería | Lectura de pacientes, registro de signos vitales |

### 7.2 Roles de Documentación

| Rol | Código | Responsabilidad |
|---|---|---|
| Architecture | ARCH | Arquitecto de proyecto, decisiones técnicas |
| Domain Expert | DOM | Conocimiento del dominio médico |
| Security | SEC | Seguridad de la información |
| Database | DB | Diseño y administración de base de datos |
| API Lead | API | Diseño de endpoints REST |
| Development | DEV | Desarrollo de código |
| DevOps | OPS | Operaciones y despliegue |
| Product | PRD | Requisitos de producto |
| Documentation | GOV | Gobernanza de documentación |

---

## 8. Acrónimos

| Acrónimo | Significado |
|---|---|
| CRUD | Create, Read, Update, Delete |
| RBAC | Role-Based Access Control |
| JWT | JSON Web Token |
| PWA | Progressive Web App |
| SPA | Single Page Application |
| REST | Representational State Transfer |
| ORM | Object-Relational Mapping |
| DTO | Data Transfer Object |
| ERD | Entity Relationship Diagram |
| DDL | Data Definition Language |
| DML | Data Manipulation Language |
| SSL | Secure Sockets Layer |
| TLS | Transport Layer Security |
| CORS | Cross-Origin Resource Sharing |
| API | Application Programming Interface |
| HTTP | HyperText Transfer Protocol |
| HTTPS | HTTP Secure |
| VPS | Virtual Private Server |
| ADR | Architecture Decision Record |
| RPO | Recovery Point Objective |
| RTO | Recovery Time Objective |
| CI | Continuous Integration |
| CD | Continuous Deployment |
| DB | Database |
| ORM | Object-Relational Mapping |
| JPA | Java Persistence API |
| DDD | Domain-Driven Design |

---

## Glosario Relacionado

- **Lenguaje Ubicuo:** DOM-UL-001 (Dominio)
- **Decisiones de Negocio:** DOM-DEC-001
- **Arquitectura:** ARCH-001
