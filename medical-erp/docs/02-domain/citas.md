# Domain: Citas

---
Document ID: DOM-CIT-001
Status: Draft
Version: 0.1.0
Owner: Domain
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [GOV-002, DOM-UL-001, DOM-SEG-001, DOM-AGE-001, DOM-PAC-001, PRD-002]
---

## 1. Objetivo

Administrar las citas médicas entre la clínica y los pacientes.

## 2. Responsabilidades

- Reservar citas
- Confirmar asistencia
- Reprogramar citas
- Cancelar citas
- Registrar inasistencia (No Show)
- Vincular citas con consultas

## 3. Entidades

### 3.1 Cita

| Atributo | Tipo | Requerido | Único | Descripción |
|---|---|---|---|---|
| id | Identificador Único | Sí | Sí | Identificador de la cita |
| paciente_id | Identificador Único | Sí | No | → Paciente |
| usuario_id | Identificador Único | No | No | → Usuario (doctora/enfermera) |
| fecha | Fecha | Sí | No | Fecha de la cita |
| hora | Hora | Sí | No | Hora de la cita |
| duracion_minutos | Número | No | No | Duración en minutos (default: 30) |
| tipo | Texto | No | No | Tipo de cita |
| motivo | Texto | Sí | No | Motivo de la consulta |
| motivo_editado | Texto | No | No | Motivo editado |
| estado | Texto | No | No | Estado de la cita |
| consulta_id | Identificador Único | No | No | → Consulta (cuando se completa) |
| notas | Texto | No | No | Notas adicionales |
| asistio_confirmed_at | Fecha/Hora | No | No | Timestamp de confirmación |

## 4. Value Objects

### 4.1 EstadoCita

- pendiente: Cita agendada, esperando confirmación
- confirmada: Paciente confirmó asistencia
- asistio: Paciente asistió a la cita
- completada: Consulta creada
- cancelada: Cita cancelada

### 4.2 TipoCita

- BUSINESS DECISION REQUIRED: ¿Qué tipos de cita existen?

### 4.3 Duracion

- Default: 30 minutos
- Mínimo: BUSINESS DECISION REQUIRED
- Máximo: BUSINESS DECISION REQUIRED

## 5. Estados

| Estado | Descripción |
|---|---|
| pendiente | Cita agendada, esperando confirmación |
| confirmada | Paciente confirmó asistencia |
| asistio | Paciente asistió a la cita |
| completada | Consulta creada |
| cancelada | Cita cancelada |

## 6. Transiciones

```
pendiente → confirmada (confirmar)
pendiente → cancelada (cancelar)
confirmada → asistio (registrar asistencia)
confirmada → cancelada (cancelar)
asistio → completada (completar)
```

## 7. Casos de Uso

| Caso de Uso | Actor | Descripción | Precondiciones |
|---|---|---|---|
| UC-CIT-001 | doctora/enfermera | Reservar cita | Paciente existe, horario disponible |
| UC-CIT-002 | doctora/enfermera | Listar citas | Autenticado |
| UC-CIT-003 | doctora/enfermera | Obtener citas del día | Autenticado |
| UC-CIT-004 | doctora/enfermera | Obtener citas próximas | Autenticado |
| UC-CIT-005 | doctora/enfermera | Confirmar cita | Cita en estado pendiente |
| UC-CIT-006 | doctora/enfermera | Registrar asistencia | Cita en estado confirmada |
| UC-CIT-007 | doctora/enfermera | Preparar sesión | Cita existe |
| UC-CIT-008 | doctora/enfermera | Completar cita | Cita en estado asistio |
| UC-CIT-009 | doctora/enfermera | Cancelar cita | Cita no está completada |

## 8. Reglas de Negocio

| Regla ID | Regla | Fuente | Tipo |
|---|---|---|---|
| BR-CIT-001 | No se puede confirmar una cita que no esté pendiente | Negocio | Negocio |
| BR-CIT-002 | No se puede registrar asistencia en cita no confirmada/pendiente | Negocio | Negocio |
| BR-CIT-003 | No se puede completar una cita que no esté asistida | Negocio | Negocio |
| BR-CIT-004 | La duración predeterminada es 30 minutos | Técnico | Técnico |
| BR-CIT-005 | BUSINESS DECISION REQUIRED: ¿Se permiten citas superpuestas? | BUSINESS DECISION REQUIRED | Negocio |
| BR-CIT-006 | BUSINESS DECISION REQUIRED: ¿Se permite reprogramar una cita? | BUSINESS DECISION REQUIRED | Negocio |
| BR-CIT-007 | BUSINESS DECISION REQUIRED: ¿Se debe verificar disponibilidad al reservar? | BUSINESS DECISION REQUIRED | Negocio |

## 9. Validaciones

### 9.1 Validaciones de Negocio

