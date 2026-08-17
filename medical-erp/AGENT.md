# AGENT.md — Medical ERP Engineering Constitution

---
Document ID: CONSTITUTION
Status: Approved
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: true
Depends On: []
---

> **Authority Level:** Highest — supersedes all other documentation
> **Language:** English (all documentation must be in English)

---

## 1. Project Identity

### 1.1 What This Project Is

Medical ERP is a production-grade platform designed to manage:

- Patient records and personal data
- Clinical histories and medical notes
- Appointment scheduling and calendar
- Medical documents with digital signatures
- PDF generation with embedded signatures

The platform serves a medical practice specializing in alternative medicine, cellular supplementation, and regenerative therapies.

### 1.2 What This Project Is NOT

This project is:

- **NOT** a prototype or demo
- **NOT** a playground for experiments
- **NOT** a monolith full of shortcuts
- **NOT** an experimental repository
- **NOT** a temporary solution

This project is a long-term, maintainable system handling sensitive patient data.

---

## 2. Purpose & Scope

### 2.1 Purpose of This Document

This document (AGENT.md) is the engineering constitution of the Medical ERP project. It defines:

- How agents should think and decide
- What is allowed and prohibited
- How knowledge flows through the project
- The hierarchy of documentation

### 2.2 Project Scope

| In Scope | Out of Scope |
|---|---|
| Patient management (CRUD) | Multi-tenant architecture |
| Clinical history | Telemedicine |
| Appointment scheduling | Billing/invoicing |
| PDF generation | Mobile native apps |
| Digital signature | Real-time video |
| Email notifications | Third-party integrations (initially) |
| PWA for tablet | Desktop application |

### 2.3 Target Users

| Role | Description |
|---|---|
| Doctora | Primary physician, full access |
| Enfermera | Nursing staff, limited access |

---

## 3. Core Principles

### 3.1 Documentation First

**NEVER. EVER. Write code before documentation exists.**

Correct flow:
```
Idea → Document → Approval → Implementation → Testing → Update Document → Done
```

Incorrect flow:
```
Idea → Code → Docs (NEVER)
```

This rule prevents 90% of technical debt.

### 3.2 Progressive Context Loading

Agents MUST NOT load all documentation. Read only what is needed for the current task.

Standard flow:
```
1. Read AGENT.md
2. Read .agent/workflow.md
3. Read docs/99-reference/document-map.md
4. Identify task type
5. Read ONLY required documents
6. Work
```

### 3.3 Separation of Responsibilities

| Layer | Answers | Location |
|---|---|---|
| Constitution | HOW agents should think | AGENT.md |
| Specifications | WHAT the system must build | docs/ |
| Agent Operation | HOW to execute tasks | .agent/ |
| Implementation | THE code | src/ |

`docs/` NEVER explains how to code.
`.agent/` NEVER defines what to build.

### 3.4 Security First

Patient data is sensitive. Security is not optional. Every decision must consider security implications.

### 3.5 Data Integrity

Data must be accurate, consistent, and reliable at all times. No corruption, no loss, no ambiguity.

### 3.6 Transparency

All decisions must be documented and traceable. No hidden logic, no undocumented behavior.

### 3.7 Maintainability

Code and documentation must be maintainable long-term. Today's shortcut is tomorrow's technical debt.

### 3.8 Reliability

The system must be reliable and available when needed. Failures must be handled gracefully.

---

## 4. Document Authority

### 4.1 Hierarchy

```
1. AGENT.md                              (Constitution — highest authority)
2. docs/00-product/documentation-governance.md (Document governance)
3. docs/*                                (Specifications)
4. .agent/*                              (Agent guides)
5. templates/*                           (Templates)
6. logs/*                                (History)
```

If any contradiction exists between documents, the higher authority wins.

### 4.2 Conflict Resolution

| Situation | Resolution |
|---|---|
| Two documents conflict | Higher authority wins |
| Same authority level | Newer version wins |
| Still unclear | Escalate to Architecture |

### 4.3 Document IDs

- IDs are permanent and NEVER reused
- If a document is deleted, its ID is retired
- IDs enable precise cross-referencing

### 4.4 Document Status

Every document MUST have a status:

| Status | Description |
|---|---|
| Draft | Initial creation, incomplete |
| Review | Complete, awaiting approval |
| Approved | Verified, authoritative |
| Deprecated | No longer valid |

### 4.5 Source of Truth

If `Source of Truth: true`, that document is the canonical authority for its topic. No derived document may contradict it. When conflicts arise, update the source document first, then update derived documents.

---

## 5. Agent Responsibilities

### 5.1 When Receiving a Task

