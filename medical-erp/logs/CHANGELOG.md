# Changelog

---
Document ID: CHANGELOG
Status: Active
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-29
Source of Truth: true
---

## [1.8.0] - 2026-07-31

### Resumen
Seguridad ERP: OTP por Email (2FA) + Refresh Tokens. Flujo de login en dos pasos: credenciales → código OTP por email → JWT de 1 hora + refresh token de 7 días. Rate limiting por IP, máximo 3 intentos por código, reenvío cada 60 segundos.

### Código Implementado
| Componente | Archivos | Descripción |
|---|---|---|---|
| Entidad OtpCode | `OtpCode.java` | Tabla `otp_codes` (V10 migration) — email, código 6 dígitos, IP, UA, usado, intentos, expira |
| Repository | `OtpCodeRepository.java` | Queries por email reciente, cleanup expirados |
| DTOs OTP | `OtpStep1Request/Response`, `OtpStep2Request`, `ResendOtpRequest` | Validaciones Jakarta |
| Excepción | `OtpVerificationException.java` | Códigos de error: OTP_EXPIRED, OTP_INVALID, OTP_MAX_ATTEMPTS, etc. |
| Service OTP | `OtpService.java` | Generar 6 dígitos, validar (max 3 intentos), rate limit IP (5/hora), resend (60s), cleanup scheduled |
| Email OTP | `EmailService.java` | Método `sendOtpEmail()` — HTML con código grande, expiración, branding Optimal Health NOW |
| AuthService | `AuthService.java` | `loginStep1()` valida credenciales + envía OTP; `loginStep2()` valida OTP + emite JWT+refresh; `refreshToken()` emite nuevos tokens; legacy `login()` añade refresh token |
| AuthController | `AuthController.java` | Endpoints: `login-step1`, `login-step2`, `resend-otp`, `refresh` |
| JwtProperties | `JwtProperties.java` | Nuevo campo `refreshExpiration` (default 7 días) |
| JwtUtils | `JwtUtils.java` | `generateRefreshToken()` con claim `type=refresh`; `isRefreshToken()`; `isTokenValid()` rechaza refresh tokens como access tokens |
| LoginResponse | `LoginResponse.java` | Nuevo campo `refreshToken` |
| GlobalExceptionHandler | `GlobalExceptionHandler.java` | Handler para `OtpVerificationException` → 401 |
| Migration V10 | `V10__create_otp_codes.sql` | Tabla + índices email/expira, created_at |
| Config Dev | `application-dev.properties` | JWT 1h + refresh 7d; parámetros OTP (max-attempts=3, expiration=5min, resend=60s, ip-limit=5/hr) |

### Endpoints Implementados (OTP + Refresh)
| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| POST | `/api/v1/auth/login-step1` | **PÚBLICO** | Validar credenciales, generar y enviar OTP por email |
| POST | `/api/v1/auth/login-step2` | **PÚBLICO** | Validar OTP, emitir JWT (1h) + refresh token (7d) |
| POST | `/api/v1/auth/resend-otp` | **PÚBLICO** | Reenviar OTP (rate limit 60s) |
| POST | `/api/v1/auth/refresh` | **PÚBLICO** | Refrescar access token usando X-Refresh-Token header |

### Configuración de Sesión
| Token | Duración | Propósito |
|---|---|---|
| Access Token (JWT) | 1 hora | API calls cotidianos, expuesto en frontend |
| Refresh Token | 7 días | Mantener sesión sin re-login durante la semana laboral |

### Flujo de Autenticación OTP
```
Usuario ingresa email + password
  → POST /api/v1/auth/login-step1
    Backend valida credenciales con AuthenticationManager
    Genera código OTP aleatorio 6 dígitos
    Guarda en BD (email, código, expira 5 min, usado=false, intentos=0)
    Envía email HTML a Gmail con el código destacado
    ← Response: {message: "Código OTP enviado", email, expiresInMinutes: 5}

Usuario recibe email: "Tu código: 847291"
  → POST /api/v1/auth/login-step2 {email, codigo}
    Backend busca OTP activo por email
    Valida no expirado, no usado, intentos < 3
    Si correcto → marca usado=true, genera JWT + refresh token
    ← Response: {token, refreshToken, type: "Bearer", expiresIn: 3600, user}

Frontend guarda token + refreshToken
  → Usa token en Authorization: Bearer {token}
  → Cuando 401/403, POST /api/v1/auth/refresh con X-Refresh-Token
    ← Response: {token, refreshToken, ...} (nuevos tokens)
```

