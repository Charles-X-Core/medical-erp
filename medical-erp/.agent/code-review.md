# Code Review Checklist

---
Document ID: AGT-CR
Status: Approved
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: false
Depends On: [CONSTITUTION, DEV-001, DEV-003]
---

## Workflow

This checklist is applied at **Step 6: Review** of `.agent/workflow.md`.

## 1. General

- [ ] Code follows coding standards (DEV-001)
- [ ] No commented-out code
- [ ] No TODO/FIXME without ticket reference
- [ ] Methods are small and focused (< 30 lines preferred)
- [ ] No code duplication (DRY principle)
- [ ] Proper error handling
- [ ] Meaningful variable and method names
- [ ] No magic numbers (use constants)
- [ ] Code is readable and self-documenting

## 2. Security

- [ ] Input validation present (@Valid, @NotNull, @Size, etc.)
- [ ] SQL injection prevented (use JPA/Hibernate, no string concatenation)
- [ ] XSS prevention applied (escape user input)
- [ ] Authentication required where needed (@PreAuthorize)
- [ ] Authorization checked (role-based access)
- [ ] Sensitive data not logged (passwords, tokens, PII)
- [ ] Passwords hashed properly (bcrypt)
- [ ] Secrets not hardcoded (use environment variables)
- [ ] CORS configured correctly
- [ ] CSRF protection enabled for state-changing operations

## 3. Performance

- [ ] N+1 queries avoided (use JOIN FETCH or @EntityGraph)
- [ ] Proper indexing considered (frequently queried columns)
- [ ] Pagination implemented for large datasets
- [ ] Lazy loading appropriate (don't load unnecessary data)
- [ ] Database connections properly closed
- [ ] No unnecessary object creation in loops
- [ ] Caching considered for frequently accessed data
- [ ] Batch operations used where appropriate

## 4. Testing

- [ ] Unit tests written for service layer
- [ ] Integration tests written for controllers
- [ ] Edge cases covered (null, empty, invalid input)
- [ ] Error cases tested (exceptions, failures)
- [ ] Tests pass locally
- [ ] Test coverage adequate (> 80% for services, > 60% for controllers)
- [ ] Tests are independent and repeatable
- [ ] Test names are descriptive

## 5. Documentation

- [ ] Javadoc present for public methods
- [ ] API documentation updated (API-002)
- [ ] Domain documentation updated (DOM-{entity})
- [ ] Database documentation updated (DB-001)
- [ ] README updated if needed
- [ ] Complex logic has inline comments
- [ ] Decision documented if architectural (ADR)

## 6. Architecture

- [ ] Follows layered architecture (Controller → Service → Repository)
- [ ] Business logic in service layer (not controller)
- [ ] DTOs used for API communication (not entities)
- [ ] Proper separation of concerns
- [ ] Dependencies injected via constructor
- [ ] No circular dependencies
- [ ] Module boundaries respected

## 7. Database

- [ ] Foreign key constraints defined
- [ ] Indexes added for frequently queried columns
- [ ] Audit columns included (created_at, updated_at)
- [ ] Soft delete considered where appropriate
- [ ] Migration created for schema changes
- [ ] Migration tested on development database
- [ ] No direct SQL string concatenation

## 8. API Design

- [ ] RESTful conventions followed (API-001)
- [ ] Proper HTTP methods used (GET, POST, PUT, DELETE)
- [ ] Proper HTTP status codes returned
- [ ] Request validation implemented
- [ ] Response format consistent (ApiResponse wrapper)
- [ ] Error handling follows API-003
- [ ] Pagination implemented for list endpoints
- [ ] API versioning considered

## 9. Error Handling

- [ ] Custom exceptions used (ResourceNotFoundException, etc.)
- [ ] Global exception handler configured
- [ ] Error messages user-friendly (no stack traces)
- [ ] Error codes consistent (API-003)
- [ ] Logging appropriate (log errors, not info)
- [ ] Fallback behavior defined

## 10. Logging

- [ ] Important operations logged (create, update, delete)
- [ ] Audit logging implemented (SEC-004)
- [ ] Log levels appropriate (ERROR, WARN, INFO, DEBUG)
- [ ] Sensitive data not logged
- [ ] Log messages clear and informative
- [ ] Structured logging used (JSON format)

## 11. Configuration

- [ ] Environment-specific configuration used
- [ ] Secrets externalized (environment variables)
- [ ] Default values provided where appropriate
- [ ] Configuration validated on startup
- [ ] No hardcoded values (URLs, credentials, etc.)

## 12. Deployment

- [ ] Application builds successfully
- [ ] All tests pass
- [ ] No breaking changes (or documented)
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Monitoring configured
- [ ] Health checks implemented

## Review Process

### Before Submitting for Review

1. Self-review against this checklist
2. Run all tests locally
3. Check code formatting
4. Update documentation
5. Create clear commit message

### During Review

1. Reviewer checks each section
2. Document findings (approved, needs changes, blocked)
3. Provide specific feedback
4. Verify fixes applied
5. Approve when all checks pass

### After Review

1. Address all feedback
2. Re-run tests
3. Update documentation if needed
4. Request re-review if major changes
5. Merge when approved

## References

- `docs/06-development/coding-standards.md` — Coding standards (DEV-001)
- `docs/06-development/testing.md` — Testing strategy (DEV-003)
- `docs/03-security/security-policy.md` — Security requirements (SEC-001)
- `docs/05-api/rest-conventions.md` — API conventions (API-001)
- `.agent/conventions.md` — Coding conventions
- `.agent/workflow.md` — Workflow process
