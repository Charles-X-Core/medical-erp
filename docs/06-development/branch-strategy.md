# Branch Strategy

---
Document ID: DEV-002
Status: Draft
Version: 1.0.0
Owner: Development
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [DEV-001]
---

## 1. Branch Model

Medical ERP uses **GitHub Flow** - a simplified branching model suitable for small teams.

### 1.1 Model Overview

```
main (production)
    │
    ├── feature/ME-001-patient-crud
    │       │
    │       └─── Merge to main
    │
    ├── feature/ME-002-appointment-scheduling
    │       │
    │       └─── Merge to main
    │
    └── hotfix/ME-099-security-patch
            │
            └─── Merge to main
```

### 1.2 Rules

| Rule | Description |
|---|---|
| main is always deployable | Never push directly to main |
| Feature branches are temporary | Delete after merge |
| All changes via PR | No direct commits to main |
| Tests must pass | Before merging |

---

## 2. Branch Types

| Branch | Purpose | Lifetime | Source |
|---|---|---|---|
| main | Production code | Permanent | Always |
| feature/* | New features | Temporary | main |
| bugfix/* | Bug fixes | Temporary | main |
| hotfix/* | Production fixes | Temporary | main |
| release/* | Release preparation | Temporary | main (optional) |

### 2.1 main Branch

| Property | Value |
|---|---|
| Purpose | Production-ready code |
| Protected | Yes (no direct commits) |
| Deployable | Always |
| Reviews required | No (small team) |

### 2.2 feature/* Branch

| Property | Value |
|---|---|
| Purpose | Develop new features |
| Source | main |
| Lifetime | Until feature is complete |
| Merge to | main |

### 2.3 bugfix/* Branch

| Property | Value |
|---|---|
| Purpose | Fix non-critical bugs |
| Source | main |
| Lifetime | Until bug is fixed |
| Merge to | main |

### 2.4 hotfix/* Branch

| Property | Value |
|---|---|
| Purpose | Fix critical production bugs |
| Source | main |
| Lifetime | Until fix is deployed |
| Merge to | main |

---

## 3. Naming Convention

### 3.1 Branch Names

```
{type}/ME-{ticket}-{description}
```

### 3.2 Examples

| Type | Example |
|---|---|
| Feature | `feature/ME-001-patient-crud` |
| Feature | `feature/ME-002-appointment-scheduling` |
| Bugfix | `bugfix/ME-042-date-validation` |
| Hotfix | `hotfix/ME-099-security-patch` |

### 3.3 Naming Rules

| Rule | Example |
|---|---|
| Lowercase | `feature/ME-001-patient-crud` |
| Hyphens for spaces | `patient-crud` not `patient_crud` |
| Include ticket number | `ME-001` |
| Short description | `patient-crud` not `implement-crud-for-patient-management` |

---

## 4. Merge Rules

### 4.1 Merge Strategy

| Strategy | When to Use |
|---|---|
| **Squash and Merge** | Feature branches (default) |
| **Merge Commit** | Hotfix branches |
| **Rebase and Merge** | Never (avoid for simplicity) |

### 4.2 Squash and Merge (Recommended)

**When:** Feature branches

**What happens:**
- All commits are squashed into one commit
- Clean git history
- Easy to revert changes

**Example:**
```
Before squash:
- ME-001: Add patient entity
- ME-001: Add patient repository
- ME-001: Add patient service
- ME-001: Add patient controller
- ME-001: Fix validation

After squash:
- ME-001: Add patient CRUD functionality
```

### 4.3 Merge Commit

**When:** Hotfix branches

**What happens:**
- All commits are preserved
- Merge commit is created
- Full history is maintained

---

## 5. Pull Request Process

### 5.1 PR Template

```markdown
## Description

Brief description of changes.

## Type of Change

- [ ] New feature
- [ ] Bug fix
- [ ] Hotfix
- [ ] Documentation
- [ ] Other: ___

## Related Tickets

- Closes ME-001
- Related to ME-002

## Changes

- Change 1
- Change 2
- Change 3

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows coding standards
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### 5.2 PR Process

| Step | Action |
|---|---|
| 1 | Create feature branch from main |
| 2 | Make changes and commit |
| 3 | Push to remote |
| 4 | Create Pull Request |
| 5 | Fill out PR template |
| 6 | Wait for tests to pass |
| 7 | Merge (Squash and Merge) |
| 8 | Delete feature branch |

### 5.3 PR Rules

| Rule | Description |
|---|---|
| Title format | `ME-001: Add patient CRUD` |
| Description required | Fill out template |
| Tests must pass | No merge if tests fail |
| Small PRs | <300 lines preferred |

---

## 6. Protected Branches

### 6.1 main Branch Protection

| Rule | Setting |
|---|---|
| Require pull request | Yes |
| Require approvals | No (small team) |
| Require status checks | Yes (tests must pass) |
| Require branches up to date | Yes |
| Require signed commits | No |
| Require linear history | No |
| Allow force pushes | No |
| Allow deletions | No |

### 6.2 Branch Protection Rules

| Rule | Description |
|---|---|
| No direct commits | All changes via PR |
| Tests must pass | CI must be green |
| No force pushes | Protect history |
| No deletions | Prevent accidents |

---

## 7. Workflow Examples

### 7.1 Feature Development

```bash
# 1. Create feature branch
git checkout main
git pull origin main
git checkout -b feature/ME-001-patient-crud

# 2. Make changes
# ... code changes ...

# 3. Commit changes
git add .
git commit -m "ME-001: Add patient entity"

# 4. Push to remote
git push origin feature/ME-001-patient-crud

# 5. Create Pull Request on GitHub

# 6. After PR is merged, delete branch
git checkout main
git pull origin main
git branch -d feature/ME-001-patient-crud
git push origin --delete feature/ME-001-patient-crud
```

### 7.2 Hotfix

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/ME-099-security-patch

# 2. Make fix
# ... code changes ...

# 3. Commit and push
git add .
git commit -m "ME-099: Fix security vulnerability"
git push origin hotfix/ME-099-security-patch

# 4. Create Pull Request
# 5. Merge with Merge Commit (preserve history)
# 6. Delete branch
```

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