### Seguridad OTP
- Código: 6 dígitos aleatorios (000000-999999)
- Expiración: 5 minutos
- Máximo 3 intentos por código → luego requerir nuevo
- Reenvío: máximo 1 cada 60 segundos por email
- Rate limit por IP: 5 intentos de login por hora
- Códigos usados/expirados se limpian automáticamente cada 5 minutos (scheduled task)
- Códigos antiguos (>24h) se purgan automáticamente

### Tests Realizados
| Test | Resultado |
|---|---|
| login-step1 con credenciales válidas | ✅ 200 + OTP generado en BD |
| login-step2 con OTP correcto | ✅ 200 + JWT (1h) + refresh token (7d) |
| refresh token | ✅ 200 + nuevos tokens |
| login-step2 con OTP incorrecto | ✅ 401 OTP_NOT_FOUND (código usado previo) |
| login legacy | ✅ 200 + ahora incluye refreshToken |

## [1.7.0] - 2026-07-29

### Resumen
Conexión Landing Page ↔ Backend (Módulo Contacto). Formulario de contacto ahora envía mensajes reales al backend, almacena en BD, envía email de notificación a alonsopicho@gmail.com, incluye rate limiting anti-spam.

### Código Implementado
| Componente | Archivos | Descripción |
|---|---|---|---|
| Entidad MensajeContacto | `MensajeContacto.java` | Mapea tabla `mensajes_contacto` (V6 migration existente) |
| DTOs | `MensajeContactoRequest`, `MensajeContactoResponse` | Validaciones Jakarta (nombre/email/mensaje requeridos, max 1000 chars) |
| Mapper | `MensajeContactoMapper.java` | MapStruct |
| Repository | `MensajeContactoRepository.java` | Queries por estado, email, rate limiting count |
| EmailService | `EmailService.java` | Spring Mail `@Async` — notificación HTML a clínica |
| Service | `MensajeContactoService.java` | CRUD + rate limiting IP (5/hora) + email async |
| Controller | `MensajeContactoController.java` | 6 endpoints REST |
| CORS | `WebConfig.java` | Añadido `optimalhealthnowusa.com` y `erp.optimalhealthnowusa.com` |
| Main App | `MedicalErpApplication.java` | Añadido `@EnableAsync` |
| Dev Config | `application-dev.properties` | Gmail SMTP en vez de Mailtrap |
| Frontend API | `contactService.js` | Fetch POST a `/api/v1/contact` |
| Frontend UI | `Contact.jsx` | Estados: idle → loading → success/error. Spinner + mensajes |
| Frontend Styles | `_contact.scss` | Estilos `.contact-page__status` (success/error) + animación spin |

### Endpoints Implementados (Contacto)
| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| POST | `/api/v1/contact` | **PÚBLICO** | Enviar mensaje desde landing page |
| GET | `/api/v1/contact/messages` | ADMIN/ENFERMERA | Listar mensajes (filtro estado opcional) |
| GET | `/api/v1/contact/messages/{id}` | ADMIN/ENFERMERA | Ver mensaje |
| PATCH | `/api/v1/contact/messages/{id}/leido` | ADMIN/ENFERMERA | Marcar como leído |
| PATCH | `/api/v1/contact/messages/{id}/respondido` | ADMIN/ENFERMERA | Marcar como respondido |
| DELETE | `/api/v1/contact/messages/{id}` | ADMIN | Soft delete |

