# Domain: Consultas

---
Document ID: DOM-CON-001
Status: Approved
Version: 1.0.0
Owner: Domain
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: true
Depends On: [GOV-002, DOM-UL-001, DOM-SEG-001, DOM-CIT-001, PRD-002]
---

## 1. Objetivo

Registrar los encuentros médicos con pacientes, incluyendo diagnósticos, tratamientos y observaciones.

## 2. Responsabilidades

- Registrar consultas médicas
- Documentar diagnósticos
- Registrar tratamientos
- Generar recetas
- Vincular consultas con citas

## 3. Entidades

### 3.1 Consulta

| Atributo | Tipo | Requerido | Único | Descripción |
|---|---|---|---|---|
| id | Identificador Único | Sí | Sí | Identificador de la consulta |
| historia_id | Identificador Único | Sí | No | → Historia Clínica |
| fecha | Fecha/Hora | Sí | No | Fecha de la consulta |
| motivo | Texto | Sí | No | Motivo de la consulta |
| tiempo_enfermedad | Texto | No | No | Tiempo de enfermedad |
| signos_sintomas | Texto largo | No | No | Signos y síntomas |
| relato_cronologico | Texto largo | No | No | Relato cronológico |
| signos_vitales | Objeto | No | No | Signos vitales (JSON) |
| examen_clinico_general | Texto largo | No | No | Examen clínico general |
| diagnostico_lista | Lista | No | No | Lista de diagnósticos (JSON) |
| plan_tratamiento | Objeto | No | No | Plan de tratamiento (JSON) |
| notas | Texto | No | No | Notas adicionales |

### 3.2 SignosVitales (Value Object)

| Atributo | Tipo | Descripción |
|---|---|---|
| presion_arterial | Texto | Presión arterial (ej: "120/80") |
| pulso | Número | Pulso por minuto |
| temperatura | Número | Temperatura en °C |
| peso | Número | Peso en kg |
| talla | Número | Talla en cm |
| saturacion | Número | Saturación de oxígeno % |
| frecuencia_respiratoria | Número | Frecuencia respiratoria |

### 3.3 Diagnostico (Value Object)

| Atributo | Tipo | Descripción |
|---|---|---|
| codigo | Texto | Código CIE-10 |
| descripcion | Texto | Descripción del diagnóstico |
| principal | Booleano | Si es diagnóstico principal |

## 4. Value Objects

### 4.1 SignosVitales

Ver 3.2

### 4.2 Diagnostico

Ver 3.3

## 5. Estados

No aplica. Las consultas no tienen estados.

## 6. Transiciones

No aplica.

## 7. Casos de Uso

| Caso de Uso | Actor | Descripción | Precondiciones |
|---|---|---|---|
| UC-CON-001 | doctora | Crear consulta | Historia clínica existe |
| UC-CON-002 | doctora | Listar consultas por historia | Historia clínica existe |
| UC-CON-003 | doctora | Actualizar consulta | Consulta existe |
| UC-CON-004 | doctora | Eliminar consulta | Consulta existe |
| UC-CON-005 | doctora | Obtener consulta por ID | Consulta existe |

## 8. Reglas de Negocio

| Regla ID | Regla | Fuente | Tipo |
|---|---|---|---|
| BR-CON-001 | Cada consulta pertenece a una historia clínica | Técnico | Técnico |
| BR-CON-002 | Una consulta puede estar vinculada a una cita | Técnico | Técnico |
| BR-CON-003 | Solo la doctora puede crear consultas | BUSINESS DECISION REQUIRED | Negocio |
| BR-CON-004 | BUSINESS DECISION REQUIRED: ¿Se pueden modificar consultas después de firmar? | BUSINESS DECISION REQUIRED | Negocio |
| BR-CON-005 | BUSINESS DECISION REQUIRED: ¿Se pueden eliminar consultas? | BUSINESS DECISION REQUIRED | Negocio |

## 9. Validaciones

### 9.1 Validaciones de Negocio

| Validación | Descripción | Mensaje de Error |
|---|---|---|
| VR-CON-001 | Motivo requerido | "El motivo es obligatorio" |
| VR-CON-002 | Historia clínica requerida | "La historia clínica es obligatoria" |

