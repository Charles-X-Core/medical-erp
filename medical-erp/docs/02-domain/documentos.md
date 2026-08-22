# Domain: Documentos

---
Document ID: DOM-DOC-001
Status: Draft
Version: 0.1.0
Owner: Domain
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [GOV-002, DOM-UL-001, DOM-SEG-001, DOM-PAC-001, DOM-CON-001, PRD-002]
---

## 1. Objetivo

Gestionar documentos médicos oficiales, incluyendo generación de PDF, firmas digitales y archivado.

## 2. Responsabilidades

- Crear documentos médicos
- Generar PDFs
- Aplicar firmas digitales
- Archivar documentos
- Mantener integridad con hash SHA256

## 3. Entidades

### 3.1 Documento

| Atributo | Tipo | Requerido | Único | Descripción |
|---|---|---|---|---|
| id | Identificador Único | Sí | Sí | Identificador del documento |
| paciente_id | Identificador Único | Sí | No | → Paciente |
| cita_id | Identificador Único | No | No | → Cita |
| consulta_id | Identificador Único | No | No | → Consulta |
| usuario_id | Identificador Único | Sí | No | → Usuario (firmante) |
| tipo | Texto | Sí | No | Tipo de documento |
| titulo | Texto | Sí | No | Título del documento |
| archivo_ruta | Texto | Sí | No | Ruta del archivo |
| archivo_nombre | Texto | Sí | No | Nombre original del archivo |
| hash_sha256 | Texto | No | No | Hash de integridad |
| firma_imagen | Texto | No | No | Imagen de firma (base64) |
| estado | Texto | No | No | Estado del documento |

## 4. Value Objects

### 4.1 TipoDocumento

- receta
- historia
- informe
- consentimiento
- otros

### 4.2 EstadoDocumento

- borrador: Documento creado, no firmado
- firmado: Documento firmado
- archivado: Documento archivado

### 4.3 HashSHA256

- 64 caracteres hexadecimales
- Generado automáticamente al crear el archivo

## 5. Estados

| Estado | Descripción |
|---|---|
| borrador | Documento creado, no firmado |
| firmado | Documento firmado |
| archivado | Documento archivado |

## 6. Transiciones

```
borrador → firmado (firmar)
firmado → archivado (archivar)
```

## 7. Casos de Uso

| Caso de Uso | Actor | Descripción | Precondiciones |
|---|---|---|---|
| UC-DOC-001 | doctora | Crear documento | Paciente existe |
| UC-DOC-002 | doctora | Generar PDF | Documento existe |
| UC-DOC-003 | doctora | Firmar documento | Documento en borrador |
| UC-DOC-004 | doctora | Archivar documento | Documento firmado |
| UC-DOC-005 | doctora/enfermera | Ver documento | Autenticado |
| UC-DOC-006 | doctora/enfermera | Descargar PDF | Documento existe |
| UC-DOC-007 | doctora/enfermera | Listar documentos por paciente | Autenticado |

## 8. Reglas de Negocio

| Regla ID | Regla | Fuente | Tipo |
|---|---|---|---|
| BR-DOC-001 | El PDF se genera a partir de los datos del documento | Técnico | Técnico |
| BR-DOC-002 | El hash SHA256 garantiza integridad | Técnico | Técnico |
| BR-DOC-003 | La firma digital es base64 encoded | Técnico | Técnico |
| BR-DOC-004 | Solo la doctora puede firmar documentos | BUSINESS DECISION REQUIRED | Negocio |
| BR-DOC-005 | BUSINESS DECISION REQUIRED: ¿Se pueden modificar documentos firmados? | BUSINESS DECISION REQUIRED | Negocio |
| BR-DOC-006 | BUSINESS DECISION REQUIRED: ¿Se pueden eliminar documentos? | BUSINESS DECISION REQUIRED | Negocio |

## 9. Validaciones

### 9.1 Validaciones de Negocio

| Validación | Descripción | Mensaje de Error |
|---|---|---|
| VR-DOC-001 | Tipo válido | "Tipo de documento no válido" |
| VR-DOC-002 | Estado válido para transición | "No se puede realizar esta acción en el estado actual" |