### Flujo Landing → Backend → Email
```
Usuario en optimalhealthnowusa.com/contact
  → Llena formulario (nombre, email, teléfono, mensaje)
  → React POST a http://localhost:8080/api/v1/contact (dev)
  
Backend (Spring Boot)
  → Valida datos (Jakarta Validation)
  → Verifica rate limiting por IP (máx 5/hora)
  → Guarda en tabla `mensajes_contacto` (estado="pendiente")
  → Dispara EmailService `@Async`
  → Envía email HTML a alonsopicho@gmail.com con datos del remitente
  → Retorna 201 Created con mensaje de éxito
```

### Configuración Email (Gmail)
- **Dev:** Gmail SMTP con `EMAIL_PASSWORD` (App Password de 16 chars)
- **Prod:** Gmail SMTP con `EMAIL_PASSWORD` variable de entorno
- **From:** `alonsopicho@gmail.com` (dev) / `${EMAIL_USER}` (prod)
- **To:** `alonsopicho@gmail.com` (configurable vía `app.contact.notification-email`)

### Notas
- Rate limiting en memoria (`ConcurrentHashMap`) — suficiente para MVP single-instance
- Email HTML incluye: nombre, email, teléfono, asunto, mensaje, IP, user-agent, fecha
- Reply-to configurado al email del remitente para responder directamente
- CORS actualizado para dominios de producción
- Frontend build: Vite production build exitoso
- Backend build: 99 archivos, JAR 67.6 MB, BUILD SUCCESS

---

## [1.6.0] - 2026-07-29

### Resumen
Implementación Fase 6 (Módulo Documentos + Firmas + PDF). Generación automática de PDFs con iText 7, firma digital visual (canvas Base64 desde PWA), hash SHA256 para integridad.

### Código Implementado
| Componente | Archivos | Descripción |
|---|---|---|---|
| Entidad Documento | `Documento.java` | Mapea tabla `documentos` (V4 migration) |
| DTOs | `DocumentoRequest`, `DocumentoResponse` | Validaciones Jakarta |
| Mapper | `DocumentoMapper.java` | MapStruct |
| Repository | `DocumentoRepository.java` | Queries por paciente, tipo, estado |
| PdfGeneratorService | `PdfGeneratorService.java` | iText 7: genera PDF con firma incrustada |
| DocumentoService | `DocumentoService.java` | CRUD + firmar + generar PDF + SHA256 |
| Controller | `DocumentoController.java` | 6 endpoints REST + descarga PDF |

### Endpoints Implementados (Fase 6)
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| POST | `/api/v1/documentos` | DOCTORA/ADMIN | Crear documento. Si `firmaImagen` presente → auto-genera PDF + firmado |
| GET | `/api/v1/documentos/{id}` | Todos autenticados | Obtener documento |
| GET | `/api/v1/documentos/paciente/{id}` | Todos autenticados | Listar por paciente (filtro tipo opcional) |
| GET | `/api/v1/documentos/{id}/pdf` | Todos autenticados | **Descargar PDF** (`Content-Type: application/pdf`) |
| PATCH | `/api/v1/documentos/{id}/firmar` | DOCTORA/ADMIN | Firmar borrador existente (envía `firmaImagen` base64) |
| DELETE | `/api/v1/documentos/{id}` | DOCTORA/ADMIN | Borrador: elimina. Firmado: archiva (`estado="archivado"`) |

### Flujo PWA → Backend
```
PWA (React Canvas)
  → Firma visual con mouse/dedo
  → Convierte a Base64 PNG
  → POST /api/v1/documentos
      { pacienteId, tipo:"consentimiento", titulo, firmaImagen:"data:image/png;base64,..." }
  
Backend (Spring Boot)
  → Recibe firma base64
  → Genera PDF con iText 7 (datos paciente + firma incrustada)
  → Calcula SHA256 del archivo
  → Guarda PDF en disco: ./uploads/pdfs/YYYY/MM/tipo_id.pdf
  → Estado = "firmado" (auto-archivado)
  → Retorna metadata incluyendo hash SHA256
```

### Notas
- PDF incluye: header clínica, datos paciente, texto según tipo (consentimiento/receta/informe), firma visual, fecha, footer legal
- iText 7 v7.2.5 ya estaba en `pom.xml` (AGENT.md)
- Ruta uploads configurable: `app.upload.dir=${UPLOAD_DIR:./uploads}`
- Documentos firmados no se eliminan físicamente; pasan a estado "archivado"

