# Product Roadmap

---
Document ID: PRD-003
Status: Draft
Version: 1.0.0
Owner: Product
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [PRD-001, PRD-002]
---

## Overview

| Propiedad | Valor |
|---|---|
| **Duración total MVP** | 8 semanas |
| **Fecha inicio estimada** | 2026-07-28 |
| **Fecha fin estimada MVP** | 2026-09-22 |
| **Desarrolladores** | 1 |
| **Metodología** | Iterativa, incremental |

---

## Phase 1: Foundation (Semanas 1-2)

**Objetivo:** Establecer la base del sistema con autenticación y estructura de proyecto.

| Milestone | Semana | Estado | Descripción | Criterios de Aceptación |
|---|---|---|---|---|
| Project Setup | 1 | ✅ Completado | Estructura de proyecto, dependencias | Spring Boot + React funcionando |
| Domain Modeling | 1 | ✅ Completado | Modelado de dominio DDD | 7 documentos de dominio creados |
| Authentication | 1-2 | 🔄 En Progreso | JWT + Spring Security | Login/logout funcionando |
| User Management | 2 | ⏳ Pendiente | CRUD de usuarios | Admin puede gestionar usuarios |
| Database Schema | 2 | ⏳ Pendiente | MySQL + Migraciones | Tablas principales creadas |

**Entregables:**
- [x] Estructura de proyecto backend (Spring Boot)
- [x] Estructura de proyecto frontend (React)
- [ ] Autenticación JWT funcionando
- [ ] CRUD de usuarios
- [ ] Esquema de base de datos

**Riesgos:**
| Riesgo | Mitigación |
|---|---|
| Complejidad de Spring Security | Usar configuración mínima, iterar |

---

## Phase 2: Core ERP (Semanas 3-5)

**Objetivo:** Implementar los módulos principales del ERP.

| Milestone | Semana | Estado | Descripción | Criterios de Aceptación |
|---|---|---|---|---|
| Patient CRUD | 3 | ⏳ Pendiente | Crear, leer, actualizar pacientes | Búsqueda por nombre/DNI funciona |
| Agenda Management | 3-4 | ⏳ Pendiente | Configurar disponibilidad | Doctora puede definir horarios |
| Appointments | 4 | ⏳ Pendiente | Reservar, confirmar, cancelar citas | Flujo completo de citas |
| Medical History | 4-5 | ⏳ Pendiente | Historias clínicas automáticas | Número HCL generado |
| Consultations | 5 | ⏳ Pendiente | Crear consultas con signos vitales | Consulta vinculada a historia |

**Entregables:**
- [ ] Módulo de Pacientes completo
- [ ] Módulo de Agenda completo
- [ ] Módulo de Citas completo
- [ ] Módulo de Historias Clínicas completo
- [ ] Módulo de Consultas completo

**Dependencias:**
```
Pacientes → Historias Clínicas → Consultas
     ↓
   Agenda → Citas → Consultas
```

---

## Phase 3: Documents & PWA (Semanas 6-7)

**Objetivo:** Implementar generación de documentos y interfaz tablet.

| Milestone | Semana | Estado | Descripción | Criterios de Aceptación |
|---|---|---|---|---|
| PDF Generation | 6 | ⏳ Pendiente | Generar PDF desde consulta | PDF descargable con datos correctos |
| Digital Signature | 6 | ⏳ Pendiente | Firma canvas | Firma guardada en documento |
| Document Archive | 6-7 | ⏳ Pendiente | Archivado con hash SHA256 | Integridad verificable |
| PWA Setup | 7 | ⏳ Pendiente | Service worker, manifest | Instalable en tablet |
| Offline Support | 7 | ⏳ Pendiente | Lectura sin internet | Datos accesibles offline |

**Entregables:**
- [ ] Generación de PDF funcionando
- [ ] Firma digital implementada
- [ ] Sistema de archivado completo
- [ ] PWA instalable
- [ ] Soporte offline para lectura

**Dependencias:**
```
Consultas → PDF Generation → Digital Signature → Archive
```

---

## Phase 4: Landing & Polish (Semana 8)

**Objetivo:** Completar landing page y pulir detalles.

| Milestone | Semana | Estado | Descripción | Criterios de Aceptación |
|---|---|---|---|---|
| Landing Page | 8 | ⏳ Pendiente | Página de inicio | Responsive, informática |
| Contact Form | 8 | ⏳ Pendiente | Formulario de contacto | Mensaje enviado correctamente |
| Testing | 8 | ⏳ Pendiente | Pruebas completas | Todos los flujos principales funcionan |
| Documentation | 8 | ⏳ Pendiente | Documentación de usuario | Guía básica disponible |
| Deployment | 8 | ⏳ Pendiente | Deploy a VPS | Sistema accesible públicamente |

**Entregables:**
- [ ] Landing page completa
- [ ] Formulario de contacto
- [ ] Pruebas de integración
- [ ] Documentación de usuario
- [ ] Sistema en producción

---

## Timeline Visual

