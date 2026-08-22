# Workflow Guide

---
Document ID: AGT-WF
Status: Approved
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: false
Depends On: [CONSTITUTION, GOV-001]
---

## 1. When Receiving a Task

Every agent MUST follow these steps in order:

| Step | Action | Description |
|---|---|---|
| 1 | Comprehend | Read task carefully, understand goal |
| 2 | Investigate | Research context, gather information |
| 3 | Find Documents | Locate relevant documentation |
| 4 | Analyze Dependencies | Identify impacts on other documents |
| 5 | Build a Plan | Define approach and steps |
| 6 | Ask if Uncertain | Clarify ambiguities before proceeding |
| 7 | Implement | Execute the changes |
| 8 | Validate | Verify the changes work |
| 9 | Update Documentation | Keep docs synchronized |
| 10 | Finalize | Confirm task completion |

---

## 2. Standard Flow

```
Task Received
    ↓
[1] Read AGENT.md (constitution)
    ↓
[2] Read .agent/workflow.md (this document)
    ↓
[3] Read docs/99-reference/document-map.md
    ↓
[4] Identify task type (see Task Types table)
    ↓
[5] Read ONLY required documents (see context-matrix.md)
    ↓
[6] Work
    ↓
[7] Update docs (if needed)
    ↓
[8] Done
```

---

## 3. Task Types

| Task Type | Required Documents |
|---|---|
| Entity change | DOM-{entity} + DB-001 |
| API change | API-002 + API-001 + DOM-{entity} |
| Security change | SEC-001 + SEC-{relevant} |
| Database change | DB-001 + DB-003 |
| Deployment change | OPS-001 + OPS-002 |
| New ADR | ADR-TPL + AGT-DEC |
| Documentation update | GOV-001 + relevant docs |
| Bug fix | Related domain docs + API docs |
| Feature | All related domain + API + DB docs |

---

## 4. Before Writing Code

**STOP. Documentation FIRST.**

```
Idea → Document → Approve → Code → Test → Update Doc → Done
```

If documentation doesn't exist:
1. Create document from template
2. Submit for approval
3. Wait for approval
4. Then implement code

---

## 5. After Writing Code

1. Verify all tests pass
2. Check if documentation needs update
3. Update CHANGELOG.md (if visible changes)
4. Register decision in logs/decisions/ (if architectural)
5. Prepare for commit (don't commit unless asked)

---

## 6. When Stuck

| Situation | Action |
|---|---|
| Can't find docs | Check document-map.md |
| Conflicting docs | Higher authority wins (AGENT.md §6) |
| Don't understand | Ask user for clarification |
| Security concern | Stop, report to Architecture |
| Data risk | Stop, document and ask |

---

## 7. Prohibited

- Writing code before documentation
- Loading all documentation at once
- Skipping documentation updates
- Ignoring Documentation Debt
- Reusing deprecated Document IDs
- Making decisions without documentation
- Mixing languages in documentation

---

## 8. Escalation Rules

### 8.1 When to Stop

- Requirement is ambiguous
- Multiple valid approaches exist
- Change affects security
- Change affects data integrity
- Change affects production
- Critical Documentation Debt found
- Document conflict detected

### 8.2 How to Escalate

1. Document the issue clearly
2. Identify affected documents
3. Present options with trade-offs
4. Wait for decision
5. Proceed only after approval

---

## 9. Completion Criteria

A task is complete only when:

1. Code is validated (tests pass)
2. Affected documentation is updated
3. CHANGELOG.md is updated (if visible changes)
4. Decision is registered in logs/decisions/ (if architectural)
5. Project is ready for commit

---

## 10. Task Checklist

Use this checklist for every task:

- [ ] Read AGENT.md
- [ ] Read this workflow
- [ ] Found relevant documents
- [ ] Documentation exists for changes
- [ ] Documentation updated (if needed)
- [ ] Tests pass
- [ ] CHANGELOG updated (if needed)
- [ ] Decision registered (if needed)
- [ ] Ready for commit
