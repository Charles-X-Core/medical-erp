# Domain: Seguridad y Acceso

---
Document ID: DOM-SEG-001
Status: Draft
Version: 0.2.0
Owner: Domain
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [GOV-002, DOM-UL-001, PRD-002]
---

## 1. Objetivo

Controlar el acceso al sistema mediante autenticación y autorización. Definir quién puede hacer qué.

> **⚠️ SEGURIDAD CRÍTICA:** Esta aplicación es un sistema interno para la clínica.
> **NO EXISTE REGISTRO PÚBLICO.** Los usuarios son creados exclusivamente por el administrador.
> El primer usuario admin se crea via SQL seed script durante el despliegue.

## 2. Responsabilidades

- Autenticar usuarios (login/logout)
- Autorizar acciones por rol
- Gestionar usuarios (crear, actualizar, desactivar) - **Solo Admin**
- Gestionar roles y permisos
- Registrar eventos de seguridad

> **⚠️ REGLA:** NO hay endpoint de registro público. Los usuarios solo son creados por el admin.

## 3. Entidades

### 3.1 Usuario

| Atributo | Tipo | Requerido | Único | Descripción |
|---|---|---|---|---|
| id | Identificador Único | Sí | Sí | Identificador del usuario |
| nombre | Texto | Sí | No | Nombre completo |
| email | Texto | Sí | Sí | Correo electrónico (login) |
| password | Texto | Sí | No | Contraseña encriptada |
| rol | Rol | Sí | No | Rol asignado |
| activo | Booleano | No | No | Estado (default: true) |

### 3.2 Rol

| Atributo | Tipo | Requerido | Único | Descripción |
|---|---|---|---|---|
| id | Identificador Único | Sí | Sí | Identificador del rol |
| nombre | Texto | Sí | Sí | Nombre del rol |
| descripcion | Texto | No | No | Descripción del rol |

### 3.3 Permiso

| Atributo | Tipo | Requerido | Único | Descripción |
|---|---|---|---|---|
| id | Identificador Único | Sí | Sí | Identificador del permiso |
| nombre | Texto | Sí | Sí | Nombre del permiso |
| descripcion | Texto | No | No | Descripción del permiso |

## 4. Value Objects

### 4.1 Email

- Formato válido de correo electrónico
- Único en el sistema

### 4.2 Contraseña

- Mínimo 8 caracteres
- Al menos una mayúscula, una minúscula y un número
- Almacenada en texto encriptado

### 4.3 Rol

- Valores permitidos: `doctora`, `enfermera`, `admin`

## 5. Estados

### 5.1 Usuario

| Estado | Descripción |
|---|---|
| activo | Puede acceder al sistema |
| inactivo | No puede acceder al sistema |

## 6. Transiciones

```
activo → inactivo (desactivar)
inactivo → activar (activar)
```

## 7. Casos de Uso

| Caso de Uso | Actor | Descripción | Precondiciones |
|---|---|---|---|
| UC-SEG-001 | Cualquier usuario | Iniciar sesión | Usuario existe y está activo |
| UC-SEG-002 | Cualquier usuario | Cerrar sesión | Sesión activa |
| UC-SEG-003 | admin | Crear usuario | Autenticado como admin |
| UC-SEG-004 | admin | Listar usuarios | Autenticado como admin |
| UC-SEG-005 | admin | Actualizar usuario | Autenticado como admin |
| UC-SEG-006 | admin | Desactivar usuario | Autenticado como admin |
| UC-SEG-007 | admin | Activar usuario | Autenticado como admin |
| UC-SEG-008 | admin | Cambiar rol de usuario | Autenticado como admin |
| UC-SEG-009 | Cualquier usuario | Actualizar perfil propio | Autenticado |
| UC-SEG-010 | Cualquier usuario | Cambiar contraseña propia | Autenticado |
| ~~UC-SEG-011~~ | ~~Cualquier usuario~~ | ~~Registrarse~~ | ~~**ELIMINADO: No hay registro público**~~ |

> **⚠️ NOTA:** No existe caso de uso de registro público. Los usuarios son creados exclusivamente por el admin.

## 8. Reglas de Negocio

| Regla ID | Regla | Fuente | Tipo |
|---|---|---|---|
| BR-SEG-001 | La contraseña debe tener al menos 8 caracteres | Técnico | Técnico |
| BR-SEG-002 | El email debe ser único en el sistema | Técnico | Técnico |
| BR-SEG-003 | Solo un usuario puede tener el rol de admin | Técnico | Técnico |
| BR-SEG-004 | Un usuario no puede desactivarse a sí mismo | Técnico | Técnico |
| BR-SEG-005 | Los roles son: doctora, enfermera, admin | Técnico | Técnico |
| BR-SEG-006 | La sesión expira después de 30 minutos de inactividad | Técnico | Técnico |