---

## [1.5.0] - 2026-07-29

### Resumen
Implementación Fase 5 (Módulo Historia Clínica + Consultas). CRUD completo con campos JSON (signos vitales, diagnósticos, plan de tratamiento), firma digital de consultas.

### Código Implementado
| Componente | Archivos | Descripción |
|---|---|---|
| Entidad HistoriaClinica | `HistoriaClinica.java` | Relación 1:1 con Paciente, campos médicos |
| Entidad Consulta | `Consulta.java` | Relación N:1 con Historia, campos JSON |
| Value Objects | `SignosVitales`, `Diagnostico`, `Medicamento`, `PlanTratamiento` | Tipos para DTOs |
| DTOs Historia | `HistoriaClinicaRequest`, `HistoriaClinicaResponse` | Validaciones Jakarta |
| DTOs Consulta | `ConsultaRequest`, `ConsultaResponse` | Con campos complejos JSON |
| Mappers | `HistoriaClinicaMapper`, `ConsultaMapper` | MapStruct + JSON helper |
| Repositories | `HistoriaClinicaRepository`, `ConsultaRepository` | Queries JPA |
| Services | `HistoriaClinicaService`, `ConsultaService` | Lógica de negocio + firma |
| Controllers | `HistoriaClinicaController`, `ConsultaController` | 10 endpoints REST |

### Endpoints Implementados (Fase 5)
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| POST | `/api/v1/historias` | DOCTORA/ADMIN | Crear historia clínica |
| GET | `/api/v1/historias/{id}` | DOCTORA/ENFERMERA/ADMIN | Obtener historia |
| GET | `/api/v1/historias/paciente/{id}` | DOCTORA/ENFERMERA/ADMIN | Historia por paciente |
| PUT | `/api/v1/historias/{id}` | DOCTORA/ADMIN | Actualizar historia |
| POST | `/api/v1/consultas` | DOCTORA/ADMIN | Crear consulta |
| GET | `/api/v1/consultas/{id}` | DOCTORA/ENFERMERA/ADMIN | Obtener consulta |
| GET | `/api/v1/consultas/historia/{id}` | DOCTORA/ENFERMERA/ADMIN | Listar por historia |
| PUT | `/api/v1/consultas/{id}` | DOCTORA/ADMIN | Actualizar (solo si no firmada) |
| DELETE | `/api/v1/consultas/{id}` | DOCTORA/ADMIN | Eliminar (solo si no firmada) |
| PATCH | `/api/v1/consultas/{id}/firmar` | DOCTORA/ADMIN | Firmar consulta |

### Notas
- Campos JSON (signos_vitales, diagnostico_lista, plan_tratamiento) se serializan/deserializan automáticamente
- Validación VR-CON-003: fecha no futura
- Consultas firmadas no pueden editarse ni eliminarse
- Historia clínica se crea automáticamente al crear paciente (pendiente integración)

---

## [1.4.2] - 2026-07-29

### Resumen
Correcciones menores de dominio (D) + Tests unitarios (C). 30 tests pasados, 100% éxito.

### Correcciones de Dominio (D)
| # | Regla | Implementación | Archivos |
|---|---|---|---|
| 7 | VR-PAC-004: DNI 8 dígitos exactos | `validarDocumento()` con regex `^[0-9]{8}$` | `PacienteService.java` |
| 8 | VR-PAC-005: CE 8-12 dígitos | regex `^[0-9]{8,12}$` | `PacienteService.java` |
| 9 | VR-PAC-006: Pasaporte 6-12 alfanuméricos | regex `^[A-Za-z0-9]{6,12}$` | `PacienteService.java` |
| 10 | VR-PAC-008: Fecha nacimiento no futura | `validarFechaNacimiento()` con `LocalDate.now()` | `PacienteService.java` |
| 11 | BR-AGE-003: No superposición disponibilidades | `validateNoOverlappingDisponibilidades()` O(n²) | `AgendaService.java` |
| 12 | BR-AGE-004: Bloqueo no superpone disponibilidad | `validateBloqueoVsDisponibilidad()` | `AgendaService.java` |

