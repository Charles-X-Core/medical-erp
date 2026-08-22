# Product Scope

---
Document ID: PRD-002
Status: Draft
Version: 1.0.0
Owner: Product
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [PRD-001]
---

## 1. In Scope

### 1.1 ERP — Pacientes

| Funcionalidad | Descripción | Prioridad |
|---|---|---|
| Registro de pacientes | Crear nuevo paciente con datos personales | CRÍTICO |
| Búsqueda de pacientes | Por nombre, DNI, teléfono | CRÍTICO |
| Historial de pacientes | Ver/editar datos existentes | CRÍTICO |
| Desactivar pacientes | Marcar como inactivo (soft delete) | ALTO |
| Antecedentes médicos | Alergias, antecedentes personales/familiares | ALTO |
| Contacto de emergencia | Nombre, teléfono de emergencia | MEDIO |

**Documentos de Dominio:** DOM-PAC-001

### 1.2 ERP — Agenda

| Funcionalidad | Descripción | Prioridad |
|---|---|---|
| Gestión de agenda | Configurar disponibilidad por día/hora | CRÍTICO |
| Bloqueo de horarios | Bloquear fechas/horas específicas | ALTO |
| Tipos de cita | Configurar tipos (consulta, control, emergencia) | MEDIO |
| Visualización diaria | Ver citas del día | CRÍTICO |
| Visualización semanal | Ver citas de la semana | ALTO |

**Documentos de Dominio:** DOM-AGE-001

### 1.3 ERP — Citas

| Funcionalidad | Descripción | Prioridad |
|---|---|---|
| Reservar cita | Agendar nueva cita | CRÍTICO |
| Confirmar cita | Marcar como confirmada | CRÍTICO |
| Registrar asistencia | Marcar que paciente asistió | CRÍTICO |
| Completar cita | Vincular con consulta creada | CRÍTICO |
| Cancelar cita | Cancelar con motivo | ALTO |
| Notas de cita | Agregar notas adicionales | MEDIO |

**Documentos de Dominio:** DOM-CIT-001

### 1.4 ERP — Consultas

| Funcionalidad | Descripción | Prioridad |
|---|---|---|
| Crear consulta | Registrar encuentro médico | CRÍTICO |
| Signos vitales | PA, pulso, temperatura, peso, talla | CRÍTICO |
| Diagnósticos | Lista con código CIE-10 | CRÍTICO |
| Plan de tratamiento | Tratamiento prescrito | ALTO |
| Relato cronológico | Narrativa de la consulta | MEDIO |
| Examen clínico | Hallazgos del examen | ALTO |

**Documentos de Dominio:** DOM-CON-001

### 1.5 ERP — Historias Clínicas

| Funcionalidad | Descripción | Prioridad |
|---|---|---|
| Crear historia | Generar automáticamente al registrar paciente | CRÍTICO |
| Número de historia | Formato HCL-YYYY-NNNNN | CRÍTICO |
| Antecedentes | Cardiopatías, diabetes, hepatitis, etc. | ALTO |
| Historial de consultas | Lista cronológica de consultas | CRÍTICO |

**Documentos de Dominio:** DOM-HCL-001

### 1.6 ERP — Documentos Médicos

| Funcionalidad | Descripción | Prioridad |
|---|---|---|
| Generar PDF | Crear documento PDF desde consulta | CRÍTICO |
| Firmar documento | Firma digital (canvas) | CRÍTICO |
| Archivar documento | Mover a estado archivado | ALTO |
| Descargar PDF | Obtener archivo para impresión | CRÍTICO |
| Hash SHA256 | Garantizar integridad del documento | ALTO |
| Tipos de documento | Receta, historia, informe, consentimiento | ALTO |

**Documentos de Dominio:** DOM-DOC-001

### 1.7 ERP — Seguridad

| Funcionalidad | Descripción | Prioridad |
|---|---|---|
| Autenticación JWT | Login con token | CRÍTICO |
| RBAC | Roles: admin, doctora, enfermera | CRÍTICO |
| Gestión de usuarios | CRUD de usuarios del sistema | ALTO |
| Auditoría | Log de acciones importantes | ALTO |

**Documentos de Dominio:** DOM-SEG-001

### 1.8 Landing Page

| Funcionalidad | Descripción | Prioridad | Estado |
|---|---|---|---|
| Página de inicio | Presentación de la clínica | ALTO | ✅ COMPLETADO |
| Información de contacto | Dirección, teléfono, email | ALTO | ✅ COMPLETADO |
| Formulario de contacto | Mensaje directo a la clínica | ALTO | ✅ COMPLETADO |
| Responsive | Optimizado para móviles | ALTO | ✅ COMPLETADO |
| Conexión backend | Envío de correo electrónico | ALTO | ⏳ PENDIENTE |

### 1.9 PWA Tablet

| Funcionalidad | Descripción | Prioridad |
|---|---|---|
| Interfaz táctil | Optimizada para tablets | CRÍTICO |
| Offline-first | Funcionar sin internet | ALTO |
| Instalación | Agregar a pantalla de inicio | ALTO |
| Sincronización | Subir datos cuando haya internet | ALTO |

### 1.10 Backend API

| Funcionalidad | Descripción | Prioridad |
|---|---|---|
| REST API | Endpoints para todas las operaciones | CRÍTICO |
| MySQL | Base de datos relacional | CRÍTICO |
| Migraciones | Flyway para versionado de schema | ALTO |
| Logging | Registro de errores y accesos | ALTO |

