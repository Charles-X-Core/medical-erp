# Audit Trail

---
Document ID: SEC-004
Status: Draft
Version: 1.0.0
Owner: Security
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [SEC-001, DOM-SEG-001]
---

## 1. Audit Philosophy

Medical ERP maintains a comprehensive audit trail to:

1. **Track Changes:** Know who changed what and when
2. **Detect Anomalies:** Identify suspicious behavior
3. **Ensure Compliance:** Meet regulatory requirements
4. **Resolve Disputes:** Provide evidence of actions

### 1.1 Audit Principles

| Principle | Description |
|---|---|
| Completeness | Log all significant events |
| Accuracy | Log correct information |
| Timeliness | Log events immediately |
| Integrity | Protect logs from tampering |

---

## 2. What to Audit

### 2.1 Authentication Events

| Event | Logged | Details |
|---|---|---|
| Login success | Yes | user_id, email, timestamp, IP |
| Login failure | Yes | email, timestamp, IP, reason |
| Logout | Yes | user_id, timestamp |
| Password change | Yes | user_id, timestamp |
| Token refresh | Yes | user_id, timestamp |

### 2.2 Patient Events

| Event | Logged | Details |
|---|---|---|
| Patient created | Yes | patient_id, user_id, timestamp, data |
| Patient updated | Yes | patient_id, user_id, timestamp, changes |
| Patient deactivated | Yes | patient_id, user_id, timestamp |
| Patient activated | Yes | patient_id, user_id, timestamp |

### 2.3 Appointment Events

| Event | Logged | Details |
|---|---|---|
| Appointment created | Yes | appointment_id, user_id, patient_id, timestamp |
| Appointment confirmed | Yes | appointment_id, user_id, timestamp |
| Appointment cancelled | Yes | appointment_id, user_id, timestamp, reason |
| Appointment completed | Yes | appointment_id, user_id, timestamp |

### 2.4 Consultation Events

| Event | Logged | Details |
|---|---|---|
| Consultation created | Yes | consultation_id, user_id, timestamp |
| Consultation updated | Yes | consultation_id, user_id, timestamp, changes |
| Consultation deleted | Yes | consultation_id, user_id, timestamp |

### 2.5 Document Events

| Event | Logged | Details |
|---|---|---|
| Document created | Yes | document_id, user_id, timestamp |
| Document signed | Yes | document_id, user_id, timestamp, signature_data |
| Document archived | Yes | document_id, user_id, timestamp |
| Document downloaded | Yes | document_id, user_id, timestamp |
| PDF generated | Yes | document_id, user_id, timestamp |

### 2.6 User Management Events

| Event | Logged | Details |
|---|---|---|
| User created | Yes | user_id, admin_id, timestamp |
| User updated | Yes | user_id, admin_id, timestamp, changes |
| User deactivated | Yes | user_id, admin_id, timestamp |
| Role changed | Yes | user_id, admin_id, timestamp, old_role, new_role |

---

## 3. Audit Log Structure

### 3.1 Audit Log Entry

| Field | Type | Description |
|---|---|---|
| id | BIGINT | Unique identifier |
| timestamp | TIMESTAMP | When the event occurred |
| user_id | BIGINT | Who performed the action |
| user_email | VARCHAR | Email of the user |
| user_role | VARCHAR | Role of the user |
| action | VARCHAR | What action was performed |
| entity_type | VARCHAR | What entity was affected |
| entity_id | BIGINT | ID of the affected entity |
| old_value | JSON | Previous value (for updates) |
| new_value | JSON | New value (for updates) |
| ip_address | VARCHAR | IP address of the user |
| user_agent | VARCHAR | Browser/client information |

### 3.2 Example Log Entry

```json
{
  "id": 1,
  "timestamp": "2026-07-28T10:30:00Z",
  "user_id": 1,
  "user_email": "maria@clinica.com",
  "user_role": "doctora",
  "action": "UPDATE",
  "entity_type": "Paciente",
  "entity_id": 123,
  "old_value": {
    "telefono": "123456789"
  },
  "new_value": {
    "telefono": "987654321"
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0..."
}
```

---

## 4. Tamper Protection

### 4.1 Protection Methods

| Method | Description |
|---|---|
| Append-only | Logs can only be added, not modified |
| Checksum | SHA256 hash chain between entries |
| Separate storage | Logs stored separately from data |

### 4.2 Checksum Chain

```
Entry 1: SHA256(data_1)
Entry 2: SHA256(data_2 + previous_hash)
Entry 3: SHA256(data_3 + previous_hash)
...
```