### Tests Unitarios (C)
| Suite | Tests | Cobertura |
|---|---|---|
| `PacienteServiceTest` | 11 | DNI format, duplicados, fecha futura, soft delete |
| `CitaServiceTest` | 12 | Máquina de estados (pendiente→confirmada→asistio→completada→cancelada), conflictos, fechas pasadas |
| `AgendaServiceTest` | 7 | Superposición disponibilidades, bloqueo vs disponibilidad, propiedad |
| **Total** | **30** | **BUILD SUCCESS** |

### Archivos Nuevos
- `PacienteServiceTest.java`
- `CitaServiceTest.java`
- `AgendaServiceTest.java`
- `application-test.properties` (config H2 para pruebas manuales)
- `TestDataInitializer.java` (seed data para perfil test)

---

## [1.4.1] - 2026-07-29

### Resumen
Correcciones post-análisis de conformidad documento-código. Se corrigieron 5 problemas bloqueantes identificados en revisión.

### Correcciones Realizadas
| # | Problema | Archivos Modificados | Estado |
|---|---|---|---|
| 1 | **Soft delete paciente** → Eliminación física cambiada a `estado="inactivo"` | `PacienteService.java` | ✅ Fix |
| 2 | **DNI duplicado sin tipo** → `existsByDniAndTipoDocumento` | `PacienteRepository.java`, `PacienteService.java` | ✅ Fix |
| 3 | **Enfermera excluida** de POST/PUT pacientes | `PacienteController.java` | ✅ Fix |
| 4 | **Ruta búsqueda** `/search` → `/buscar` (API-002) | `PacienteController.java` | ✅ Fix |
| 5 | **Cita completada sin consulta** → `consultaId` ahora es requerido | `CitaService.java`, `CitaController.java` | ✅ Fix |
| 6 | **Agenda sin validación de propiedad** → Solo propietario o admin pueden modificar | `AgendaService.java`, nuevo `SecurityUtils.java` | ✅ Fix |

### Archivos Nuevos
- `SecurityUtils.java` — Helper para extraer usuario autenticado del SecurityContext y validar propiedad de recursos

### Notas
- `SecurityUtils.validateOwnershipOrAdmin()` centraliza la validación de propiedad
- `getCurrentUserId()` busca usuario por email en el contexto de seguridad
- Admin puede crear/modificar cualquier agenda; doctora/enfermera solo la propia

---

## [1.4.0] - 2026-07-29

### Resumen
Implementación Fase 4 (Módulo Agenda y Citas). Agenda con disponibilidad/bloqueos, tipos de cita, CRUD de citas con máquina de estados (pendiente → confirmada → asistio → completada → cancelada).

### Código Implementado
| Componente | Archivos | Descripción |
|---|---|---|---|
| Entidades Agenda | Agenda, Disponibilidad, Bloqueo, TipoCita | DOM-AGE-001 |
| Entidad Cita | Cita.java | DOM-CIT-001 |
| Repositories | 5 repositories | Consultas JPA + búsqueda de conflictos |
| DTOs Agenda | 8 DTOs | Request/Response con validaciones |
| DTOs Cita | 2 DTOs | CitaRequest, CitaResponse |
| Mappers | AgendaMapper, TipoCitaMapper, CitaMapper | MapStruct |
| Services | AgendaService, CitaService | Lógica de negocio completa |
| Controllers | AgendaController, CitaController | 18 endpoints REST |

