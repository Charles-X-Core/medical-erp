# Domain: Contacto Landing

---
Document ID: DOM-CON-002
Status: Draft
Version: 1.0.0
Owner: Domain
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [GOV-002, DOM-UL-001, PRD-002]
---

## 1. Objetivo

Recibir mensajes de contacto del público a través de la landing page, almacenarlos para seguimiento y notificar a la clínica por email.

## 2. Responsabilidades

- Recibir mensajes de contacto del formulario público
- Almacenar mensajes en la base de datos
- Enviar notificación por email a la clínica
- Gestionar el estado de los mensajes
- Prevenir spam y abuso

## 3. Entidades

### 3.1 MensajeContacto

| Atributo | Tipo | Requerido | Único | Descripción |
|---|---|---|---|---|
| id | Identificador Único | Sí | Sí | Identificador del mensaje |
| nombre | Texto | Sí | No | Nombre del remitente |
| email | Texto | Sí | No | Email del remitente |
| telefono | Texto | No | No | Teléfono del remitente |
| asunto | Texto | No | No | Asunto del mensaje |
| mensaje | Texto largo | Sí | No | Contenido del mensaje |
| estado | Texto | No | No | Estado del mensaje |
| ip_address | Texto | No | No | IP del remitente (anti-spam) |
| created_at | Fecha/Hora | Sí | No | Fecha de creación |
| read_at | Fecha/Hora | No | No | Fecha de lectura |
| replied_at | Fecha/Hora | No | No | Fecha de respuesta |

## 4. Value Objects

### 4.1 Email

- Formato válido de correo electrónico
- Usado para notificaciones

### 4.2 Telefono

- Formato: números, espacios, guiones, paréntesis
- Opcional

### 4.3 EstadoMensaje

- pendiente: Mensaje nuevo, no leído
- leído: Mensaje visto por la clínica
- respondido: Mensaje respondido

## 5. Estados

| Estado | Descripción |
|---|---|
| pendiente | Mensaje nuevo, esperando lectura |
| leído | Mensaje visto por la clínica |
| respondido | Mensaje respondido por la clínica |

## 6. Transiciones

```
pendiente → leído (marcar como leído)
leído → respondido (responder)
```

## 7. Casos de Uso

| Caso de Uso | Actor | Descripción | Precondiciones |
|---|---|---|---|
| UC-CON-001 | Público | Enviar mensaje de contacto | Ninguna |
| UC-CON-002 | admin/enfermera | Listar mensajes | Autenticado |
| UC-CON-003 | admin/enfermera | Ver mensaje | Autenticado, mensaje existe |
| UC-CON-004 | admin/enfermera | Marcar como leído | Autenticado, estado pendiente |
| UC-CON-005 | admin/enfermera | Marcar como respondido | Autenticado, estado leído |
| UC-CON-006 | admin/enfermera | Eliminar mensaje | Autenticado, mensaje existe |

## 8. Reglas de Negocio

| Regla ID | Regla | Fuente | Tipo |
|---|---|---|---|
| BR-CON-001 | El email es requerido | Técnico | Técnico |
| BR-CON-002 | El mensaje es requerido | Técnico | Técnico |
| BR-CON-003 | El mensaje máximo tiene 1000 caracteres | Técnico | Técnico |
| BR-CON-004 | Se envía email de notificación al recibir mensaje | Técnico | Técnico |
| BR-CON-005 | Se guarda la IP del remitente | Técnico | Técnico |
| BR-CON-006 | Rate limiting: máximo 5 mensajes por IP por hora | Técnico | Técnico |

## 9. Validaciones

### 9.1 Validaciones de Negocio

| Validación | Descripción | Mensaje de Error |
|---|---|---|
| VR-CON-001 | Email requerido | "El email es obligatorio" |
| VR-CON-002 | Mensaje requerido | "El mensaje es obligatorio" |
| VR-CON-003 | Mensaje máximo 1000 caracteres | "El mensaje no puede exceder 1000 caracteres" |

### 9.2 Validaciones Técnicas

