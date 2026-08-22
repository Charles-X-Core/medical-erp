# Domain: Pacientes

---
Document ID: DOM-PAC-001
Status: Draft
Version: 0.1.0
Owner: Domain
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [GOV-002, DOM-UL-001, DOM-SEG-001, PRD-002]
---

## 1. Objetivo

Administrar la información de los pacientes que reciben atención médica.

## 2. Responsabilidades

- Registrar nuevos pacientes
- Mantener datos personales actualizados
- Gestionar información de contacto
- Controlar estado del paciente
- Mantener historial de cambios

## 3. Entidades

### 3.1 Paciente

| Atributo | Tipo | Requerido | Único | Descripción |
|---|---|---|---|---|
| id | Identificador Único | Sí | Sí | Identificador del paciente |
| apellido_paterno | Texto | Sí | No | Apellido paterno |
| apellido_materno | Texto | No | No | Apellido materno |
| nombres | Texto | Sí | No | Nombres completos |
| dni | Texto | Condicional | Sí | Número de documento (requerido si tipo_documento ≠ 'sin_doc') |
| tipo_documento | Texto | No | No | dni/ce/pasaporte/sin_doc |
| telefono | Texto | No | No | Número telefónico |
| email | Texto | No | No | Correo electrónico |
| fecha_nacimiento | Fecha | No | No | Fecha de nacimiento |
| sexo | Texto | No | No | M/F/Otro |
| estado_civil | Texto | No | No | Estado civil |
| direccion | Texto | No | No | Dirección completa |
| lugar_nacimiento | Texto | No | No | Lugar de nacimiento |
| lugar_procedencia | Texto | No | No | Lugar de procedencia |
| grado_instruccion | Texto | No | No | Nivel educativo |
| ocupacion | Texto | No | No | Profesión u ocupación |
| nombre_acompanante | Texto | No | No | Nombre del acompañante |
| contacto_emergencia | Texto | No | No | Contacto de emergencia |
| telefono_emergencia | Texto | No | No | Teléfono de emergencia |
| alergias | Texto largo | No | No | Alergias conocidas |
| antecedentes_personales | Texto largo | No | No | Antecedentes personales |
| antecedentes_familiares | Texto largo | No | No | Antecedentes familiares |
| estado | Texto | No | No | activo/inactivo |

## 4. Value Objects

### 4.1 Documento de Identidad

- tipo: dni, ce, pasaporte, sin_doc
- número: según tipo

### 4.2 Sexo

- Valores: M, F, Otro

### 4.3 Estado Civil

- BUSINESS DECISION REQUIRED: ¿Qué valores permitidos?

### 4.4 Estado del Paciente

- activo: Paciente activo en el sistema
- inactivo: Paciente desactivado

## 5. Estados

### 5.1 Paciente

| Estado | Descripción |
|---|---|
| activo | Paciente activo, puede recibir atención |
| inactivo | Paciente desactivado, no recibe atención |

## 6. Transiciones

```
activo → inactivo (desactivar)
inactivo → activar (activar)
```

## 7. Casos de Uso

| Caso de Uso | Actor | Descripción | Precondiciones |
|---|---|---|---|
| UC-PAC-001 | doctora/enfermera | Crear paciente | Autenticado |
| UC-PAC-002 | doctora/enfermera | Listar pacientes | Autenticado |
| UC-PAC-003 | doctora/enfermera | Buscar pacientes | Autenticado |
| UC-PAC-004 | doctora/enfermera | Obtener paciente por ID | Autenticado |
| UC-PAC-005 | doctora/enfermera | Actualizar paciente | Autenticado, paciente existe |
| UC-PAC-006 | doctora/enfermera | Actualizar DNI | Autenticado, paciente existe |
| UC-PAC-007 | doctora | Desactivar paciente | Autenticado como doctora |
| UC-PAC-008 | doctora/enfermera | Obtener historial completo | Autenticado, paciente existe |

## 8. Reglas de Negocio

| Regla ID | Regla | Fuente | Tipo |
|---|---|---|---|
| BR-PAC-001 | El DNI es único por tipo de documento | Técnico | Técnico |
| BR-PAC-002 | No se puede eliminar un paciente con historial | Técnico | Técnico |
| BR-PAC-003 | BUSINESS DECISION REQUIRED: ¿Se permiten múltiples teléfonos? | BUSINESS DECISION REQUIRED | Negocio |
| BR-PAC-004 | BUSINESS DECISION REQUIRED: ¿Se permite fusionar pacientes duplicados? | BUSINESS DECISION REQUIRED | Negocio |
| BR-PAC-005 | BUSINESS DECISION REQUIRED: ¿Cuántos teléfonos puede tener un paciente? | BUSINESS DECISION REQUIRED | Negocio |

## 9. Validaciones

### 9.1 Validaciones de Negocio

| Validación | Descripción | Mensaje de Error |
|---|---|---|
| VR-PAC-001 | DNI único por tipo | "Ya existe un paciente con ese documento" |
| VR-PAC-002 | apellido_paterno requerido | "El apellido paterno es obligatorio" |
| VR-PAC-003 | nombres requerido | "Los nombres son obligatorios" |