---

## 2. Out of Scope

### 2.1 Funcionalidades Excluidas del MVP

| Funcionalidad | Razón de Exclusión |
|---|---|
| **Sistema de facturación** | Requiere integración con contabilidad |
| **Portal web para pacientes** | Complejidad adicional de autenticación |
| **Integración con seguros** | Requiere APIs externas, compliance |
| **App nativa móvil** | PWA cubre necesidades del MVP |
| **Sistema de laboratorio** | Integración futura |
| **Multi-idioma** | Mercado local primero |
| **Multi-sucursal** | MVP para clínica única |
| **Reportes avanzados** | Análisis básico primero |
| **Integración con calendario** | Google/Apple Calendar |
| **Notificaciones SMS** | Email es suficiente para MVP |
| **Odontograma** | Especializado, puede ser addon |
| **Telemedicina** | Fuera de alcance |

### 2.2 Modelos de Negocio Excluidos

| Modelo | Razón |
|---|---|
| SaaS multi-tenant | MVP para clínica única |
| Marketplace de doctores | No es el foco |
| Venta de cursos/educación | No relacionado |

---

## 3. Future Considerations

### 3.1 Funcionalidades Planeadas (Post-MVP)

| Funcionalidad | Fase | Dependencias |
|---|---|---|
| **Recetas digitales** | Fase 2 | Documentos funcionando |
| **Portal del paciente** | Fase 3 | Autenticación avanzada |
| **Integración con laboratorios** | Fase 3 | APIs externas |
| **Reportes automáticos** | Fase 3 | Datos suficientes |
| **Multi-sucursal** | Fase 4 | Arquitectura escalable |
| **App nativa** | Fase 4 | PWA probada |

### 3.2 Mejoras Técnicas Planeadas

| Mejora | Descripción |
|---|---|
| **IndexedDB** | Almacenamiento local más robusto |
| **Service Workers** | Mejor soporte offline |
| **Push Notifications** | Notificaciones nativas |
| **PWA para iOS** | Mejor compatibilidad |
| **CDN** | Distribución de assets |
| **Cache strategies** | Optimización de rendimiento |

---

## 4. Dependencies

### 4.1 Dependencias Externas

| Dependencia | Tipo | Estado | Alternativa |
|---|---|---|---|
| **Gmail SMTP** | Email | Activa | Mailtrap (testing) |
| **MySQL 8.x** | Base de datos | Activa | PostgreSQL (futuro) |
| **Java 21** | Runtime | Activa | Ninguna |
| **Spring Boot 3.x** | Framework | Activa | Ninguna |
| **React 18** | Frontend | Activa | Vue.js (alternativa) |
| **Vite** | Build tool | Activa | Webpack (alternativa) |

### 4.2 Dependencias de Hardware

| Recurso | Especificación |
|---|---|
| **CPU** | 6 vCPU Cores |
| **RAM** | 12 GB |
| **Storage** | 200 GB SSD |
| **Port** | 300 Mbit/s |
| **Snapshots** | 2 disponibles |
| **Tablet** | Android 8+, 8" screen (recomendado: Android 12+, 10") |
| **Computador** | Chrome 90+, 4GB RAM (recomendado: Chrome 100+, 8GB RAM) |

### 4.3 Dependencias de Red

| Requisito | Mínimo | Ideal |
|---|---|---|
| **Ancho de banda** | 1 Mbps | 10 Mbps |
| **Latencia** | < 100ms | < 50ms |
| **Disponibilidad** | 95% | 99.9% |

---

## 5. Scope Validation

### 5.1 Criterios de Aceptación por Módulo

#### Pacientes
- [ ] CRUD completo funcionando
- [ ] Búsqueda por nombre/DNI
- [ ] Validaciones de negocio implementadas
- [ ] Soft delete (desactivar)

#### Citas
- [ ] Reservar cita con validación de horario
- [ ] Flujo completo: pendiente → confirmada → asistio → completada
- [ ] Cancelar con motivo
- [ ] Vista diaria/semanal

#### Consultas
- [ ] Crear consulta vinculada a historia
- [ ] Registrar signos vitales
- [ ] Agregar diagnósticos (CIE-10 básico)
- [ ] Plan de tratamiento

#### Documentos
- [ ] Generar PDF desde consulta
- [ ] Firma digital (canvas)
- [ ] Hash SHA256 para integridad
- [ ] Descarga para impresión

#### Seguridad
- [ ] Login/logout con JWT
- [ ] RBAC funcionando
- [ ] Auditoría básica

---

## 6. Scope Management

### 6.1 Cómo se Manejan los Cambios

1. **Nueva funcionalidad solicitada:**
   - ¿Es crítica para el MVP? → Agregar a In Scope
   - ¿Puede esperar? → Agregar a Future Considerations
   - ¿No aplica? → Agregar a Out of Scope

2. **Funcionalidad en desarrollo:**
   - Si se complica, evaluar si mover a Future Considerations
   - Documentar razón del cambio

3. **Funcionalidad completada:**
   - Verificar contra criterios de aceptación
   - Actualizar estado en roadmap

### 6.2 Límites del Scope

| Límite | Definición |
|---|---|
| **Tiempo** | 8 semanas para MVP |
| **Recursos** | 1 desarrollador |
| **Presupuesto** | Hosting < $50/mes |
| **Complejidad** | Máximo 7 módulos principales |

---

## 7. Glossary Reference

Todos los términos del dominio están definidos en: DOM-UL-001 (Ubiquitous Language)
