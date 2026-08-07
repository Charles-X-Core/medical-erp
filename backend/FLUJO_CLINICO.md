# Flujo Clínico Completo

## Visión General

El sistema Medical ERP soporta el flujo completo de atención clínica:

```
Paciente → Consulta → ¿Tiene tratamiento?
                          │
                          ├─ NO → Alta / Control
                          │
                          └─ SI → Tratamiento → Sesiones → ¿Finalizó?
                                                          │
                                                          ├─ SI → ¿Requiere Control? → Crear Cita
                                                          │
                                                          └─ NO → Continuar sesiones
```

---

## 1. Registro de Paciente

**Endpoint:** `POST /api/v1/pacientes`

**Entidad:** `Paciente`

**Campos obligatorios:**
- `nombres`, `apellidoPaterno`, `apellidoMaterno`
- `fechaNacimiento`, `sexo`, `estadoCivil`
- `documentoIdentidad`, `tipoDocumento`
- `email`, `telefono`, `direccion`
- `grupoSanguineo`, `alergias`

**Resultado:** Paciente creado en estado `ACTIVO`.

---

## 2. Consulta (Primer Contacto)

**Endpoint:** `POST /api/v1/consultas`

**Entidad:** `Consulta`

**Campos obligatorios:**
- `pacienteId` → Paciente existente
- `motivoConsulta`
- `sintomas`
- `diagnosticoPrincipal`
- `signosVitales` → Objeto `SignosVitales`

**Resultado:** Consulta registrada. Opcionalmente se activa un Tratamiento asociado.

---

## 3. Decisión: ¿Tiene Tratamiento?

Después de la Consulta, se evalúa si el paciente necesita tratamiento:

### 3a. NO tiene tratamiento
- Se da de **Alta** (el paciente vuelve a su rutina)
- O se programa una **Consulta de Control** (seguimiento)

### 3b. SÍ tiene tratamiento
- Se crea un **Tratamiento** (ver paso 4)

---

## 4. Tratamiento

**Endpoint:** `POST /api/v1/tratamientos`

**Entidad:** `Tratamiento`

**Campos obligatorios:**
- `consultaId` → Consulta que originó el tratamiento
- `pacienteId` → Paciente
- `usuarioAsignadoId` → Doctor responsable
- `diagnosticoTratamiento`
- `tipoTratamiento` → ORTODONCIA, ENDODONCIA, PERIODONCIA, PROTESIS, LIMPIEZA, REVISION, OTRO

**Resultado:** Tratamiento creado en estado `PENDIENTE`. Se crea automáticamente un `ProtocoloClinico` asociado.

**Máquina de estados:**
```
PENDIENTE → PROGRAMADO → EN_CURSO → FINALIZADO
                  ↓           ↓
               CANCELADO   PAUSADO → EN_CURSO
```

---

## 5. Protocolo Clínico

**Entidad:** `ProtocoloClinico` (1:1 con Tratamiento)

**Campos importantes:**
- `frecuenciaDias` → Frecuencia entre sesiones (ej: 7, 14, 30)
- `duracionSesionMinutos` → Duración de cada sesión
- `totalSesionesEstimadas`
- `permiteInicioInmediato` → Si puede iniciar hoy (true) o debe esperar (false)
- `notasProtocolo` → Instrucciones específicas

**Regla:** El protocolo se crea automáticamente al activar un tratamiento.

---

## 6. Sesiones de Tratamiento

**Endpoint:** `POST /api/v1/sesiones-tratamiento?tratamientoId={id}`

**Entidad:** `SesionTratamiento`

**Campos obligatorios:**
- `tipoSesionId` → Tipo de sesión (LIMPIEZA, ENDODONCIA, etc.)
- `fecha` → Fecha programada
- `citaId` → Opcional: Cita asociada
- `signosVitales` → Objeto `SignosVitales` (opcional)

**Resultado:** Sesión creada en estado `PENDIENTE`. Se incrementa `sesionesCompletadas` del tratamiento.

---

## 7. Cita (Agenda Inteligente)

**Endpoint:** `POST /api/v1/citas`

**Entidad:** `Cita`

**Campos obligatorios:**
- `pacienteId` → Paciente
- `usuarioId` → Doctor
- `tipoCitaId` → Tipo de cita
- `fecha`, `hora` → Fecha y hora de la cita
- `motivo` → Motivo de la cita

**Campos opcionales:**
- `duracionMinutos` → Duración (default: 30)
- `prioridad` → NORMAL, URGENTE (default: NORMAL)
- `tratamientoId` → Tratamiento asociado (si `TipoCita.requiereTratamiento = true`)

**Validaciones al crear:**
1. Doctor tiene Agenda configurada
2. Doctor trabaja ese día (Disponibilidad)
3. Hora dentro de la Disponibilidad
4. No hay Bloqueo en ese horario
5. No hay conflicto con otra Cita
6. Si `TipoCita.requiereTratamiento = true`, debe existir `tratamientoId`

---

## 8. Flujo de Estados de la Cita

```
pendiente → confirmada → asistio → completada
    ↓           ↓           ↓
reprogramada  cancelada  cancelada
```

