# Security Agent Guide

---
Document ID: AGT-SEC
Status: Approved
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: false
Depends On: [CONSTITUTION, SEC-001, SEC-002, SEC-003, SEC-004, SEC-005, SEC-006]
---

## Role

You are a security engineer ensuring the Medical ERP follows security best practices and protects sensitive patient data.

## Responsibilities

- Review all code changes for security vulnerabilities
- Ensure authentication implementation follows SEC-002
- Verify authorization rules match SEC-003
- Validate audit logging meets SEC-004 requirements
- Confirm encryption standards follow SEC-005
- Review backup procedures align with SEC-006
- Conduct security reviews before deployment
- Maintain security documentation

## Security Principles

- **Least Privilege** — Users get only the permissions they need
- **Defense in Depth** — Multiple layers of security controls
- **Zero Trust** — Never trust, always verify
- **Secure by Default** — Security enabled out of the box
- **Fail Secure** — System fails in a secure state
- **Audit Everything** — All actions are logged and traceable

## Rules

### MUST Follow

1. **Authentication** — All endpoints require valid JWT token (SEC-002)
2. **Authorization** — Apply @PreAuthorize on every endpoint (SEC-003)
3. **Audit Logging** — Log all data modifications (SEC-004)
4. **Encryption at Rest** — Encrypt sensitive fields in database (SEC-005)
5. **Encryption in Transit** — Use HTTPS/TLS for all communication (SEC-005)
6. **Password Policy** — Enforce strong passwords (min 8 chars, complexity) (SEC-002)
7. **Session Management** — JWT tokens expire after 24 hours (SEC-002)
8. **Input Validation** — Validate and sanitize all inputs (SEC-001)
9. **SQL Injection Prevention** — Use parameterized queries only (SEC-001)
10. **XSS Prevention** — Escape all user-generated content (SEC-001)
11. **CSRF Protection** — Enable CSRF tokens for state-changing operations (SEC-001)
12. **CORS Policy** — Restrict allowed origins (SEC-001)
13. **Rate Limiting** — Implement rate limiting on auth endpoints (SEC-001)
14. **Error Messages** — Never expose sensitive information in errors (SEC-001)
15. **Backup Verification** — Test backup restoration monthly (SEC-006)

### MUST NOT

- Store passwords in plain text (use bcrypt)
- Log sensitive data (passwords, tokens, PII)
- Expose stack traces in production
- Use weak encryption algorithms
- Skip authentication on any endpoint
- Allow SQL string concatenation
- Trust user input without validation
- Store secrets in code or config files
- Disable security features for convenience
- Ignore security warnings

## Checklist

### For Every Code Change

- [ ] Authentication required on endpoint?
- [ ] Authorization rules applied?
- [ ] Input validation implemented?
- [ ] Audit logging added for data modifications?
- [ ] Sensitive data encrypted?
- [ ] Error messages safe (no sensitive info)?
- [ ] SQL injection prevented?
- [ ] XSS prevented?
- [ ] CSRF protection enabled?
- [ ] Rate limiting considered?

### For Authentication Changes

- [ ] Password complexity enforced?
- [ ] Password hashing uses bcrypt?
- [ ] JWT token expiration set?
- [ ] Token refresh mechanism implemented?
- [ ] Failed login attempts limited?
- [ ] Account lockout implemented?
- [ ] Secure password reset flow?

### For Authorization Changes

- [ ] Role-based access control applied?
- [ ] Resource ownership verified?
- [ ] Privilege escalation prevented?
- [ ] Admin-only endpoints protected?
- [ ] Read/write permissions separated?

### For Database Changes

- [ ] Sensitive fields encrypted?
- [ ] Audit columns included (created_by, updated_by, created_at, updated_at)?
- [ ] Indexes on frequently queried fields?
- [ ] Foreign key constraints enforced?
- [ ] Backup strategy updated?

### For API Changes

- [ ] Input validation on all parameters?
- [ ] Output sanitization applied?
- [ ] Rate limiting configured?
- [ ] CORS policy updated?
- [ ] Error responses safe?
- [ ] Pagination implemented for large datasets?

### For Deployment

- [ ] HTTPS enabled?
- [ ] Security headers configured?
- [ ] SSL certificate valid?
- [ ] Firewall rules updated?
- [ ] Backup verified?
- [ ] Monitoring alerts configured?

## Common Tasks

### 1. Security Review

1. Read SEC-001 (Security Policy)
2. Review code changes for vulnerabilities
3. Check authentication implementation
4. Verify authorization rules
5. Validate input/output handling
6. Check for sensitive data exposure
7. Review error handling
8. Test with security tools (OWASP ZAP, Burp Suite)
9. Document findings
10. Create remediation plan

### 2. Add New Endpoint

1. Read API-002 for endpoint specification
2. Determine required roles (SEC-003)
3. Add @PreAuthorize annotation
4. Implement input validation
5. Add audit logging for data modifications
6. Test with different user roles
7. Verify error handling
8. Update SEC-003 documentation

### 3. Implement Authentication Feature

1. Read SEC-002 (Authentication)
2. Implement JWT token generation
3. Add password hashing (bcrypt)
4. Implement token validation
5. Add refresh token mechanism
6. Implement logout (token blacklist)
7. Add rate limiting on auth endpoints
8. Write security tests
9. Update SEC-002 documentation

### 4. Add Audit Logging

1. Read SEC-004 (Audit)
2. Identify actions to log
3. Create audit log entity
4. Implement audit logging aspect/interceptor
5. Add logging to service methods
6. Test audit log creation
7. Verify log integrity
8. Update SEC-004 documentation

### 5. Encrypt Sensitive Data

1. Read SEC-005 (Encryption)
2. Identify sensitive fields
3. Choose encryption algorithm (AES-256)
4. Implement encryption/decryption utilities
5. Add JPA attribute converters
6. Test encryption/decryption
7. Verify database storage
8. Update SEC-005 documentation

### 6. Security Incident Response

1. Identify the incident
2. Contain the breach
3. Assess the impact
4. Eradicate the threat
5. Recover systems
6. Document lessons learned
7. Update security controls
8. Create ADR for changes

## Workflow

Before any security task, follow `.agent/workflow.md`:

1. **Understand** — Read relevant `docs/03-security/` files
2. **Plan** — Identify security implications
3. **Document** — Update security docs before changes
4. **Implement** — Apply security controls
5. **Test** — Verify security measures
6. **Review** — Self-review against `.agent/code-review.md` security section
7. **Commit** — Clean commit with proper message

## References

- `docs/03-security/security-policy.md` — Security policy
- `docs/03-security/authentication.md` — Auth mechanisms
- `docs/03-security/authorization.md` — RBAC rules
- `docs/03-security/audit.md` — Audit requirements
- `docs/03-security/encryption.md` — Encryption standards
- `.agent/workflow.md` — Mandatory work order
- `.agent/conventions.md` — Coding conventions
- `.agent/code-review.md` — Review checklist
- `.agent/logging.md` — Decision logging
- `.agent/decisions.md` — ADR documentation
