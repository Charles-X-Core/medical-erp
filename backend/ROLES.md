# ROLES.md — Responsabilidades por Rol (Basado en código real)

> **NOTA:** Este documento refleja el comportamiento ACTUAL del backend.
> Los permisos están definidos por `@PreAuthorize` en cada controller.

---

## ENFERMERA

**Puede:**
- Listar Citas, Obtener Citas, Ver Citas de Hoy, Ver Próximas Citas
- Crear Citas, Actualizar Citas, Confirmar Citas, Registrar Asistencia, Cancelar Citas, Reprogramar Citas
- Ver Tratamientos, Obtener Tratamiento por ID, Listar por Paciente, Listar por Estado, Buscar
- Ver Protocolo de Tratamiento, Sugerir Próxima Cita
- Ver Historial Clínico y Administrativo de Tratamientos
- Ver Agenda de Usuarios, Ver Bloqueos
- Ver Tipos de Cita
- Ver Disponibilidad por Fecha, Ver Próximo Slot Disponible
- Ver Timeline de Paciente

**No puede:**
- Completar Citas (requiere DOCTORA o ADMIN)
- Crear/Actualizar/Eliminar Tratamientos
- Programar/Iniciar/Pausar/Reanudar/Finalizar/Cancelar Tratamientos
- Ampliar Plan de Tratamientos
- Actualizar Protocolo de Tratamiento
- Crear/Actualizar/Eliminar Agenda
- Crear/Actualizar/Eliminar Disponibilidades
- Crear/Eliminar Bloqueos
- Crear/Actualizar/Eliminar Tipos de Cita

---

## DOCTORA

**Puede:**
- Todo lo de ENFERMERA, más:
- Completar Citas (requiere `consultaId`)
- Crear Tratamientos
- Programar Tratamientos (`PATCH /{id}/programar`)
- Iniciar Tratamientos (`PATCH /{id}/iniciar`)
- Pausar Tratamientos (`PATCH /{id}/pausar`)
- Reanudar Tratamientos (`PATCH /{id}/reanudar`)
- Finalizar Tratamientos (`PATCH /{id}/finalizar`)
- Cancelar Tratamientos (`PATCH /{id}/cancelar`)
- Actualizar Plan de Tratamientos (`PUT /{id}`)
- Ampliar Plan de Tratamientos (`PATCH /{id}/ampliar`)
- Actualizar Protocolo de Tratamiento (`PUT /{id}/protocolo`)
- Crear Agenda (para sí misma)
- Actualizar Disponibilidades de su Agenda
- Crear Bloqueos en su Agenda
- Eliminar Bloqueos de su Agenda (con validación de ownership)

**No puede:**
- Crear/Actualizar/Eliminar Tipos de Cita (solo ADMIN)
- Crear Agenda para otros usuarios (solo ADMIN)

---

## ADMIN

**Puede:**
- Todo lo de DOCTORA, más:
- Crear/Actualizar/Eliminar Tipos de Cita
- Crear Agenda para cualquier usuario
- Eliminar Bloqueos de cualquier Agenda

**No puede:**
- Registrar Sesiones de Tratamiento (requiere DOCTORA)
- Crear Consultas clínicas (requiere DOCTORA)

---

## SECRETARIA

> **ADVERTENCIA:** Este rol NO está implementado en el backend actualmente.
> Las anotaciones `@PreAuthorize` no incluyen `SECRETARIA`.
> Para habilitar este rol, se deben agregar los endpoints correspondientes.

**Puede (diseño deseado):**
- Crear Citas
- Confirmar Citas
- Cancelar Citas
- Reprogramar Citas
- Registrar asistencia de paciente

**No puede (diseño deseado):**
- Crear Tratamientos
- Registrar Sesiones de Tratamiento
- Finalizar Tratamientos
- Crear Consultas clínicas
- Configurar Agenda de doctores

---

## Resumen de Endpoints por Rol

### Citas (`/api/v1/citas`)

