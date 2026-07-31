# Domain: Agenda

---
Document ID: DOM-AGE-001
Status: Approved
Version: 1.0.0
Owner: Domain
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: true
Depends On: [GOV-002, DOM-UL-001, DOM-SEG-001, PRD-002]
---

## 1. Objetivo

Definir la disponibilidad horaria de los usuarios para la programación de citas.

## 2. Responsabilidades

- Definir horarios de disponibilidad por usuario
- Gestionar bloqueos de tiempo
- Configurar duración predeterminada de citas
- Definir tipos de cita disponibles

## 3. Entidades

### 3.1 Agenda

| Atributo | Tipo | Requerido | Único | Descripción |
|---|---|---|---|---|
| id | Identificador Único | Sí | Sí | Identificador de la agenda |
| usuario_id | Identificador Único | Sí | No | → Usuario propietario |
| nombre | Texto | Sí | No | Nombre de la agenda |

### 3.2 Disponibilidad

| Atributo | Tipo | Requerido | Único | Descripción |
|---|---|---|---|---|
| id | Identificador Único | Sí | Sí | Identificador de la disponibilidad |
| agenda_id | Identificador Único | Sí | No | → Agenda |
| dia_semana | Número | Sí | No | 0=domingo, 1=lunes, ..., 6=sábado |
| hora_inicio | Hora | Sí | No | Hora de inicio |
| hora_fin | Hora | Sí | No | Hora de fin |

### 3.3 Bloqueo

| Atributo | Tipo | Requerido | Único | Descripción |
|---|---|---|---|---|
| id | Identificador Único | Sí | Sí | Identificador del bloqueo |
| agenda_id | Identificador Único | Sí | No | → Agenda |
| fecha_inicio | Fecha/Hora | Sí | No | Inicio del bloqueo |
| fecha_fin | Fecha/Hora | Sí | No | Fin del bloqueo |
| motivo | Texto | No | No | Razón del bloqueo |

### 3.4 Tipo de Cita

| Atributo | Tipo | Requerido | Único | Descripción |
|---|---|---|---|---|
| id | Identificador Único | Sí | Sí | Identificador del tipo |
| nombre | Texto | Sí | Sí | Nombre del tipo |
| duracion_minutos | Número | Sí | No | Duración en minutos |
| descripcion | Texto | No | No | Descripción del tipo |

## 4. Value Objects

### 4.1 DiaSemana

- Valores: 0 (domingo), 1 (lunes), 2 (martes), 3 (miércoles), 4 (jueves), 5 (viernes), 6 (sábado)

### 4.2 Hora

- Formato: HH:MM
- Rango: 00:00 a 23:59

### 4.3 Duracion

- Mínimo: 15 minutos
- Máximo: 480 minutos (8 horas)
- Default: 30 minutos

## 5. Estados

No aplica. Las entidades de Agenda no tienen estados.

## 6. Transiciones

No aplica.

## 7. Casos de Uso

| Caso de Uso | Actor | Descripción | Precondiciones |
|---|---|---|---|
| UC-AGE-001 | doctora/enfermera | Crear agenda propia | Autenticado |
| UC-AGE-002 | doctora/enfermera | Definir disponibilidad | Agenda propia existe |
| UC-AGE-003 | doctora/enfermera | Bloquear horario | Agenda propia existe |
| UC-AGE-004 | doctora/enfermera | Desbloquear horario | Bloqueo existe |
| UC-AGE-005 | doctora/enfermera | Configurar tipos de cita | Autenticado |
| UC-AGE-006 | doctora/enfermera | Ver disponibilidad | Autenticado |
| UC-AGE-007 | doctora/enfermera | Ver bloqueos | Autenticado |

## 8. Reglas de Negocio

| Regla ID | Regla | Fuente | Tipo |
|---|---|---|---|
| BR-AGE-001 | Cada usuario tiene una sola agenda | Técnico | Técnico |
| BR-AGE-002 | La hora de fin debe ser posterior a la hora de inicio | Técnico | Técnico |
| BR-AGE-003 | No se pueden crear disponibilidades superpuestas | Técnico | Técnico |
| BR-AGE-004 | Los bloqueos no pueden superponerse con disponibilidad | Técnico | Técnico |
| BR-AGE-005 | La duración mínima de cita es 15 minutos | BUSINESS DECISION REQUIRED | Negocio |
| BR-AGE-006 | La duración máxima de cita es 480 minutos | BUSINESS DECISION REQUIRED | Negocio |
| BR-AGE-007 | BUSINESS DECISION REQUIRED: ¿Se permiten agendas compartidas? | BUSINESS DECISION REQUIRED | Negocio |

## 9. Validaciones

### 9.1 Validaciones de Negocio