```
2026
Jul 28                                                              Sep 22
  │                                                                    │
  ├─ Week 1 ──┬─ Week 2 ──┬─ Week 3 ──┬─ Week 4 ──┬─ Week 5 ──┬─ Week 6 ──┬─ Week 7 ──┬─ Week 8 ─┤
  │           │           │           │           │           │           │           │          │
  │  FOUNDATION          │    CORE ERP           │    DOCUMENTS & PWA   │  LANDING  │
  │           │           │           │           │           │           │           │          │
  │  ✓ Setup  │  ✓ Auth   │  Patients │  Citas    │  PDF      │  PWA      │  Landing  │
  │  ✓ Domain │  Users    │  Agenda   │  History  │  Sign     │  Offline  │  Testing  │
  │           │  DB       │           │  Consults │  Archive  │           │  Deploy   │
  │           │           │           │           │           │           │          │
  └───────────┴───────────┴───────────┴───────────┴───────────┴───────────┴───────────┘
```

---

## Progress Summary

| Phase | Milestones | Completed | In Progress | Pending | % Complete |
|---|---|---|---|---|---|
| Phase 1: Foundation | 5 | 2 | 1 | 2 | 40% |
| Phase 2: Core ERP | 5 | 0 | 0 | 5 | 0% |
| Phase 3: Documents & PWA | 5 | 0 | 0 | 5 | 0% |
| Phase 4: Landing & Polish | 5 | 0 | 0 | 5 | 0% |
| **TOTAL** | **20** | **2** | **1** | **17** | **10%** |

---

## Milestones by Module

| Module | Phase | Milestone | Status | Target Date |
|---|---|---|---|---|
| Security | 1 | Authentication | 🔄 En Progreso | Week 2 |
| Security | 1 | User Management | ⏳ Pendiente | Week 2 |
| Patients | 2 | Patient CRUD | ⏳ Pendiente | Week 3 |
| Agenda | 2 | Agenda Management | ⏳ Pendiente | Week 3-4 |
| Appointments | 2 | Appointments | ⏳ Pendiente | Week 4 |
| History | 2 | Medical History | ⏳ Pendiente | Week 4-5 |
| Consultations | 2 | Consultations | ⏳ Pendiente | Week 5 |
| Documents | 3 | PDF Generation | ⏳ Pendiente | Week 6 |
| Documents | 3 | Digital Signature | ⏳ Pendiente | Week 6 |
| Documents | 3 | Document Archive | ⏳ Pendiente | Week 6-7 |
| PWA | 3 | PWA Setup | ⏳ Pendiente | Week 7 |
| PWA | 3 | Offline Support | ⏳ Pendiente | Week 7 |
| Landing | 4 | Landing Page | ⏳ Pendiente | Week 8 |
| Landing | 4 | Contact Form | ⏳ Pendiente | Week 8 |
| QA | 4 | Testing | ⏳ Pendiente | Week 8 |
| Docs | 4 | Documentation | ⏳ Pendiente | Week 8 |
| DevOps | 4 | Deployment | ⏳ Pendiente | Week 8 |

---

## Success Criteria by Phase

### Phase 1: Foundation
- [ ] User can login/logout
- [ ] Admin can create users
- [ ] Database schema is stable
- [ ] Domain model is approved

### Phase 2: Core ERP
- [ ] Patient registration < 2 minutes
- [ ] Appointment scheduling works
- [ ] Medical history auto-generated
- [ ] Consultation creation < 5 minutes

### Phase 3: Documents & PWA
- [ ] PDF generation < 10 seconds
- [ ] Digital signature captured
- [ ] Document integrity verifiable
- [ ] PWA installable on tablet
- [ ] Offline reading works

### Phase 4: Landing & Polish
- [ ] Landing page responsive
- [ ] Contact form functional
- [ ] All critical bugs fixed
- [ ] System deployed and accessible

---

## Risk Register

| Risk | Phase | Probability | Impact | Mitigation |
|---|---|---|---|---|
| Spring Security complexity | 1 | High | Medium | Minimal config, iterate |
| PDF generation issues | 3 | Medium | High | Test early, fallback to iText |
| PWA offline sync | 3 | Medium | Medium | Start with read-only offline |
| Timeline overrun | Any | Medium | High | Cut non-critical features |
| Low user adoption | 4 | Low | High | Involve users early |

---

## Decision Points

| Decision | Phase | Date | Status |
|---|---|---|---|
| Use Spring Boot vs Node.js | 1 | 2026-07-28 | ✅ Decided: Spring Boot |
| MySQL vs PostgreSQL | 1 | 2026-07-28 | ✅ Decided: MySQL |
| React vs Vue | 1 | 2026-07-28 | ✅ Decided: React |
| PWA vs Native | 2 | TBD | ⏳ Pending |
| iText vs other PDF lib | 3 | TBD | ⏳ Pending |

---

## Glossary Reference

Todos los términos del dominio están definidos en: DOM-UL-001 (Ubiquitous Language)
