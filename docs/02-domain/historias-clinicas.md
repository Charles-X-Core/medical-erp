# Domain: Historias Clínicas

---
Document ID: DOM-HCL-001
Status: Approved
Version: 1.0.0
Owner: Domain
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: true
Depends On: [GOV-002, DOM-UL-001, DOM-SEG-001, DOM-PAC-001, PRD-002]
---

## 1. Objetivo

Mantener el registro completo del historial médico de cada paciente.

## 2. Responsabilidades

- Crear historia clínica automáticamente al registrar paciente
- Almacenar antecedentes médicos
- Registrar evolución del paciente
- Mantener adjuntos y versiones

## 3. Entidades

### 3.1 Historia Clínica

| Atributo | Tipo | Requerido | Único | Descripción |
|---|---|---|---|---|
| id | Identificador Único | Sí | Sí | Identificador de la historia |
| paciente_id | Identificador Único | Sí | Sí | → Paciente (1:1) |
| numero_historia | Texto | No | Sí | Número auto-generado (HCL-YYYY-NNNNN) |
| alergia_medicamentos | Texto largo | No | No | Alergias a medicamentos |
| cardiopatias_personales | Texto largo | No | No | Cardiopatías personales |
| cardiopatias_familiares | Texto largo | No | No | Cardiopatías familiares |
| diabetes_personal | Texto largo | No | No | Diabetes personal |
| diabetes_familiar | Texto largo | No | No | Diabetes familiar |
| hepatitis | Texto largo | No | No | Hepatitis |
| otras_enfermedades | Texto largo | No | No | Otras enfermedades |
| observaciones | Texto largo | No | No | Observaciones generales |

## 4. Value Objects

### 4.1 NumeroHistoria

- Formato: `HCL-YYYY-NNNNN`
- Ejemplo: `HCL-2026-00001`
- Auto-incrementado por año

## 5. Estados

No aplica. Las historias clínicas no tienen estados.

## 6. Transiciones

No aplica.

## 7. Casos de Uso

| Caso de Uso | Actor | Descripción | Precondiciones |
|---|---|---|---|
| UC-HCL-001 | doctora | Editar historia clínica | Paciente existe |
| UC-HCL-002 | doctora/enfermera | Ver historia clínica | Paciente existe |
| UC-HCL-003 | doctora | Agregar antecedentes | Historia existe |
| UC-HCL-004 | doctora | Ver evolución | Historia existe |

## 8. Reglas de Negocio

| Regla ID | Regla | Fuente | Tipo |
|---|---|---|---|
| BR-HCL-001 | Cada paciente tiene exactamente una historia clínica | Técnico | Técnico |
| BR-HCL-002 | La historia se crea automáticamente al crear el paciente | Técnico | Técnico |
| BR-HCL-003 | La historia clínica no se puede eliminar | Técnico | Técnico |
| BR-HCL-004 | Solo la doctora puede editar la historia clínica | BUSINESS DECISION REQUIRED | Negocio |
| BR-HCL-005 | BUSINESS DECISION REQUIRED: ¿Se permite editar la historia después de firmar una consulta? | BUSINESS DECISION REQUIRED | Negocio |

## 9. Validaciones

### 9.1 Validaciones de Negocio

| Validación | Descripción | Mensaje de Error |
|---|---|---|
| VR-HCL-001 | Paciente único | "Ya existe una historia clínica para este paciente" |
| VR-HCL-002 | Número de historia único | "Ya existe una historia con ese número" |

### 9.2 Validaciones Técnicas

| Validación | Descripción | Mensaje de Error |
|---|---|---|
| VR-HCL-003 | Paciente requerido | "El paciente es obligatorio" |
| VR-HCL-004 | Número formato válido | "Formato de número de historia inválido" |

## 10. Relaciones

| Entidad | Relación | Cardinalidad | Descripción |
|---|---|---|---|
| Historia Clínica → Paciente | 1:1 | Una historia pertenece a un paciente | Cada paciente tiene una historia |
| Historia Clínica → Consultas | 1:N | Una historia tiene múltiples consultas | — |
| Historia Clínica → Adjuntos | 1:N | Una historia tiene múltiples adjuntos | — |

## 11. Permisos

| Rol | Crear | Leer | Actualizar | Eliminar | Especial |
|---|---|---|---|---|---|
| admin | No | Todas | Todas | No | — |
| doctora | No | Todas | Todas | No | Editar antecedentes |
| enfermera | No | Todas | No | No | Solo lectura |

## 12. Auditoría

| Evento | Registrado | Campos |
|---|---|---|
| Crear historia | Sí | historia_id, paciente_id, timestamp |
| Actualizar historia | Sí | historia_id, campos_cambiados, usuario_id, timestamp |

## 13. Eventos

| Evento | Disparador | Datos |
|---|---|---|
| HistoriaCreada | Crear paciente | historia_id, paciente_id |
| HistoriaActualizada | Actualizar historia | historia_id, campos_cambiados |

## 14. Soft Delete

Las historias clínicas nunca se eliminan.

## 15. Consideraciones Técnicas

- BUSINESS DECISION REQUIRED: ¿Se debe mantener un log de cambios en la historia?
- BUSINESS DECISION REQUIRED: ¿Se deben versionar los antecedentes?
- BUSINESS DECISION REQUIRED: ¿Se permiten adjuntos en la historia clínica?

## 16. Extensiones Futuras

- Versionado de antecedentes
- Adjuntos (imágenes, PDFs)
- Historial de cambios
- Integración con otros sistemas médicos

---

## Invariantes

| Invariante | Descripción |
|---|---|
| INV-HCL-001 | Una historia clínica debe tener un identificador único |
| INV-HCL-002 | Una historia clínica debe pertenecer a un paciente |
| INV-HCL-003 | Un paciente no puede tener más de una historia clínica |
| INV-HCL-004 | Una historia clínica no puede eliminarse |

---

## Public Interface

El módulo de Historias Clínicas expone:

| Operación | Descripción |
|---|---|
| Obtener historia | Devolver la historia de un paciente |
| Actualizar historia | Modificar antecedentes |
| Obtener número | Generar número de historia |
| Verificar existencia | Verificar si un paciente tiene historia |

---

## Domain Discovery Answers

| Pregunta | Respuesta |
|---|---|
| ¿Quién usa este módulo? | Doctora, Enfermera |
| ¿Qué problema resuelve? | Mantener historial médico completo |
| ¿Qué información administra? | Antecedentes, evolución, adjuntos |
| ¿Qué operaciones realiza? | Crear, actualizar, consultar |
| ¿Qué reglas tiene? | Una historia por paciente, no eliminar |
| ¿Qué restricciones legales existen? | Registro médico obligatorio |
| ¿Qué auditoría necesita? | Cambios en antecedentes |
| ¿Qué módulos dependen de él? | Consultas |
| ¿De qué módulos depende? | Pacientes |