| Validación | Descripción | Mensaje de Error |
|---|---|---|
| VR-CIT-001 | Estado válido para transición | "No se puede realizar esta acción en el estado actual" |
| VR-CIT-002 | Fecha no pasada | "No se pueden agendar citas en el pasado" |

### 9.2 Validaciones Técnicas

| Validación | Descripción | Mensaje de Error |
|---|---|---|
| VR-CIT-003 | Paciente requerido | "El paciente es obligatorio" |
| VR-CIT-004 | Fecha requerida | "La fecha es obligatoria" |
| VR-CIT-005 | Hora requerida | "La hora es obligatoria" |
| VR-CIT-006 | Motivo requerido | "El motivo es obligatorio" |

## 10. Relaciones

| Entidad | Relación | Cardinalidad | Descripción |
|---|---|---|---|
| Cita → Paciente | N:1 | Una cita pertenece a un paciente | Cada cita tiene un paciente |
| Cita → Usuario | N:1 | Una cita puede tener un usuario asignado | BUSINESS DECISION REQUIRED |
| Cita → Consulta | 1:0..1 | Una cita puede tener una consulta | Se vincula al completar |
| Cita → TipoCita | N:1 | Una cita tiene un tipo | BUSINESS DECISION REQUIRED |

## 11. Permisos

| Rol | Crear | Leer | Actualizar | Eliminar | Especial |
|---|---|---|---|---|---|
| admin | Sí | Todas | Todas | Sí | — |
| doctora | Sí | Todas | Todas | No | Completar citas |
| enfermera | Sí | Todas | Todas | No | Confirmar, registrar asistencia |

## 12. Auditoría

| Evento | Registrado | Campos |
|---|---|---|
| Reservar cita | Sí | cita_id, paciente_id, usuario_id, fecha, hora, timestamp |
| Confirmar cita | Sí | cita_id, usuario_id, timestamp |
| Registrar asistencia | Sí | cita_id, usuario_id, timestamp |
| Completar cita | Sí | cita_id, usuario_id, timestamp, consulta_id |
| Cancelar cita | Sí | cita_id, usuario_id, timestamp, motivo |

## 13. Eventos

| Evento | Disparador | Datos |
|---|---|---|
| CitaReservada | Reservar cita | cita_id, paciente_id, fecha, hora |
| CitaConfirmada | Confirmar cita | cita_id, paciente_id |
| CitaCompletada | Completar cita | cita_id, paciente_id, consulta_id |
| CitaCancelada | Cancelar cita | cita_id, paciente_id, motivo |

## 14. Soft Delete

Las citas nunca se eliminan físicamente. Se cancelan.

## 15. Consideraciones Técnicas

- BUSINESS DECISION REQUIRED: ¿Se debe verificar disponibilidad de agenda al reservar?
- BUSINESS DECISION REQUIRED: ¿Se permiten múltiples citas para el mismo paciente en el mismo día?
- BUSINESS DECISION REQUIRED: ¿Se debe notificar al paciente sobre la cita?

## 16. Extensiones Futuras

- Notificaciones por SMS/Email
- Lista de espera
- Reprogramación automática
- Recordatorios automáticos
- Integración con calendario

---

## Invariantes

| Invariante | Descripción |
|---|---|
| INV-CIT-001 | Una cita debe tener un identificador único |
| INV-CIT-002 | Una cita debe pertenecer a un paciente |
| INV-CIT-003 | Una cita debe tener fecha y hora |
| INV-CIT-004 | Una cita debe tener un motivo |
| INV-CIT-005 | Una cita no puede estar en estado completada sin una consulta vinculada |

---

## Public Interface

El módulo de Citas expone:

| Operación | Descripción |
|---|---|
| Reservar cita | Crear una nueva cita |
| Confirmar cita | Cambiar estado a confirmada |
| Registrar asistencia | Cambiar estado a asistio |
| Completar cita | Vincular consulta y cambiar estado a completada |
| Cancelar cita | Cambiar estado a cancelada |
| Obtener citas del día | Devolver citas de una fecha |
| Obtener citas próximas | Devolver próximas citas |
| Verificar disponibilidad | Verificar si un horario está disponible |

---

## Domain Discovery Answers

| Pregunta | Respuesta |
|---|---|
| ¿Quién usa este módulo? | Doctora, Enfermera |
| ¿Qué problema resuelve? | Programar y gestionar encuentros con pacientes |
| ¿Qué información administra? | Citas, estados, confirmaciones |
| ¿Qué operaciones realiza? | Reservar, confirmar, cancelar, completar |
| ¿Qué reglas tiene? | Transiciones de estado, duración |
| ¿Qué restricciones legales existen? | Ninguna específica |
| ¿Qué auditoría necesita? | Todas las acciones sobre citas |
| ¿Qué módulos dependen de él? | Consultas |
| ¿De qué módulos depende? | Agenda, Pacientes |
