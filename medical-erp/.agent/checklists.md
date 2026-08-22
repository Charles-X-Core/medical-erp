# Operational Checklists

---
Document ID: AGT-CK
Status: Approved
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: false
Depends On: [CONSTITUTION, DEV-001, DEV-003]
---

## Workflow

All checklists follow the mandatory order in `.agent/workflow.md`.

## 1. New Feature Development

### Pre-Implementation

- [ ] Read AGENT.md (constitution)
- [ ] Read .agent/workflow.md (process)
- [ ] Read relevant domain docs (DOM-{entity})
- [ ] Read API-002 for endpoint conventions
- [ ] Read DB-001 for schema design
- [ ] Identify affected documents
- [ ] Plan implementation approach

### Implementation

- [ ] Create/update domain documentation
- [ ] Create database migration (if needed)
- [ ] Implement entity class
- [ ] Implement repository interface
- [ ] Implement service class with business logic
- [ ] Implement controller with REST endpoints
- [ ] Add input validation (@Valid, @NotNull, etc.)
- [ ] Add authorization (@PreAuthorize)
- [ ] Add error handling
- [ ] Add audit logging (if data modification)

### Testing

- [ ] Write unit tests for service layer
- [ ] Write integration tests for controller
- [ ] Test happy path scenarios
- [ ] Test edge cases (null, empty, invalid)
- [ ] Test error cases (not found, unauthorized)
- [ ] Verify all tests pass
- [ ] Check test coverage (> 80% service, > 60% controller)

### Documentation

- [ ] Update API-002 with new endpoints
- [ ] Update DOM-{entity} if domain changed
- [ ] Update DB-001 if schema changed
- [ ] Add Javadoc to public methods
- [ ] Update CHANGELOG.md (if user-visible)

### Review

- [ ] Self-review against .agent/code-review.md
- [ ] Verify coding standards (DEV-001)
- [ ] Verify security checklist (.agent/security.md)
- [ ] Verify performance considerations
- [ ] Prepare for commit

## 2. Bug Fix

### Investigation

- [ ] Reproduce the bug
- [ ] Read relevant documentation
- [ ] Identify root cause
- [ ] Check for similar issues
- [ ] Assess impact and severity

### Fix

- [ ] Write failing test that demonstrates bug
- [ ] Implement fix
- [ ] Verify test passes
- [ ] Check for regressions (run all tests)
- [ ] Verify fix doesn't introduce new issues

### Documentation

- [ ] Update documentation if behavior changed
- [ ] Add comment explaining fix (if complex)
- [ ] Update CHANGELOG.md (if user-visible)
- [ ] Document lessons learned (if significant)

### Review

- [ ] Self-review against .agent/code-review.md
- [ ] Verify fix is minimal and focused
- [ ] Verify no workarounds or hacks
- [ ] Prepare for commit

## 3. Deployment

### Pre-Deployment

- [ ] All tests pass (unit, integration)
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Database migrations tested
- [ ] Backup created
- [ ] Rollback plan documented
- [ ] Environment variables configured
- [ ] SSL certificate valid
- [ ] Monitoring configured

### Deployment

- [ ] Stop application
- [ ] Backup current version
- [ ] Deploy new version
- [ ] Apply database migrations
- [ ] Start application
- [ ] Verify health check passes
- [ ] Run smoke tests
- [ ] Monitor logs for errors
- [ ] Verify key functionality

### Post-Deployment

- [ ] Monitor for 30 minutes
- [ ] Check error rates
- [ ] Check performance metrics
- [ ] Verify backups working
- [ ] Update deployment documentation
- [ ] Notify stakeholders

## 4. Security Review

### Authentication

- [ ] JWT token validation implemented
- [ ] Token expiration configured (24 hours)
- [ ] Password hashing uses bcrypt
- [ ] Failed login attempts limited
- [ ] Secure password reset flow

### Authorization

- [ ] @PreAuthorize on all endpoints
- [ ] Role-based access control applied
- [ ] Resource ownership verified
- [ ] Admin-only endpoints protected
- [ ] Read/write permissions separated

### Data Protection

- [ ] Input validation on all parameters
- [ ] SQL injection prevented (use JPA)
- [ ] XSS prevention applied
- [ ] Sensitive data encrypted at rest
- [ ] Sensitive data not logged
- [ ] Secrets externalized (env vars)

### API Security

- [ ] CORS configured correctly
- [ ] CSRF protection enabled
- [ ] Rate limiting on auth endpoints
- [ ] Error messages safe (no stack traces)
- [ ] Pagination for large datasets

### Audit

- [ ] Audit logging for data modifications
- [ ] User actions logged
- [ ] Failed authentication attempts logged
- [ ] Log integrity protected
- [ ] Logs retained per policy

## 5. Code Refactoring

### Planning

- [ ] Identify code smell or improvement
- [ ] Read related documentation
- [ ] Plan refactoring approach
- [ ] Assess impact and risk
- [ ] Get approval if major change

### Implementation

- [ ] Write tests for current behavior
- [ ] Refactor code incrementally
- [ ] Run tests after each change
- [ ] Verify no regressions
- [ ] Update documentation if needed

### Review

- [ ] Self-review against .agent/code-review.md
- [ ] Verify behavior unchanged
- [ ] Verify tests still pass
- [ ] Verify performance not degraded
- [ ] Prepare for commit

## 6. Documentation Update

### Planning

- [ ] Identify documentation gap or issue
- [ ] Read related documentation
- [ ] Plan update approach
- [ ] Identify affected documents

### Implementation

- [ ] Update document content
- [ ] Update metadata (version, date)
- [ ] Add cross-references
- [ ] Verify terminology (DOM-UL-001)
- [ ] Check formatting and structure

### Review

- [ ] Self-review for clarity
- [ ] Verify accuracy
- [ ] Verify completeness
- [ ] Check cross-references work
- [ ] Prepare for commit

## References

- `.agent/workflow.md` — Workflow process
- `.agent/code-review.md` — Code review checklist
- `.agent/security.md` — Security checklist
- `docs/06-development/coding-standards.md` — Coding standards (DEV-001)
- `docs/06-development/testing.md` — Testing strategy (DEV-003)