### 4.3 Integrity Verification

```sql
-- Verify log integrity
SELECT 
  id,
  checksum,
  LAG(checksum) OVER (ORDER BY id) as previous_checksum
FROM audit_log
WHERE id > @last_verified_id;
```

---

## 5. Retention Policy

### 5.1 Retention Periods

| Log Type | Retention | Action After |
|---|---|---|
| Authentication logs | 1 year | Archive |
| Patient data logs | 7 years | Archive |
| Document logs | 7 years | Archive |
| System logs | 1 year | Delete |

### 5.2 Archival Process

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│  Current │      │  Archive │      │  Cold    │
│  Logs    │      │  Storage │      │  Storage │
└────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │
     │  After 1 year   │                 │
     │────────────────>│                │
     │                 │  After 7 years  │
     │                 │────────────────>│
```

### 5.3 Cleanup Script

```sql
-- Archive old logs
INSERT INTO audit_log_archive 
SELECT * FROM audit_log 
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- Delete archived logs
DELETE FROM audit_log 
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

---

## 6. Querying Audit Logs

### 6.1 Common Queries

**User Activity:**

```sql
SELECT * FROM audit_log 
WHERE user_id = ? 
ORDER BY timestamp DESC;
```

**Entity History:**

```sql
SELECT * FROM audit_log 
WHERE entity_type = 'Paciente' AND entity_id = ?
ORDER BY timestamp DESC;
```

**Time Range:**

```sql
SELECT * FROM audit_log 
WHERE timestamp BETWEEN ? AND ?
ORDER BY timestamp DESC;
```

**Action Type:**

```sql
SELECT * FROM audit_log 
WHERE action = 'DELETE'
ORDER BY timestamp DESC;
```

### 6.2 Audit Report

| Report | Description |
|---|---|
| User activity | All actions by a specific user |
| Entity history | All changes to a specific entity |
| Security events | Login failures, access denials |
| Data exports | Who accessed what data |

---

## 7. Implementation

### 7.1 Audit Entity

```java
@Entity
@Table(name = "audit_log")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Instant timestamp;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private String userEmail;
    
    @Column(nullable = false)
    private String userRole;
    
    @Column(nullable = false)
    private String action;
    
    @Column(nullable = false)
    private String entityType;
    
    private Long entityId;
    
    @Column(columnDefinition = "JSON")
    private String oldValue;
    
    @Column(columnDefinition = "JSON")
    private String newValue;
    
    private String ipAddress;
    private String userAgent;
}
```

### 7.2 Audit Service

```java
@Service
public class AuditService {
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    public void log(String action, String entityType, Long entityId,
                    String oldValue, String newValue) {
        AuditLog log = new AuditLog();
        log.setTimestamp(Instant.now());
        log.setUserId(getCurrentUser().getId());
        log.setUserEmail(getCurrentUser().getEmail());
        log.setUserRole(getCurrentUser().getRole());
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        log.setIpAddress(getClientIp());
        log.setUserAgent(getUserAgent());
        
        auditLogRepository.save(log);
    }
}
```

### 7.3 Audit Aspect

```java
@Aspect
@Component
public class AuditAspect {
    
    @Autowired
    private AuditService auditService;
    
    @AfterReturning(pointcut = "execution(* com.medicalerp.*.service.*.create*(..))", returning = "result")
    public void auditCreate(JoinPoint joinPoint, Object result) {
        String entityName = joinPoint.getTarget().getClass().getSimpleName();
        Long entityId = ((BaseEntity) result).getId();
        auditService.log("CREATE", entityName, entityId, null, result.toString());
    }
    
    @AfterReturning(pointcut = "execution(* com.medicalerp.*.service.*.update*(..))", returning = "result")
    public void auditUpdate(JoinPoint joinPoint, Object result) {
        String entityName = joinPoint.getTarget().getClass().getSimpleName();
        Long entityId = ((BaseEntity) result).getId();
        auditService.log("UPDATE", entityName, entityId, null, result.toString());
    }
}
```

---

## 8. Security Considerations

### 8.1 Log Protection

| Risk | Mitigation |
|---|---|
| Log tampering | Append-only, checksum chain |
| Log deletion | Separate storage, backups |
| Log exposure | Encrypt sensitive data |
| Log flooding | Rate limiting, sampling |

### 8.2 Privacy Considerations

| Data Type | Handling |
|---|---|
| Passwords | Never logged |
| Medical data | Logged for compliance |
| PII | Logged for audit |
| Tokens | Never logged |

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