Every agent MUST follow these steps in order:

| Step | Action | Description |
|---|---|---|
| 1 | Comprehend | Understand the task fully |
| 2 | Investigate | Research relevant information |
| 3 | Find Documents | Locate necessary documentation |
| 4 | Analyze Dependencies | Identify impacts on other documents |
| 5 | Build a Plan | Define approach and steps |
| 6 | Ask if Uncertain | Clarify ambiguities before proceeding |
| 7 | Implement | Execute the changes |
| 8 | Validate | Verify the changes work |
| 9 | Update Documentation | Keep docs synchronized |
| 10 | Finalize | Confirm task completion |

### 5.2 Documentation Debt Detection

When an agent modifies code and detects outdated documentation, it MUST report:

```
Documentation Debt Detected

Document: {document-id}
Reason: {what is outdated}
Impact: {what is affected}
Action: {what needs updating}
Severity: Critical | Warning | Info
```

| Severity | Definition | Agent Action |
|---|---|---|
| Critical | Code contradicts documentation | MUST stop and resolve |
| Warning | Minor update missing | May continue, report |
| Info | Improvement suggestion | Optional, report |

---

## 6. Decision Hierarchy

### 6.1 Decision Levels

| Level | Scope | Who Decides |
|---|---|---|
| Architectural | Technology, patterns, security | Architecture |
| Design | Module structure, API design | Module Owner |
| Implementation | Code details | Developer/Agent |

### 6.2 When to Escalate

- Requirement is ambiguous
- Multiple valid approaches exist
- Change affects security
- Change affects data integrity
- Change affects production
- Documentation Debt is Critical
- Conflict between documents

### 6.3 Escalation Process

1. Document the issue clearly
2. Identify affected documents
3. Present options with trade-offs
4. Wait for decision
5. Proceed only after approval

---

## 7. Progressive Context Loading

### 7.1 Rule

Agents MUST NOT load all documentation. Read only what is needed for the current task.

### 7.2 Standard Flow

```
1. Read AGENT.md
2. Read .agent/workflow.md
3. Read docs/99-reference/document-map.md
4. Identify task type
5. Read ONLY required documents (see context-matrix.md)
6. Work
```

### 7.3 Task-Based Reading

| Task Type | Required Documents |
|---|---|
| Entity change | DOM-{entity} + DB-001 |
| API change | API-002 + API-001 + DOM-{entity} |
| Security change | SEC-001 + SEC-{relevant} |
| Database change | DB-001 + DB-003 |
| Deployment change | OPS-001 + OPS-002 |
| New ADR | ADR-TPL + AGT-DEC |

See `docs/99-reference/context-matrix.md` for complete mapping.

---

## 8. Documentation First

### 8.1 The Rule

**NEVER. EVER. Write code before documentation exists.**

### 8.2 Correct Flow

```
Idea → Document → Approval → Implementation → Testing → Update Document → Done
```

### 8.3 Incorrect Flow

```
Idea → Code → Docs (NEVER)
```

### 8.4 Rationale

Writing code before documentation leads to:

- Undocumented decisions
- Inconsistent implementations
- Technical debt
- Confusion for future developers/agents
- Systems that cannot be maintained

### 8.5 Enforcement

An agent that finds code without documentation MUST report it as Documentation Debt.

---

## 9. Task Lifecycle

### 9.1 Lifecycle

```
Task
  ↓
Analysis
  ↓
Planning
  ↓
Documentation
  ↓
Implementation
  ↓
Verification
  ↓
Documentation Update
  ↓
Review
  ↓
Completed
```

### 9.2 Phase Descriptions

| Phase | Description |
|---|---|
| Task | Receive and understand the task |
| Analysis | Research and gather information |
| Planning | Define approach and identify impacts |
| Documentation | Write/update documentation first |
| Implementation | Write code following conventions |
| Verification | Test and validate changes |
| Documentation Update | Sync docs with code changes |
| Review | Self-review against checklist |
| Completed | Task finished, ready for next |

### 9.3 Critical Gates

- Documentation MUST exist before implementation
- Tests MUST pass before verification
- Documentation MUST be updated before completion

---

## 10. Forbidden Actions

### 10.1 Absolutely Prohibited

- Writing code before documentation exists
- Loading all documentation at once
- Skipping documentation updates
- Ignoring Documentation Debt
- Reusing deprecated Document IDs
- Modifying AGENT.md without ADR
- Changing document hierarchy without approval
- Making architectural decisions without documentation
- Mixing languages in documentation (use English only)

### 10.2 Requires Approval

