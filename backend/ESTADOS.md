# ESTADOS.md — Máquinas de Estado

## Cita

```
pendiente → confirmada → asistio → completada
    ↓           ↓           ↓
reprogramada  cancelada  cancelada
```

**Transiciones:**
- `pendiente → confirmada`: `PATCH /citas/{id}/confirmar`
- `confirmada → asistio`: `PATCH /citas/{id}/asistencia`
- `asistio → completada`: `PATCH /citas/{id}/completar?consultaId=X`
- `cualquier estado → cancelada`: `PATCH /citas/{id}/cancelar?motivo=X`
- `cualquier estado → reprogramada`: `PATCH /citas/{id}/reprogramar` (crea nueva Cita)

---

## Tratamiento

```
PENDIENTE → PROGRAMADO → EN_CURSO → FINALIZADO
                  ↓           ↓
               CANCELADO   PAUSADO → EN_CURSO
```

**Transiciones:**
- `PENDIENTE → PROGRAMADO`: `PATCH /tratamientos/{id}/programar`
- `PROGRAMADO → EN_CURSO`: `PATCH /tratamientos/{id}/iniciar`
- `PROGRAMADO → CANCELADO`: `PATCH /tratamientos/{id}/cancelar?motivo=X`
- `EN_CURSO → FINALIZADO`: `PATCH /tratamientos/{id}/finalizar?resultadoFinal=X`
- `EN_CURSO → PAUSADO`: `PATCH /tratamientos/{id}/pausar?motivo=X`
- `PAUSADO → EN_CURSO`: `PATCH /tratamientos/{id}/reanudar`
- `EN_CURSO → CANCELADO`: `PATCH /tratamientos/{id}/cancelar?motivo=X`

---

## Sesión de Tratamiento

```
PENDIENTE → EN_PROGRESO → COMPLETADA
                ↓
            CANCELADA
```

**Transiciones:**
- `PENDIENTE → EN_PROGRESO`: Al iniciar la sesión
- `EN_PROGRESO → COMPLETADA`: Al finalizar la sesión
- `PENDIENTE/EN_PROGRESO → CANCELADA`: Al cancelar la sesión

---

## Protocolo Clínico

No tiene máquina de estados. Se crea automáticamente al activar un Tratamiento y se puede actualizar en cualquier momento.

---

## Agenda

No tiene máquina de estados. Se crea, se actualiza y se puede eliminar.