## 9. Validaciones

### 9.1 Validaciones de Negocio

| Validación | Descripción | Mensaje de Error |
|---|---|---|
| VR-SEG-001 | Email único | "Ya existe un usuario con ese email" |
| VR-SEG-002 | Rol válido | "Rol no válido" |

### 9.2 Validaciones Técnicas

| Validación | Descripción | Mensaje de Error |
|---|---|---|
| VR-SEG-003 | Email formato válido | "Formato de email inválido" |
| VR-SEG-004 | Contraseña mínimo 8 caracteres | "La contraseña debe tener al menos 8 caracteres" |
| VR-SEG-005 | Contraseña alfanumérica | "La contraseña debe contener letras y números" |

## 10. Relaciones

| Entidad | Relación | Cardinalidad | Descripción |
|---|---|---|---|
| Usuario → Rol | N:1 | Un usuario tiene un rol | Cada usuario tiene un rol asignado |
| Rol → Permiso | N:N | Un rol tiene múltiples permisos | BUSINESS DECISION REQUIRED |

## 11. Permisos

| Rol | Crear | Leer | Actualizar | Eliminar | Especial |
|---|---|---|---|---|---|
| admin | Sí | Todos | Todos | Sí | Gestionar usuarios y roles |
| doctora | No | Propio | Propio | No | — |
| enfermera | No | Propio | Propio | No | — |

## 12. Auditoría

| Evento | Registrado | Campos |
|---|---|---|
| Login exitoso | Sí | usuario_id, email, timestamp, IP |
| Login fallido | Sí | email, timestamp, IP, razón |
| Logout | Sí | usuario_id, timestamp |
| Crear usuario | Sí | usuario_creado_id, admin_id, timestamp |
| Actualizar usuario | Sí | usuario_id, campos_cambiados, admin_id, timestamp |
| Desactivar usuario | Sí | usuario_id, admin_id, timestamp |
| Cambiar contraseña | Sí | usuario_id, timestamp |

## 13. Eventos

| Evento | Disparador | Datos |
|---|---|---|
| UsuarioCreado | Crear usuario | usuario_id, email, rol |
| UsuarioDesactivado | Desactivar usuario | usuario_id |
| SesionIniciada | Login | usuario_id, timestamp |
| SesionExpirada | Timeout | usuario_id, timestamp |
| ContrasenaCambiada | Cambiar contraseña | usuario_id |

## 14. Soft Delete

Los usuarios nunca se eliminan físicamente. Se marcan como `inactivo`.

## 15. Consideraciones Técnicas

- La contraseña debe estar encriptada con bcrypt
- El token JWT debe expirar después de 30 minutos
- Los refresh tokens deben estar soportados
- BUSINESS DECISION REQUIRED: ¿Se permiten múltiples sesiones activas?

## 16. Extensiones Futuras

- Autenticación con Google/Apple
- Autenticación de dos factores
- Gestión de sesiones activas
- Bloqueo de cuenta por intentos fallidos
- Políticas de contraseñas configurables

---

## Invariantes

| Invariante | Descripción |
|---|---|
| INV-SEG-001 | Un usuario debe tener un identificador único |
| INV-SEG-002 | Un usuario no puede existir sin un email |
| INV-SEG-003 | Un usuario no puede existir sin un nombre |
| INV-SEG-004 | Un usuario no puede existir sin un rol |
| INV-SEG-005 | Un usuario no puede tener más de un rol |
| INV-SEG-006 | Un usuario no puede desactivarse a sí mismo |

---

## Public Interface

El módulo de Seguridad y Acceso expone:

| Operación | Descripción |
|---|---|
| Autenticar | Validar credenciales y devolver token |
| Autorizar | Verificar si un usuario puede realizar una acción |
| Obtener usuario | Devolver información de un usuario |
| Obtener rol | Devolver permisos de un rol |
| Registrar evento | Guardar evento de auditoría |

---

## Domain Discovery Answers

| Pregunta | Respuesta |
|---|---|
| ¿Quién usa este módulo? | Todos los usuarios del sistema |
| ¿Qué problema resuelve? | Control de acceso y seguridad |
| ¿Qué información administra? | Usuarios, roles, permisos, sesiones |
| ¿Qué operaciones realiza? | Login, logout, gestionar usuarios |
| ¿Qué reglas tiene? | Contraseña segura, roles predefinidos |
| ¿Qué restricciones legales existen? | Protección de datos personales |
| ¿Qué auditoría necesita? | Logs de acceso y cambios |
| ¿Qué módulos dependen de él? | Todos los módulos |
| ¿De qué módulos depende? | Ninguno |