### Endpoints Implementados (Fase 4)
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| POST | /api/v1/agenda | DOCTORA/ENFERMERA/ADMIN | Crear agenda |
| GET | /api/v1/agenda/usuario/{id} | DOCTORA/ENFERMERA/ADMIN | Obtener agenda por usuario |
| PUT | /api/v1/agenda/{id}/disponibilidades | DOCTORA/ENFERMERA/ADMIN | Actualizar disponibilidades |
| POST | /api/v1/agenda/{id}/bloqueos | DOCTORA/ENFERMERA/ADMIN | Crear bloqueo |
| GET | /api/v1/agenda/{id}/bloqueos | DOCTORA/ENFERMERA/ADMIN | Listar bloqueos |
| DELETE | /api/v1/agenda/bloqueos/{id} | DOCTORA/ENFERMERA/ADMIN | Eliminar bloqueo |
| POST | /api/v1/agenda/tipos | ADMIN | Crear tipo de cita |
| GET | /api/v1/agenda/tipos | Todos autenticados | Listar tipos de cita |
| GET | /api/v1/agenda/tipos/{id} | Todos autenticados | Obtener tipo de cita |
| PUT | /api/v1/agenda/tipos/{id} | ADMIN | Actualizar tipo de cita |
| DELETE | /api/v1/agenda/tipos/{id} | ADMIN | Eliminar (soft) tipo de cita |
| POST | /api/v1/citas | DOCTORA/ENFERMERA/ADMIN | Crear cita |
| GET | /api/v1/citas | DOCTORA/ENFERMERA/ADMIN | Listar citas (filtros fecha/estado) |
| GET | /api/v1/citas/{id} | DOCTORA/ENFERMERA/ADMIN | Obtener cita |
| GET | /api/v1/citas/hoy | DOCTORA/ENFERMERA/ADMIN | Citas de hoy |
| GET | /api/v1/citas/proximas | DOCTORA/ENFERMERA/ADMIN | Citas próximas |
| PUT | /api/v1/citas/{id} | DOCTORA/ENFERMERA/ADMIN | Actualizar cita |
| PATCH | /api/v1/citas/{id}/confirmar | DOCTORA/ENFERMERA/ADMIN | Confirmar cita |
| PATCH | /api/v1/citas/{id}/asistencia | DOCTORA/ENFERMERA/ADMIN | Registrar asistencia |
| PATCH | /api/v1/citas/{id}/completar | DOCTORA/ADMIN | Completar cita |
| PATCH | /api/v1/citas/{id}/cancelar | DOCTORA/ENFERMERA/ADMIN | Cancelar cita |

### Notas
- Máquina de estados completa con validaciones de transición (BusinessRuleException)
- Detección de conflictos de citas por usuario/fecha/hora
- Validación de citas en el pasado
- Tipos de cita con soft delete (activo=false)

---

## [1.3.0] - 2026-07-29

### Resumen
Implementación Fase 3 (Módulo Pacientes). CRUD completo con búsqueda, 16 atributos, validaciones.

### Código Implementado
| Componente | Archivos | Descripción |
|---|---|---|
| Entidad | Paciente.java | 16+ atributos según DOM-PAC-001 |
| Repository | PacienteRepository.java | CRUD + búsqueda por nombre/DNI |
| DTOs | PacienteRequest, PacienteResponse | Validaciones Jakarta |
| Mapper | PacienteMapper.java | MapStruct |
| Service | PacienteService.java | CRUD + búsqueda + validación DNI único |
| Controller | PacienteController.java | 7 endpoints REST |

### Endpoints Implementados (Fase 3)
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| POST | /api/v1/pacientes | DOCTORA/ADMIN | Crear paciente |
| GET | /api/v1/pacientes | DOCTORA/ENFERMERA/ADMIN | Listar paginado |
| GET | /api/v1/pacientes/{id} | DOCTORA/ENFERMERA/ADMIN | Obtener paciente |
| PUT | /api/v1/pacientes/{id} | DOCTORA/ADMIN | Actualizar paciente |
| DELETE | /api/v1/pacientes/{id} | DOCTORA/ADMIN | Eliminar paciente |
| GET | /api/v1/pacientes/search?q= | DOCTORA/ENFERMERA/ADMIN | Buscar por nombre/DNI |
| GET | /api/v1/pacientes/estado/{estado} | DOCTORA/ENFERMERA/ADMIN | Filtrar por estado |

### Notas
- Búsqueda insensible a mayúsculas/minúsculas
- Validación de DNI único al crear y actualizar
- Auditoría automática vía @Auditable en create/update/delete

---

## [1.2.0] - 2026-07-29

### Resumen
Implementación Fase 1 (Infraestructura Backend) y Fase 2 (Módulo Seguridad). Spring Boot 3.x + Java 21 + JWT + RBAC completo.