| Validación | Descripción | Mensaje de Error |
|---|---|---|
| VR-AGE-001 | Hora fin > Hora inicio | "La hora de fin debe ser posterior a la hora de inicio" |
| VR-AGE-002 | No superposición de disponibilidades | "Ya existe disponibilidad en ese horario" |
| VR-AGE-003 | No superposición de bloqueos | "Ya existe un bloqueo en ese horario" |

### 9.2 Validaciones Técnicas

| Validación | Descripción | Mensaje de Error |
|---|---|---|
| VR-AGE-004 | Día de semana válido (0-6) | "Día de semana inválido" |
| VR-AGE-005 | Hora formato válido | "Formato de hora inválido" |
| VR-AGE-006 | Duración en rango válido | "La duración debe estar entre 15 y 480 minutos" |

## 10. Relaciones

| Entidad | Relación | Cardinalidad | Descripción |
|---|---|---|---|
| Agenda → Usuario | 1:1 | Una agenda pertenece a un usuario | Cada usuario tiene una agenda |
| Disponibilidad → Agenda | N:1 | Una disponibilidad pertenece a una agenda | Una agenda tiene múltiples disponibilidades |
| Bloqueo → Agenda | N:1 | Un bloqueo pertenece a una agenda | Una agenda tiene múltiples bloqueos |
| Tipo de Cita | Independiente | — | No depende de otras entidades |

## 11. Permisos

| Rol | Crear | Leer | Actualizar | Eliminar | Especial |
|---|---|---|---|---|---|
| admin | Sí | Todas | Todas | Sí | Gestionar cualquier agenda |
| doctora | Sí | Propia | Propia | No | — |
| enfermera | Sí | Propia | Propia | No | — |

## 12. Auditoría

| Evento | Registrado | Campos |
|---|---|---|
| Crear agenda | Sí | agenda_id, usuario_id, timestamp |
| Actualizar disponibilidad | Sí | agenda_id, cambios, timestamp |
| Crear bloqueo | Sí | bloqueo_id, agenda_id, fecha_inicio, fecha_fin, timestamp |
| Eliminar bloqueo | Sí | bloqueo_id, agenda_id, timestamp |

## 13. Eventos

| Evento | Disparador | Datos |
|---|---|---|
| AgendaCreada | Crear agenda | agenda_id, usuario_id |
| DisponibilidadActualizada | Actualizar disponibilidad | agenda_id, dia_semana |
| BloqueoCreado | Crear bloqueo | bloqueo_id, agenda_id, fechas |
| BloqueoEliminado | Eliminar bloqueo | bloqueo_id, agenda_id |

## 14. Soft Delete

No aplica. Las entidades de Agenda no se eliminan.

## 15. Consideraciones Técnicas

- BUSINESS DECISION REQUIRED: ¿Las agendas deben ser configurables por día específico o por patrón semanal?
- BUSINESS DECISION REQUIRED: ¿Se permiten múltiples rangos de disponibilidad por día?
- BUSINESS DECISION REQUIRED: ¿Los bloqueos pueden ser recurrentes?

## 16. Extensiones Futuras

- Bloqueos recurrentes (cada lunes, etc.)
- Horarios especiales (feriados, vacaciones)
- Integración con calendario externo (Google Calendar)
- Notificaciones de disponibilidad

---

## Invariantes

| Invariante | Descripción |
|---|---|
| INV-AGE-001 | Una agenda debe tener un identificador único |
| INV-AGE-002 | Una agenda debe pertenecer a un usuario |
| INV-AGE-003 | Una disponibilidad debe tener hora de inicio y fin |
| INV-AGE-004 | La hora de fin debe ser posterior a la hora de inicio |
| INV-AGE-005 | No pueden existir disponibilidades superpuestas en la misma agenda |

---

## Public Interface

El módulo de Agenda expone:

| Operación | Descripción |
|---|---|
| Obtener agenda | Devolver la agenda de un usuario |
| Obtener disponibilidad | Devolver disponibilidad de una agenda |
| Obtener bloqueos | Devolver bloqueos de una agenda |
| Verificar disponibilidad | Verificar si un horario está disponible |
| Obtener tipos de cita | Devolver tipos de cita configurados |

---

## Domain Discovery Answers

| Pregunta | Respuesta |
|---|---|
| ¿Quién usa este módulo? | Doctora, Enfermera |
| ¿Qué problema resuelve? | Definir cuándo están disponibles para citas |
| ¿Qué información administra? | Disponibilidad, bloqueos, tipos de cita |
| ¿Qué operaciones realiza? | Configurar disponibilidad, bloquear horarios |
| ¿Qué reglas tiene? | No superposición, duración mínima/máxima |
| ¿Qué restricciones legales existen? | Ninguna específica |
| ¿Qué auditoría necesita? | Cambios en disponibilidad y bloqueos |
| ¿Qué módulos dependen de él? | Citas |
| ¿De qué módulos depende? | Seguridad (Usuarios) |
