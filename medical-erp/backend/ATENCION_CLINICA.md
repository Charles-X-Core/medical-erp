# ATENCION_CLINICA.md — Concepto de Atención

## Definición

Una **atención** representa un contacto entre el paciente y el sistema de salud. Cada atención tiene lugar en un momento específico, con un profesional de salud, y registra información clínica relevante.

## Tipos de Atención

| Tipo | Descripción | Ejemplo |
|---|---|---|
| **Consulta** | Primer contacto o evaluación general | Paciente llega con dolor de muelas |
| **Control** | Seguimiento de un tratamiento existente | Revisión post-tratamiento de conducto |
| **Sesión** | Sesión programada de un tratamiento | Limpieza dental, aplicación de braketes |
| **Evaluación** | Revisión específica para decidir tratamiento | Evaluación para implante |
| **Emergencia** | Atención urgente fuera de programación | Dolor agado, trauma dental |

## Atributos Comunes

Todas las atenciones comparten:

- `fecha` — Fecha y hora de la atención
- `profesional` — Doctor que realiza la atención
- `paciente` — Paciente que recibe la atención
- `signosVitales` — Mediciones clínicas (presión, pulso, temperatura, etc.)
- `observaciones` — Notas clínicas de la atención

## Representación en el Sistema

Una atención no es una entidad separada. Se representa mediante:

- **Consulta** → Para atenciones de tipo Consulta, Control, Evaluación
- **SesiónTratamiento** → Para atenciones de tipo Sesión
- **Cita** → Como contenedor de la atención (programación)

## Flujo de una Atención

1. Se crea una **Cita** (programación)
2. El paciente llega → se confirma asistencia
3. Se registra la atención:
   - Si es Consulta → se crea una **Consulta**
   - Si es Sesión → se registra una **SesiónTratamiento**
4. Se completa la Cita con referencia a la Consulta
5. Se sugiere la próxima atención (si aplica)

## Extensibilidad

En el futuro, nuevas tablas pueden representar nuevos tipos de atención:
- `Documentos` → Documentos clínicos adjuntos
- `Pagos` → Registros de pago
- `Laboratorio` → Resultados de laboratorio

El Timeline proyectará todas estas atenciones en una vista cronológica unificada.