**Transiciones:**
- `confirmar`: pendiente → confirmada
- `registrarAsistencia`: confirmada → asistio
- `completar`: asistio → completada (requiere consultaId)
- `cancelar`: pendiente/confirmada/asistio → cancelada
- `reprogramar`: pendiente/confirmada → reprogramada (crea nueva Cita)

---

## 9. Reprogramación de Citas

**Endpoint:** `PATCH /api/v1/citas/{id}/reprogramar`

**Flujo:**
1. Marca la Cita original como `reprogramada`
2. Crea nueva Cita con `reprogramadaDe = idOriginal`
3. Nueva Cita inicia en estado `pendiente`

**Validaciones:** Igual que crear Cita (Agenda, Disponibilidad, Bloqueos, Conflictos).

---

## 10. Disponibilidad por Fecha

**Endpoint:** `GET /api/v1/agenda/{usuarioId}/disponibilidad?fecha=2026-08-04&duracion=30`

**Retorna:** Lista de slots con estado:
- `DISPONIBLE` → Slot libre
- `OCUPADO` → Ya tiene Cita (描述: "Paciente María García")
- `BLOQUEADO` → Bloqueo del doctor (描述: "Almuerzo")
- `EN_BUFFER` → En zona de preparación (描述: "Preparación antes de cita")
- `INSUFICIENTE` → Duración insuficiente (描述: "Solo 20 minutos disponibles")

---

## 11. Próximo Slot Disponible

**Endpoint:** `GET /api/v1/agenda/{usuarioId}/next-available?duracion=30`

**Retorna:** Primer slot disponible a partir de hoy (máximo 30 días).

---

## 12. Sugerencia de Próxima Cita

**Endpoint:** `GET /api/v1/tratamientos/{tratamientoId}/sugerir-cita`

**Flujo:**
1. Obtiene frecuencia del Protocolo Clínico
2. Calcula fecha mínima (última sesión + frecuencia)
3. Si `permiteInicioInmediato = true`, puede iniciar hoy
4. Si `permiteInicioInmediato = false`, debe esperar al menos 1 día
5. Usa AvailabilityEngine para encontrar slots disponibles
6. Retorna fecha recomendada y horarios disponibles

---

## 13. Timeline del Paciente

**Endpoint:** `GET /api/v1/timeline/paciente/{pacienteId}`

**Retorna:** Historial cronológico del paciente:
- Consultas
- Activación de Tratamientos
- Sesiones programadas
- Citas
- Reprogramaciones

---

## Entidades Relacionadas

```
Paciente
  ├── Consulta (1:N)
  │     └── Tratamiento (1:1)
  │           ├── ProtocoloClinico (1:1)
  │           └── SugerenciaCitaService
  └── Cita (1:N)
        ├── TipoCita (N:1)
        └── Usuario (N:1)

Tratamiento
  └── SesionTratamiento (1:N) → POST /api/v1/sesiones-tratamiento

Agenda
  ├── Disponibilidad (1:N)
  ├── Bloqueo (1:N)
  └── Usuario (1:1)
```

---

## Reglas de Negocio

1. **REGLA #1:** NO romper módulos existentes
2. **REGLA #2:** NO modificar Paciente (solo extender con `pacienteId`)
3. **REGLA #3:** NO eliminar Consulta (módulo legacy coexiste)
4. **REGLA #4:** `common/` solo contiene concerns cross-cutting
5. **REGLA #5:** AvailabilityEngine vive en `agenda/engine/`
6. **REGLA #6:** Enums para estados del dominio (nunca Strings)
7. **REGLA #7:** Timeline es una proyección (no modifica datos)
8. **REGLA #8:** SignosVitales es un Value Object (sin identidad)

---

## Flujo Completo Ejemplo

1. **Paciente** se registra → `POST /pacientes`
2. **Paciente** tiene consulta → `POST /consultas`
3. Se evalúa: ¿Tiene tratamiento?
   - **NO** → Alta o Consulta de Control
   - **SI** → Continúa
4. Se crea **Tratamiento** → `POST /tratamientos`
5. Se programa **Tratamiento** → `PATCH /tratamientos/{id}/programar`
6. Se inicia **Tratamiento** → `PATCH /tratamientos/{id}/iniciar`
7. Se crea **Cita** para primera sesión → `POST /citas`
8. **Cita** se confirma → `PATCH /citas/{id}/confirmar`
9. **Paciente** llega → `PATCH /citas/{id}/asistencia`
10. Se registra **Sesión** → `POST /sesiones-tratamiento?tratamientoId={id}`
11. Se completa **Cita** → `PATCH /citas/{id}/completar?consultaId=123`
12. Se sugiere **Próxima Cita** → `GET /tratamientos/{id}/sugerir-cita`
13. Se crea nueva **Cita** → `POST /citas`
14. Repetir pasos 8-13 hasta completar tratamiento
15. Se finaliza **Tratamiento** → `PATCH /tratamientos/{id}/finalizar?resultadoFinal=X`
16. ¿Requiere Control? → Crear nueva Cita de Control