### 9.2 Validaciones Técnicas

| Validación | Descripción | Mensaje de Error |
|---|---|---|
| VR-CON-003 | Fecha válida | "La fecha no puede ser futura" |
| VR-CON-004 | Diagnósticos válidos | "Los diagnósticos deben tener código y descripción" |

## 10. Relaciones

| Entidad | Relación | Cardinalidad | Descripción |
|---|---|---|---|
| Consulta → Historia Clínica | N:1 | Una consulta pertenece a una historia | Cada consulta tiene una historia |
| Consulta → Cita | 1:0..1 | Una consulta puede venir de una cita | Opcional |
| Consulta → Documentos | 1:N | Una consulta tiene múltiples documentos | — |
| Consulta → Recetas | 1:N | Una consulta tiene múltiples recetas | — |
| Consulta → Tratamientos | 1:N | Una consulta tiene múltiples tratamientos | — |
| Consulta → Odontograma | 1:0..1 | Una consulta puede tener un odontograma | Opcional |
| Consulta → Necesidades Odontológicas | 1:0..1 | Una consulta puede tener necesidades odontológicas | Opcional |

## 11. Permisos

| Rol | Crear | Leer | Actualizar | Eliminar | Especial |
|---|---|---|---|---|---|
| admin | Sí | Todas | Todas | Sí | — |
| doctora | Sí | Todas | Todas | No | Crear y modificar |
| enfermera | No | Solo lectura | No | No | Solo ver |

## 12. Auditoría

| Evento | Registrado | Campos |
|---|---|---|
| Crear consulta | Sí | consulta_id, historia_id, usuario_id, timestamp |
| Actualizar consulta | Sí | consulta_id, campos_cambiados, usuario_id, timestamp |
| Eliminar consulta | Sí | consulta_id, usuario_id, timestamp |

## 13. Eventos

| Evento | Disparador | Datos |
|---|---|---|
| ConsultaCreada | Crear consulta | consulta_id, historia_id, fecha |
| ConsultaActualizada | Actualizar consulta | consulta_id, campos_cambiados |

## 14. Soft Delete

Las consultas pueden eliminarse físicamente o marcarse como inactivas. BUSINESS DECISION REQUIRED.

## 15. Consideraciones Técnicas

- BUSINESS DECISION REQUIRED: ¿Las consultas deben ser inmutables después de firmar?
- BUSINESS DECISION REQUIRED: ¿Se debe mantener historial de cambios?
- BUSINESS DECISION REQUIRED: ¿Se permiten múltiples diagnósticos principales?

## 16. Extensiones Futuras

- Integración con CIE-10 para diagnósticos
- Plantillas de consulta
- Consultas por voz
- Imágenes clínicas adjuntas

---

## Invariantes

| Invariante | Descripción |
|---|---|
| INV-CON-001 | Una consulta debe tener un identificador único |
| INV-CON-002 | Una consulta debe pertenecer a una historia clínica |
| INV-CON-003 | Una consulta debe tener un motivo |
| INV-CON-004 | Una consulta no puede existir sin fecha |

---

## Public Interface

El módulo de Consultas expone:

| Operación | Descripción |
|---|---|
| Crear consulta | Registrar una nueva consulta |
| Obtener consulta | Devolver datos de una consulta |
| Listar consultas | Devolver consultas de una historia |
| Actualizar consulta | Modificar datos de una consulta |
| Eliminar consulta | Eliminar una consulta |

---

## Domain Discovery Answers

| Pregunta | Respuesta |
|---|---|
| ¿Quién usa este módulo? | Doctora |
| ¿Qué problema resuelve? | Registrar encuentros médicos |
| ¿Qué información administra? | Consultas, diagnósticos, tratamientos |
| ¿Qué operaciones realiza? | CRUD de consultas |
| ¿Qué reglas tiene? | Vinculación con historia clínica |
| ¿Qué restricciones legales existen? | Registro médico obligatorio |
| ¿Qué auditoría necesita? | Creación y modificación de consultas |
| ¿Qué módulos dependen de él? | Documentos, Recetas, Tratamientos |
| ¿De qué módulos depende? | Citas, Historias Clínicas |