### Código Implementado
| Componente | Archivos | Descripción |
|---|---|---|
| Infraestructura | pom.xml, application*.properties | Maven, config por perfil |
| Base de datos | V1-V8 migrations | 16 tablas + seed admin |
| Clases base | ApiResponse, GlobalExceptionHandler | Respuesta estándar, manejo de errores |
| JWT | JwtUtils, JwtProperties, JwtAuthenticationFilter | Generación, validación, filtro |
| Auth | AuthService, AuthController | Login, obtener usuario actual |
| Usuarios | UsuarioController, UsuarioService | CRUD admin-only |
| Entidades | Usuario, Rol, Permiso | JPA + @ManyToMany |
| Seguridad | SecurityConfig, CustomUserDetailsService | BCrypt, RBAC, CORS |
| Auditoría | AuditAspect, @Auditable | Logueo automático de modificaciones |

### Endpoints Implementados
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| POST | /api/v1/auth/login | Público | Login + JWT |
| GET | /api/v1/auth/me | Autenticado | Usuario actual |
| POST | /api/v1/users | Admin | Crear usuario |
| GET | /api/v1/users | Admin | Listar usuarios |
| GET | /api/v1/users/{id} | Admin | Obtener usuario |
| PUT | /api/v1/users/{id} | Admin | Actualizar usuario |
| DELETE | /api/v1/users/{id} | Admin | Eliminar usuario |
| PATCH | /api/v1/users/{id}/activate | Admin | Activar usuario |
| PATCH | /api/v1/users/{id}/deactivate | Admin | Desactivar usuario |
| PATCH | /api/v1/users/{id}/reset-password | Admin | Restablecer contraseña |

### Notas
- Sin registro público (SEC-002): solo admin crea usuarios
- Contraseña por defecto: Admin123 (debe cambiarse inmediatamente)
- JWT expira en 24 horas
- Próxima fase: Módulo Pacientes (CRUD completo)

---

## [1.1.0] - 2026-07-29

### Resumen
Completada documentación de dominio, seguridad, base de datos, API, desarrollo, despliegue y referencia. Actualizados Agent Guides con contenido real. Documentos principales promovidos a Status "Approved".

### Documentos Afectados
| Document ID | Cambio |
|---|---|
| CONSTITUTION | Status: Draft → Approved, Version: 0.1.0 → 1.0.0 |
| GOV-002 | Status: Draft → Approved, Version: 0.2.0 → 1.0.0 |
| DOM-UL-001 | Status: Draft → Approved, Version: 0.1.0 → 1.0.0 |
| DOM-AGE-001 | Status: Draft → Approved, Version: 0.1.0 → 1.0.0 |
| DOM-CON-001 | Status: Draft → Approved, Version: 0.1.0 → 1.0.0 |
| DOM-HCL-001 | Status: Draft → Approved, Version: 0.1.0 → 1.0.0 |
| DB-PAC-001 | Status: Draft → Approved, Version: 0.1.0 → 1.0.0 |
| AGT-WF | Status: Draft → Approved, Version: 0.1.0 → 1.0.0 |
| AGT-BE | Completado con contenido real (patrones, reglas, tareas) |
| AGT-FE | Completado con contenido real (PWA, design system, tareas) |
| AGT-SEC | Completado con contenido real (checklist, reglas, tareas) |
| AGT-DB | Completado con contenido real (migraciones, convenciones, tareas) |
| AGT-OPS | Completado con contenido real (deployment, backup, monitoring) |
| AGT-CON | Completado con contenido real (Java, Spring Boot, SQL conventions) |
| AGT-CR | Completado con contenido real (12 secciones de code review) |
| AGT-PRM | Completado con contenido real (prompt patterns, anti-patterns) |
| AGT-CK | Completado con contenido real (6 checklists operacionales) |
| AGT-LOG | Completado con contenido real (logging, progress, session summary) |
| AGT-DEC | Completado con contenido real (ADR format, lifecycle, process) |