### 9.2 Validaciones Técnicas

| Validación | Descripción | Mensaje de Error |
|---|---|---|
| VR-DOC-003 | Paciente requerido | "El paciente es obligatorio" |
| VR-DOC-004 | Título requerido | "El título es obligatorio" |
| VR-DOC-005 | Tipo requerido | "El tipo es obligatorio" |

## 10. Relaciones

| Entidad | Relación | Cardinalidad | Descripción |
|---|---|---|---|
| Documento → Paciente | N:1 | Un documento pertenece a un paciente | Cada documento tiene un paciente |
| Documento → Cita | N:0..1 | Un documento puede venir de una cita | Opcional |
| Documento → Usuario | N:1 | Un documento tiene un usuario firmante | Cada documento tiene un firmante |

## 11. Permisos

| Rol | Crear | Leer | Actualizar | Eliminar | Especial |
|---|---|---|---|---|---|
| admin | Sí | Todos | Todos | Sí | — |
| doctora | Sí | Todos | Borradores | No | Firmar documentos |
| enfermera | No | Solo lectura | No | No | Solo ver y descargar |

## 12. Auditoría

| Evento | Registrado | Campos |
|---|---|---|
| Crear documento | Sí | documento_id, paciente_id, usuario_id, tipo, timestamp |
| Generar PDF | Sí | documento_id, usuario_id, timestamp |
| Firmar documento | Sí | documento_id, usuario_id, timestamp |
| Archivar documento | Sí | documento_id, usuario_id, timestamp |
| Descargar PDF | Sí | documento_id, usuario_id, timestamp |

## 13. Eventos

| Evento | Disparador | Datos |
|---|---|---|
| DocumentoCreado | Crear documento | documento_id, paciente_id, tipo |
| DocumentoFirmado | Firmar documento | documento_id, usuario_id |
| DocumentoArchivado | Archivar documento | documento_id |

## 14. Soft Delete

Los documentos nunca se eliminan. Se archivan.

## 15. Consideraciones Técnicas

- BUSINESS DECISION REQUIRED: ¿Los documentos firmados pueden modificarse?
- BUSINESS DECISION REQUIRED: ¿Se debe mantener versiones de documentos?
- BUSINESS DECISION REQUIRED: ¿Se permiten documentos sin firma?

## 16. Extensiones Futuras

- Versionado de documentos
- Firma avanzada (certificate-based)
- Integración con sistemas de archivado
- Búsqueda de texto en documentos
- Plantillas de documentos

---

## Invariantes

| Invariante | Descripción |
|---|---|
| INV-DOC-001 | Un documento debe tener un identificador único |
| INV-DOC-002 | Un documento debe pertenecer a un paciente |
| INV-DOC-003 | Un documento debe tener un tipo |
| INV-DOC-004 | Un documento debe tener un título |
| INV-DOC-005 | Un documento firmado no puede volver a borrador |

---

## Public Interface

El módulo de Documentos expone:

| Operación | Descripción |
|---|---|
| Crear documento | Crear un nuevo documento |
| Generar PDF | Generar PDF del documento |
| Firmar documento | Aplicar firma digital |
| Archivar documento | Mover a estado archivado |
| Obtener documento | Devolver datos del documento |
| Descargar PDF | Obtener archivo PDF |
| Listar documentos | Devolver documentos de un paciente |

---

## Domain Discovery Answers

| Pregunta | Respuesta |
|---|---|
| ¿Quién usa este módulo? | Doctora, Enfermera |
| ¿Qué problema resuelve? | Gestiona documentos médicos oficiales |
| ¿Qué información administra? | Documentos, PDFs, firmas |
| ¿Qué operaciones realiza? | Crear, firmar, archivar, descargar |
| ¿Qué reglas tiene? | Firma solo doctora, integridad SHA256 |
| ¿Qué restricciones legales existen? | Documentos médicos oficiales |
| ¿Qué auditoría necesita? | Creación, firma, descarga |
| ¿Qué módulos dependen de él? | Ninguno |
| ¿De qué módulos depende? | Pacientes, Consultas, Citas |