- Creating new directories (without ADR)
- Schema changes
- Security changes
- Breaking changes
- New ADRs

---

## 11. Escalation Rules

### 11.1 When to Stop and Ask

| Situation | Action |
|---|---|
| Requirement is ambiguous | Stop, ask for clarification |
| Multiple valid approaches | Stop, present options |
| Security impact | Stop, wait for approval |
| Data integrity risk | Stop, document and ask |
| Production impact | Stop, wait for approval |
| Critical Documentation Debt | Stop, resolve first |
| Document conflict | Stop, escalate |

### 11.2 How to Escalate

1. Document the issue
2. Identify affected documents
3. Present options with trade-offs
4. Wait for decision
5. Proceed only after approval

---

## 12. Completion Criteria

### 12.1 A Task is Complete Only When

1. Code is validated (tests pass)
2. Affected documentation is updated
3. CHANGELOG.md is updated (if visible changes)
4. Decision is registered in logs/decisions/ (if architectural)
5. Project is ready for commit

### 12.2 Definition of Done

| Criterion | Status |
|---|---|
| All tests pass | Must be true |
| Documentation is current | Must be true |
| No Critical Documentation Debt | Must be true |
| CHANGELOG reflects changes | Must be true |
| Ready for review | Must be true |

### 12.3 Commit Readiness

The agent does NOT execute git commits unless explicitly requested. The agent prepares everything for a commit but leaves the actual commit to the user.

---

## Document Map

| Document ID | Title | Directory |
|---|---|---|
| CONSTITUTION | AGENT.md | / |
| GOV-001 | Documentation Governance | docs/00-product/ |
| PRD-001 | Vision | docs/00-product/ |
| PRD-002 | Scope | docs/00-product/ |
| PRD-003 | Roadmap | docs/00-product/ |
| ARCH-001 | Architecture | docs/01-architecture/ |
| ARCH-002 | Modules | docs/01-architecture/ |
| ARCH-003 | Folder Structure | docs/01-architecture/ |
| ARCH-004 | Tech Stack | docs/01-architecture/ |
| DOM-PAT-001 | Patients | docs/02-domain/ |
| DOM-HCL-001 | Clinical History | docs/02-domain/ |
| DOM-CON-001 | Consultations | docs/02-domain/ |
| DOM-CIT-001 | Appointments | docs/02-domain/ |
| DOM-DOC-001 | Documents | docs/02-domain/ |
| DOM-CON-002 | Landing Contact | docs/02-domain/ |
| SEC-001 | Security Policy | docs/03-security/ |
| SEC-002 | Authentication | docs/03-security/ |
| SEC-003 | Authorization | docs/03-security/ |
| SEC-004 | Audit | docs/03-security/ |
| SEC-005 | Encryption | docs/03-security/ |
| SEC-006 | Backups | docs/03-security/ |
| DB-001 | ERD | docs/04-database/ |
| DB-002 | Conventions | docs/04-database/ |
| DB-003 | Migrations | docs/04-database/ |
| API-001 | REST Conventions | docs/05-api/ |
| API-002 | Endpoints | docs/05-api/ |
| API-003 | Errors | docs/05-api/ |
| DEV-001 | Coding Standards | docs/06-development/ |
| DEV-002 | Branch Strategy | docs/06-development/ |
| DEV-003 | Testing | docs/06-development/ |
| OPS-001 | Docker | docs/07-deployment/ |
| OPS-002 | Production | docs/07-deployment/ |
| OPS-003 | Monitoring | docs/07-deployment/ |
| REF-001 | Project Glossary | docs/99-reference/ |
| REF-002 | Document Map | docs/99-reference/ |
| REF-003 | Dependency Graph | docs/99-reference/ |
| REF-004 | Reading Order | docs/99-reference/ |
| REF-005 | Context Matrix | docs/99-reference/ |
| REF-006 | Naming | docs/99-reference/ |
| AGT-WF | Workflow | .agent/ |
| AGT-BE | Backend | .agent/ |
| AGT-DB | Database | .agent/ |
| AGT-FE | Frontend | .agent/ |
| AGT-SEC | Security | .agent/ |
| AGT-OPS | DevOps | .agent/ |
| AGT-CON | Conventions | .agent/ |
| AGT-PRM | Prompts | .agent/ |
| AGT-CR | Code Review | .agent/ |
| AGT-CK | Checklists | .agent/ |
| AGT-LOG | Logging | .agent/ |
| AGT-DEC | Decisions | .agent/ |

---

## 14. Documentation Infrastructure

The documentation infrastructure is governed by GOV-001.

Structural modifications are governed exclusively by the Documentation Governance policy.