### Módulos Afectados
| Módulo | Impacto |
|---|---|
| Documentation | Documentos principales promovidos a Approved |
| Agent Guides | 12 archivos completados con contenido real |
| Domain | 6 documentos de dominio actualizados a v1.0.0 |

### Breaking Changes
Ninguno

### Migraciones
Ninguna

### Notas
- Todos los Agent Guides (.agent/) ahora tienen contenido completo y funcional
- Documentos de dominio principales promovidos de Draft a Approved
- Constitución del proyecto (AGENT.md) promovida a v1.0.0 Approved
- Siguiente paso: Implementación del código (backend Spring Boot + frontend React PWA)

---

## [0.1.0] - 2026-07-28

### Resumen
Initial project documentation structure.

### Documentos Afectados
| Document ID | Cambio |
|---|---|
| CONSTITUTION | Created |
| GOV-001 | Created |
| PRD-001 | Created |
| PRD-002 | Created |
| PRD-003 | Created |
| ARCH-001 | Created |
| ARCH-002 | Created |
| ARCH-003 | Created |
| ARCH-004 | Created |
| DOM-PAT-001 | Created |
| DOM-HCL-001 | Created |
| DOM-CON-001 | Created |
| DOM-CIT-001 | Created |
| DOM-DOC-001 | Created |
| DOM-CON-002 | Created |
| SEC-001 | Created |
| SEC-002 | Created |
| SEC-003 | Created |
| SEC-004 | Created |
| SEC-005 | Created |
| SEC-006 | Created |
| DB-001 | Created |
| DB-002 | Created |
| DB-003 | Created |
| API-001 | Created |
| API-002 | Created |
| API-003 | Created |
| DEV-001 | Created |
| DEV-002 | Created |
| DEV-003 | Created |
| OPS-001 | Created |
| OPS-002 | Created |
| OPS-003 | Created |
| REF-001 | Created |
| REF-002 | Created |
| REF-003 | Created |
| REF-004 | Created |
| REF-005 | Created |
| REF-006 | Created |
| ADR-IDX | Created |
| AGT-WF | Created |
| AGT-BE | Created |
| AGT-DB | Created |
| AGT-FE | Created |
| AGT-SEC | Created |
| AGT-OPS | Created |
| AGT-CON | Created |
| AGT-PRM | Created |
| AGT-CR | Created |
| AGT-CK | Created |
| AGT-LOG | Created |
| AGT-DEC | Created |

### Módulos Afectados
| Módulo | Impacto |
|---|---|
| Documentation | Initial structure created |

### Breaking Changes
Ninguno

### Migraciones
Ninguna

### Notas
Initial documentation structure established.

---

## [1.0.0] - 2026-07-28

### Resumen
Documentation infrastructure frozen as v1.0.

### Documentos Afectados
| Document ID | Cambio |
|---|---|
| CONSTITUTION | Updated Owner, Status, Versioning, Reference Style; added GOV-001 reference |
| GOV-001 | Added Owner catalog, Status lifecycle, Versioning Policy, Reference Style, Infrastructure Freeze, Deprecation Policy, Prefix Registry, Project Focus |
| ADR-0001 | Moved from logs/decisions/ |
| ADR-0002 | Moved from logs/decisions/ |
| ADR-0003 | Moved from logs/decisions/ |
| ADR-0004 | Moved from logs/decisions/ |
| ADR-IDX | Updated index |
| AGT-WF | Updated workflow |
| Logs decisions README | Created for operational decisions |
| All docs/ | Removed TODOs, corrected language |

### Módulos Afectados
| Módulo | Impacto |
|---|---|
| Documentation | Complete restructuring |

### Breaking Changes
- Templates changed (document-template → feature-template, etc.)
- Owner catalog formalized (10 fixed values)
- Status cycle expanded (6 states)
- Reference style formalized (always by Document ID)
- Prefix registry frozen (12 fixed prefixes)

### Migraciones
- Move ADRs from logs/decisions/ to docs/08-adr/
- Delete obsolete templates
- Create new templates
- Update Status of all documents

### Notas
- Documentation infrastructure frozen as v1.0
- Structural changes require ADR
- Effort must focus on developing Medical ERP
