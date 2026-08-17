# ARQUITECTURA.md — Reglas Generales del Backend

## Dominios

| Dominio | Responsabilidad |
|---|---|
| **Seguridad** | Autenticación, autorización, roles, usuarios |
| **Pacientes** | Registro y gestión de pacientes |
| **Historia** | Historia clínica del paciente |
| **Consulta** | Atenciones clínicas (consultas, controles) |
| **Tratamiento** | Tratamientos, protocolos, sesiones |
| **Agenda** | Disponibilidad, bloqueos, tipos de cita |
| **Cita** | Programación y gestión de citas |
| **Timeline** | Proyección cronológica de eventos del paciente |
| **Storage** | Almacenamiento de archivos |
| **Auditoría** | Registro de cambios y auditoría |

## Reglas de Arquitectura

### 1. Módulos independientes
Los módulos nunca acceden directamente a otros módulos. Toda comunicación ocurre mediante Services públicos.

### 2. Timeline es una proyección
El Timeline no modifica datos. Solo consulta repositorios de otros módulos y construye una vista cronológica.

### 3. AvailabilityEngine es un motor puro
El AvailabilityEngine sigue el patrón Entrada → Cálculo → Salida. No tiene persistencia, no valida reglas de negocio, no consulta repositorios.

### 4. SignosVitales es un Value Object
SignosVitales no tiene identidad, no tiene CRUD, no tiene Repository. Siempre pertenece a unaConsulta o SesiónTratamiento.

### 5. common contiene componentes transversales
El paquete `common/` solo contiene:
- `ApiResponse` — Wrapper genérico de respuestas
- `SecurityUtils` — Utilidades de seguridad
- `Auditable` — AOP para auditoría
- `SignosVitales` — Value Object de signos vitales
- `JsonMapperHelper` — Helper de serialización JSON
- `GlobalExceptionHandler` — Manejo global de excepciones

### 6. Máquinas de estado
Cada entidad con estados define una máquina de estados clara con transiciones válidas documentadas. Ver `ESTADOS.md`.

### 7. Enums para estados
Nunca usar Strings para representar estados del dominio. Siempre usar enums.

### 8. Multi-tenancy
Todos los datos están scoped por `clinicaId`. Las consultas deben filtrar por clínica.

### 9. Auditoría
Los cambios importantes se registran en el historial administrativo y clínico.

### 10. Validación de negocio
Las reglas de negocio se validan en Services, no en Controllers ni en Entities.