### 9.2 Validaciones Técnicas

| Validación | Descripción | Mensaje de Error |
|---|---|---|
| VR-PAC-004 | DNI: 8 dígitos numéricos | "El DNI debe tener exactamente 8 dígitos numéricos" |
| VR-PAC-005 | CE: 8-12 dígitos numéricos | "El CE debe tener 8-12 dígitos numéricos" |
| VR-PAC-006 | Pasaporte: 6-12 caracteres alfanuméricos | "El pasaporte debe tener 6-12 caracteres alfanuméricos" |
| VR-PAC-007 | Email formato válido | "Formato de email inválido" |
| VR-PAC-008 | Fecha de nacimiento no futura | "La fecha de nacimiento no puede ser futura" |

## 10. Relaciones

| Entidad | Relación | Cardinalidad | Descripción |
|---|---|---|---|
| Paciente → Historia Clínica | 1:1 | Un paciente tiene una historia clínica | Se crea automáticamente |
| Paciente → Citas | 1:N | Un paciente tiene múltiples citas | — |
| Paciente → Consultas | 1:N | Un paciente tiene múltiples consultas | — |
| Paciente → Documentos | 1:N | Un paciente tiene múltiples documentos | — |
| Paciente → Tratamientos | 1:N | Un paciente tiene múltiples tratamientos | — |
| Paciente → Recetas | 1:N | Un paciente tiene múltiples recetas | — |
| Paciente → Pagos | 1:N | Un paciente tiene múltiples pagos | — |

## 11. Permisos

| Rol | Crear | Leer | Actualizar | Eliminar | Especial |
|---|---|---|---|---|---|
| admin | Sí | Todos | Todos | Sí | — |
| doctora | Sí | Todos | Todos | No | Ver historial completo |
| enfermera | Sí | Todos | Todos | No | — |

## 12. Auditoría

| Evento | Registrado | Campos |
|---|---|---|
| Crear paciente | Sí | paciente_id, usuario_id, timestamp, todos los campos |
| Actualizar paciente | Sí | paciente_id, campos_cambiados, usuario_id, timestamp |
| Desactivar paciente | Sí | paciente_id, usuario_id, timestamp |
| Activar paciente | Sí | paciente_id, usuario_id, timestamp |

## 13. Eventos

| Evento | Disparador | Datos |
|---|---|---|
| PacienteCreado | Crear paciente | paciente_id, nombre_completo |
| PacienteActualizado | Actualizar paciente | paciente_id, campos_cambiados |
| PacienteDesactivado | Desactivar paciente | paciente_id |
| PacienteActivado | Activar paciente | paciente_id |

## 14. Soft Delete

Los pacientes nunca se eliminan físicamente. Se marcan como `inactivo`.

## 15. Consideraciones Técnicas

- BUSINESS DECISION REQUIRED: ¿Se permiten pacientes sin DNI (tipo_documento = 'sin_doc')?
- BUSINESS DECISION REQUIRED: ¿Se debe mantener historial de cambios en datos personales?
- BUSINESS DECISION REQUIRED: ¿Se debe permitir la búsqueda por nombre parcial?

## 16. Extensiones Futuras

- Fusionar pacientes duplicados
- Importar pacientes desde otros sistemas
- Historial de cambios en datos personales
- Búsqueda avanzada (frecuencia, última visita)
- Fotografía del paciente

---

## Invariantes

| Invariante | Descripción |
|---|---|
| INV-PAC-001 | Un paciente debe tener un identificador único |
| INV-PAC-002 | Un paciente no puede existir sin un apellido paterno |
| INV-PAC-003 | Un paciente no puede existir sin nombres |
| INV-PAC-004 | Un paciente no puede tener fecha de nacimiento futura |
| INV-PAC-005 | Un paciente no puede existir con DNI duplicado (mismo tipo) |

---

## Public Interface

El módulo de Pacientes expone:

| Operación | Descripción |
|---|---|
| Registrar paciente | Crear un nuevo paciente |
| Actualizar paciente | Modificar datos del paciente |
| Obtener paciente | Devolver datos de un paciente |
| Buscar pacientes | Buscar por nombre, DNI, etc. |
| Listar pacientes | Devolver lista de pacientes |
| Desactivar paciente | Marcar paciente como inactivo |
| Activar paciente | Marcar paciente como activo |
| Obtener historial | Devolver historial completo del paciente |

---

## Domain Discovery Answers

| Pregunta | Respuesta |
|---|---|
| ¿Quién usa este módulo? | Doctora, Enfermera |
| ¿Qué problema resuelve? | Administrar información de pacientes |
| ¿Qué información administra? | Datos personales, contactos, antecedentes |
| ¿Qué operaciones realiza? | CRUD de pacientes, búsqueda |
| ¿Qué reglas tiene? | DNI único, campos requeridos |
| ¿Qué restricciones legales existen? | Protección de datos personales |
| ¿Qué auditoría necesita? | Cambios en datos, accesos |
| ¿Qué módulos dependen de él? | Citas, Consultas, Historias, Documentos, Tratamientos, Recetas, Pagos |
| ¿De qué módulos depende? | Seguridad (Usuarios) |