| Validación | Descripción | Mensaje de Error |
|---|---|---|
| VR-CON-004 | Email formato válido | "Formato de email inválido" |
| VR-CON-005 | Nombre máximo 255 caracteres | "El nombre no puede exceder 255 caracteres" |
| VR-CON-006 | Rate limiting | "Demasiados mensajes. Intente más tarde." |

## 10. Relaciones

| Entidad | Relación | Cardinalidad | Descripción |
|---|---|---|---|
| MensajeContacto | Independiente | — | No depende de otros módulos |

## 11. Permisos

| Rol | Crear | Leer | Actualizar | Eliminar | Especial |
|---|---|---|---|---|---|
| público | Sí | No | No | No | Enviar mensaje |
| admin | No | Todos | Todos | Sí | — |
| doctora | No | Todos | No | No | Solo ver |
| enfermera | No | Todos | Todos | No | Marcar leído/respondido |

## 12. Auditoría

| Evento | Registrado | Campos |
|---|---|---|
| Mensaje recibido | Sí | mensaje_id, email, ip_address, timestamp |
| Email enviado | Sí | mensaje_id, timestamp, status |
| Mensaje leído | Sí | mensaje_id, usuario_id, timestamp |
| Mensaje respondido | Sí | mensaje_id, usuario_id, timestamp |

## 13. Eventos

| Evento | Disparador | Datos |
|---|---|---|
| MensajeRecibido | Enviar mensaje | mensaje_id, email, nombre |
| EmailEnviado | Enviar email | mensaje_id, status |
| MensajeLeido | Marcar leído | mensaje_id, usuario_id |
| MensajeRespondido | Marcar respondido | mensaje_id, usuario_id |

## 14. Soft Delete

Los mensajes nunca se eliminan físicamente. Se pueden marcar como eliminados para limpieza visual, pero se conservan en la base de datos.

## 15. Consideraciones Técnicas

- Rate limiting por IP para prevenir spam
- Validación de email antes de guardar
- Envío de email asíncrono (no bloquear respuesta HTTP)
- Considerar CAPTCHA para prevenir bots
- Almacenar IP para auditoría y anti-spam

## 16. Extensiones Futuras

- Respuesta automática de confirmación al remitente
- Categorización de mensajes (consulta, cita, otro)
- Integración con sistema de tickets
- Respuesta directa desde el sistema
- Estadísticas de mensajes (por día, semana, mes)

---

## Invariantes

| Invariante | Descripción |
|---|---|
| INV-CON-001 | Un mensaje debe tener un identificador único |
| INV-CON-002 | Un mensaje debe tener un email válido |
| INV-CON-003 | Un mensaje debe tener contenido |
| INV-CON-004 | Un mensaje no puede exceder 1000 caracteres |
| INV-CON-005 | Un mensaje nuevo debe tener estado "pendiente" |

---

## Public Interface

El módulo de Contacto Landing expone:

| Operación | Descripción |
|---|---|
| Enviar mensaje | Recibir y almacenar mensaje de contacto |
| Obtener mensajes | Devolver lista de mensajes |
| Obtener mensaje | Devolver un mensaje específico |
| Marcar como leído | Cambiar estado a leído |
| Marcar como respondido | Cambiar estado a respondido |
| Eliminar mensaje | Eliminar un mensaje |

---

## Domain Discovery Answers

| Pregunta | Respuesta |
|---|---|
| ¿Quién usa este módulo? | Público (enviar), Admin/Enfermera (leer) |
| ¿Qué problema resuelve? | Recibir consultas del público de forma estructurada |
| ¿Qué información administra? | Mensajes de contacto, estados, notificaciones |
| ¿Qué operaciones realiza? | Enviar, listar, leer, marcar estado |
| ¿Qué reglas tiene? | Email requerido, max 1000 chars, rate limiting |
| ¿Qué restricciones legales existen? | Protección de datos del remitente |
| ¿Qué auditoría necesita? | Mensajes recibidos, emails enviados |
| ¿Qué módulos dependen de él? | Ninguno |
| ¿De qué módulos depende? | Ninguno (módulo independiente) |