| Endpoint | ENFERMERA | DOCTORA | ADMIN |
|---|---|---|---|
| `POST /` | ✅ | ✅ | ✅ |
| `GET /` | ✅ | ✅ | ✅ |
| `GET /{id}` | ✅ | ✅ | ✅ |
| `GET /hoy` | ✅ | ✅ | ✅ |
| `GET /proximas` | ✅ | ✅ | ✅ |
| `PUT /{id}` | ✅ | ✅ | ✅ |
| `PATCH /{id}/confirmar` | ✅ | ✅ | ✅ |
| `PATCH /{id}/asistencia` | ✅ | ✅ | ✅ |
| `PATCH /{id}/completar` | ❌ | ✅ | ✅ |
| `PATCH /{id}/cancelar` | ✅ | ✅ | ✅ |
| `PATCH /{id}/reprogramar` | ✅ | ✅ | ✅ |

### Tratamientos (`/api/v1/tratamientos`)

| Endpoint | ENFERMERA | DOCTORA | ADMIN |
|---|---|---|---|
| `POST /` | ❌ | ✅ | ✅ |
| `GET /` | ✅ | ✅ | ✅ |
| `GET /{id}` | ✅ | ✅ | ✅ |
| `GET /paciente/{id}` | ✅ | ✅ | ✅ |
| `GET /estado/{estado}` | ✅ | ✅ | ✅ |
| `GET /activos` | ✅ | ✅ | ✅ |
| `GET /buscar` | ✅ | ✅ | ✅ |
| `PATCH /{id}/programar` | ❌ | ✅ | ✅ |
| `PATCH /{id}/iniciar` | ❌ | ✅ | ✅ |
| `PATCH /{id}/pausar` | ❌ | ✅ | ✅ |
| `PATCH /{id}/reanudar` | ❌ | ✅ | ✅ |
| `PATCH /{id}/finalizar` | ❌ | ✅ | ✅ |
| `PATCH /{id}/cancelar` | ❌ | ✅ | ✅ |
| `PUT /{id}` | ❌ | ✅ | ✅ |
| `PATCH /{id}/ampliar` | ❌ | ✅ | ✅ |
| `GET /{id}/protocolo` | ✅ | ✅ | ✅ |
| `PUT /{id}/protocolo` | ❌ | ✅ | ✅ |
| `POST /{id}/sugerir-proxima-cita` | ✅ | ✅ | ✅ |
| `GET /{id}/historial/clinico` | ✅ | ✅ | ✅ |
| `GET /{id}/historial/administrativo` | ✅ | ✅ | ✅ |

### Agenda (`/api/v1/agenda`)

| Endpoint | ENFERMERA | DOCTORA | ADMIN |
|---|---|---|---|
| `POST /` | ✅ | ✅ | ✅ |
| `GET /usuario/{usuarioId}` | ✅ | ✅ | ✅ |
| `PUT /{agendaId}/disponibilidades` | ✅ | ✅ | ✅ |
| `POST /{agendaId}/bloqueos` | ✅ | ✅ | ✅ |
| `GET /{agendaId}/bloqueos` | ✅ | ✅ | ✅ |
| `DELETE /bloqueos/{bloqueoId}` | ✅ | ✅ | ✅ |
| `POST /tipos` | ❌ | ❌ | ✅ |
| `GET /tipos` | ✅ | ✅ | ✅ |
| `GET /tipos/{id}` | ✅ | ✅ | ✅ |
| `PUT /tipos/{id}` | ❌ | ❌ | ✅ |
| `DELETE /tipos/{id}` | ❌ | ❌ | ✅ |
| `GET /{usuarioId}/disponibilidad` | ✅ | ✅ | ✅ |
| `GET /{usuarioId}/next-available` | ✅ | ✅ | ✅ |

### Timeline (`/api/v1/timeline`)

| Endpoint | ENFERMERA | DOCTORA | ADMIN |
|---|---|---|---|
| `GET /paciente/{pacienteId}` | ✅ | ✅ | ✅ |
