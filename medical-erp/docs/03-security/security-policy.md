# Security Policy

---
Document ID: SEC-001
Status: Draft
Version: 1.0.0
Owner: Security
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [CONSTITUTION, ARCH-001]
---

## 1. Security Philosophy

Medical ERP handles sensitive patient data including personal information, medical history, and clinical documents. Our security approach prioritizes:

1. **Patient Privacy:** Protecting patient data from unauthorized access
2. **Data Integrity:** Ensuring data cannot be tampered with
3. **Availability:** Maintaining system access for authorized users
4. **Compliance:** Following security best practices inspired by HIPAA

### 1.1 Security Goals

| Goal | Description |
|---|---|
| Confidentiality | Only authorized users can access data |
| Integrity | Data cannot be modified without authorization |
| Availability | System is accessible when needed |
| Accountability | All actions are traceable |

---

## 2. Regulatory Alignment

> **Note:** This system is NOT formally HIPAA certified. It follows security principles inspired by HIPAA, applying equivalent practices where technically viable.

### 2.1 HIPAA-Inspired Controls

| HIPAA Requirement | Our Implementation |
|---|---|
| Access Control | JWT + RBAC (SEC-002, SEC-003) |
| Audit Controls | Audit logging (SEC-004) |
| Integrity Controls | SHA256 hash on documents |
| Transmission Security | TLS 1.3 (HTTPS) |
| Encryption | bcrypt passwords, encrypted storage |

### 2.2 Data Protection Principles

| Principle | Implementation |
|---|---|
| Data Minimization | Collect only necessary data |
| Purpose Limitation | Use data only for intended purpose |
| Storage Limitation | Retain data only as long as needed |
| Accountability | Log all data access |

---

## 3. Security Principles

### 3.1 Least Privilege

Users receive only the minimum permissions needed to perform their job.

| Role | Access Level |
|---|---|
| admin | Full system access |
| doctora | Clinical data access |
| enfermera | Limited clinical access |

See: SEC-003 (Authorization)

### 3.2 Defense in Depth

Multiple layers of security protect against attacks:

```
┌─────────────────────────────────────────────┐
│                 INTERNET                     │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│            Layer 1: TLS/HTTPS               │
│         (Encryption in Transit)             │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│            Layer 2: Nginx                   │
│        (Rate Limiting, Headers)             │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│            Layer 3: Spring Security         │
│        (JWT Authentication, RBAC)           │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│            Layer 4: Input Validation        │
│        (Bean Validation, Sanitization)      │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│            Layer 5: Database                │
│        (Encrypted at Rest, Backups)         │
└─────────────────────────────────────────────┘
```

### 3.3 Zero Trust

Never trust, always verify:

| Principle | Implementation |
|---|---|
| Verify Identity | JWT token required for all requests |
| Verify Authorization | RBAC check on every endpoint |
| Verify Integrity | SHA256 hash on documents |
| Assume Breach | Audit all actions |

### 3.4 Secure by Default

| Default Setting | Value |
|---|---|
| New users | Inactive until activated by admin |
| New patients | Active |
| New appointments | Pending confirmation |
| Documents | Draft until signed |
| Password policy | Minimum 8 characters |

---

## 4. Security Controls

| Control | Status | Description | Reference |
|---|---|---|---|
| HTTPS/TLS | Planned | Encryption in transit | SEC-005 |
| JWT Auth | Planned | Token-based authentication | SEC-002 |
| RBAC | Planned | Role-based access control | SEC-003 |
| Input Validation | Planned | Prevent injection attacks | ARCH-004 |
| Audit Logging | Planned | Track all modifications | SEC-004 |
| Encrypted Storage | Planned | Sensitive data at rest | SEC-005 |
| Password Hashing | Planned | bcrypt encryption | SEC-002 |
| Rate Limiting | Planned | Prevent brute force | Nginx |
| Security Headers | Planned | XSS, CSRF protection | SEC-005 |
| Backups | Planned | Daily backups with retention | SEC-006 |

---

## 5. Incident Response

### 5.1 Incident Classification

| Severity | Description | Response Time |
|---|---|---|
| Critical | Data breach, system compromise | Immediate |
| High | Unauthorized access attempt | 1 hour |
| Medium | Failed login attempts | 24 hours |
| Low | Policy violations | 1 week |

### 5.2 Response Procedures

#### Critical Incident (Data Breach)

1. **Contain:** Isolate affected systems
2. **Assess:** Determine scope of breach
3. **Notify:** Inform affected parties
4. **Eradicate:** Remove threat
5. **Recover:** Restore from clean backups
6. **Document:** Record incident details

#### High Incident (Unauthorized Access)

1. **Investigate:** Review audit logs
2. **Contain:** Disable compromised accounts
3. **Notify:** Inform administrator
4. **Remediate:** Reset credentials
5. **Monitor:** Watch for recurrence

### 5.3 Contact Information

| Role | Contact |
|---|---|
| Security Admin | System administrator |
| Incident Response | Development team |

---

## 6. Security Requirements

### 6.1 Authentication Requirements

| Requirement | Standard |
|---|---|
| Password minimum length | 8 characters |
| Password complexity | Uppercase, lowercase, number |
| Password storage | bcrypt hash |
| Token expiration | 30 minutes |
| Token format | JWT |

See: SEC-002 (Authentication)

### 6.2 Authorization Requirements

| Requirement | Standard |
|---|---|
| Access control | RBAC |
| Role separation | admin, doctora, enfermera |
| Data isolation | Users see own data, admin sees all |

See: SEC-003 (Authorization)

### 6.3 Audit Requirements

| Requirement | Standard |
|---|---|
| Events logged | Login, CRUD operations |
| Log retention | 1 year |
| Log protection | Append-only |

See: SEC-004 (Audit)

### 6.4 Encryption Requirements

| Requirement | Standard |
|---|---|
| Transit encryption | TLS 1.3 |
| Rest encryption | MySQL encryption |
| Password hashing | bcrypt, 12 rounds |
| Document integrity | SHA256 |

See: SEC-005 (Encryption)

---

## 7. Compliance Checklist

| Area | Status | Reference |
|---|---|---|
| Access Control | Planned | SEC-002, SEC-003 |
| Audit Logging | Planned | SEC-004 |
| Encryption | Planned | SEC-005 |
| Backup & Recovery | Planned | SEC-006 |
| Incident Response | Planned | SEC-001.5 |
| Data Protection | Planned | SEC-005 |

---

## 8. Security Review

### 8.1 Review Frequency

| Review Type | Frequency |
|---|---|
| Security Policy | Quarterly |
| Access Control | Monthly |
| Audit Logs | Weekly |
| Backups | Daily |

### 8.2 Review Checklist

- [ ] All users have appropriate roles
- [ ] No unused accounts exist
- [ ] Audit logs are intact
- [ ] Backups are current
- [ ] Security patches applied
- [ ] Access permissions correct

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
