# Authentication

---
Document ID: SEC-002
Status: Draft
Version: 1.0.0
Owner: Security
Last Update: 2026-07-31
Last Reviewed: 2026-07-31
Source of Truth: true
Depends On: [SEC-001, DOM-SEG-001]
---

## 1. Authentication Method

Medical ERP uses **JWT (JSON Web Token)** with **OTP Email Verification (2FA)** for stateless authentication.

| Property | Value |
|---|---|
| Protocol | HTTP Bearer Token |
| Token Type | JWT (RFC 7519) |
| 2FA Method | Email OTP (6 digits) |
| Library | jjwt 0.12.x |
| Algorithm | HS256 (HMAC-SHA256) |

### 1.1 Why JWT

| Reason | Explanation |
|---|---|
| Stateless | No server-side session storage |
| Scalable | Works across multiple instances |
| Standard | Industry-standard format |
| Secure | Signed with secret key |

---

## 2. Token Structure

### 2.1 JWT Components

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwicm9sIjoiZG9jdG9yYSIsImlhdCI6MTYyMDAwMDAwMCwiZXhwIjoxNjIwMDAxODAwfQ.signature
```

| Part | Description |
|---|---|
| Header | Algorithm and token type |
| Payload | User data and claims |
| Signature | Verification signature |

### 2.2 Header

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### 2.3 Payload (Claims)

| Claim | Type | Description |
|---|---|---|
| sub | string | User email (subject) |
| role | string | User role (admin, doctora, enfermera) |
| type | string | `access` or `refresh` |
| iat | number | Issued at (Unix timestamp) |
| exp | number | Expiration (Unix timestamp) |

### 2.4 Example Payload

```json
{
  "sub": "1",
  "name": "Dr. María García",
  "email": "maria@clinica.com",
  "role": "doctora",
  "iat": 1753747200,
  "exp": 1753749000
}
```

### 2.5 Signature

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret_key
)
```

---

## 3. Token Lifecycle

### 3.1 Issuance

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │      │  Server  │      │  MySQL   │
└────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │
     │  POST /auth/login                │
     │  {email, password}               │
     │────────────────>│                │
     │                 │  Query user     │
     │                 │────────────────>│
     │                 │  User data      │
     │                 │<────────────────│
     │                 │                │
     │                 │  Verify password│
     │                 │  (bcrypt)       │
     │                 │                │
     │                 │  Generate JWT   │
     │                 │                │
     │  {token, user}  │                │
     │<────────────────│                │
```

**Issuance Rules:**

| Rule | Value |
|---|---|
| Access token expiration | 1 hour |
| Refresh token expiration | 7 days |
| Secret key | From environment variable |
| Algorithm | HS256 |

### 3.2 Validation

```
┌──────────┐      ┌──────────┐
│  Client  │      │  Server  │
└────┬─────┘      └────┬─────┘
     │                 │
     │  GET /api/v1/patients
     │  Authorization: Bearer {token}
     │────────────────>│
     │                 │
     │                 │  Extract token
     │                 │  Verify signature
     │                 │  Check expiration
     │                 │  Extract user ID
     │                 │
     │  200 OK or 401  │
     │<────────────────│
```

**Validation Checks:**

| Check | Description |
|---|---|
| Signature valid | Token not tampered |
| Not expired | Current time < exp |
| Subject exists | User ID is valid |
| User active | User is not deactivated |

### 3.3 Expiration

| Property | Value |
|---|---|
| Access token | 1 hour |
| Refresh token | 7 days |

**Expiration Response:**

```json
{
  "error": "Token expired",
  "code": "TOKEN_EXPIRED",
  "message": "Please login again"
}
```

### 3.4 Revocation

| Method | Description |
|---|---|
| Server-side | Not implemented (stateless JWT) |
| Client-side | Delete token from storage |
| Password change | All tokens remain valid until expiration |

> **Note:** For MVP, tokens are not revoked server-side. Users must re-login after password change.

---

## 4. Password Policy

### 4.1 Requirements

| Requirement | Value |
|---|---|
| Minimum length | 8 characters |
| Maximum length | 128 characters |
| Complexity | At least 1 uppercase, 1 lowercase, 1 number |
| Special characters | Allowed but not required |
| Storage | bcrypt hash, 12 rounds |

### 4.2 Password Rules

| Rule | Description |
|---|---|
| No reuse | Cannot reuse last 5 passwords (future) |
| No dictionary | Cannot contain common passwords (future) |
| No personal | Cannot contain name/email (future) |

### 4.3 bcrypt Implementation

```java
// Hashing
String hashed = BCrypt.hashpw(password, BCrypt.gensalt(12));

// Verification
boolean valid = BCrypt.checkpw(password, hashed);
```

| Property | Value |
|---|---|
| Algorithm | bcrypt |
| Salt rounds | 12 |
| Output length | 60 characters |

---

## 5. Login Flow (OTP 2FA)

### 5.1 Two-Step Login

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │      │  Server  │      │  MySQL   │      │  Gmail   │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │                 │
     │  POST /auth/login-step1          │                 │
     │  {email, password}               │                 │
     │────────────────>│                │                 │
     │                 │  1. Verify credentials
     │                 │  AuthenticationManager         │
     │                 │                │                 │
     │                 │  2. Generate OTP (6 digits)
     │                 │  Save to otp_codes             │
     │                 │────────────────>│                 │
     │                 │                │                 │
     │                 │  3. Send email  │                 │
     │                 │─────────────────────────────────>│
     │                 │                │                 │
     │  200 OK         │                │                 │
     │  {              │                │                 │
     │    "message": "Código OTP enviado",
     │    "email": "maria@clinica.com",
     │    "expiresInMinutes": 5         │
     │  }              │                │                 │
     │<────────────────│                │                 │

     │  [User checks email]              │                 │
     │                 │                │                 │
     │  POST /auth/login-step2          │                 │
     │  {email, codigo} │                │                 │
     │────────────────>│                │                 │
     │                 │  4. Validate OTP
     │                 │  Check not expired, not used
     │                 │  Check attempts < 3            │
     │                 │────────────────>│                 │
     │                 │                │                 │
     │                 │  5. Mark used   │                 │
     │                 │  Generate JWT + refresh        │
     │                 │                │                 │
     │  200 OK         │                │                 │
     │  {              │                │                 │
     │    "token": "...",                │
     │    "refreshToken": "...",        │
     │    "expiresIn": 3600             │
     │    "user": {...} │                │                 │
     │  }              │                │                 │
     │<────────────────│                │                 │
```

### 5.2 Login Errors (OTP)

| Error | HTTP Code | Error Code | Message |
|---|---|---|---|
| User not found | 401 | AUTHENTICATION_FAILED | "Credenciales inválidas" |
| Wrong password | 401 | AUTHENTICATION_FAILED | "Credenciales inválidas" |
| User inactive | 401 | USER_INACTIVE | "Usuario desactivado" |
| OTP expired | 401 | OTP_EXPIRED | "Código OTP expirado" |
| OTP invalid | 401 | OTP_INVALID | "Código OTP incorrecto. Intentos restantes: N" |
| OTP max attempts | 401 | OTP_MAX_ATTEMPTS | "Máximo de intentos alcanzado" |
| OTP not found | 401 | OTP_NOT_FOUND | "Código OTP no encontrado o expirado" |
| Rate limit (IP) | 401 | IP_RATE_LIMIT | "Demasiados intentos desde esta IP" |
| Rate limit (resend) | 401 | RESEND_RATE_LIMIT | "Espere 60 segundos" |
| Invalid format | 400 | VALIDATION_ERROR | "Datos de entrada inválidos" |

### 5.3 Login Response (Step 2)

**Success:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "nombre": "Dr. María García",
    "email": "maria@clinica.com",
    "role": "doctora"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": {
    "code": "OTP_INVALID",
    "message": "Código OTP incorrecto. Intentos restantes: 2"
  }
}
```

---

## 6. User Creation Flow

> **⚠️ SECURITY:** There is NO public registration. Users are created exclusively by the administrator.

### 6.1 First Admin User (Deployment)

The first admin user is created via SQL seed script during deployment:

```sql
-- seed-admin.sql
-- Run during initial deployment

INSERT INTO usuarios (nombre, email, password, activo, created_at, updated_at)
VALUES (
    'Administrador',
    'admin@clinica.com',
    '$2a$12$LJ3m4ys3Lz0Zq5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q',  -- bcrypt hash of 'Admin123'
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Assign admin role
INSERT INTO usuario_roles (usuario_id, rol_id, created_at)
SELECT u.id, r.id, CURRENT_TIMESTAMP
FROM usuarios u, roles r
WHERE u.email = 'admin@clinica.com' AND r.nombre = 'admin';
```

**Post-Deployment:**
1. Admin logs in with `admin@clinica.com` / `Admin123`
2. Admin MUST change password immediately
3. Admin creates other users through the application

---

### 6.2 Admin Creates User

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│  Admin   │      │  Server  │      │  MySQL   │
└────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │
     │  POST /api/v1/users              │
     │  {name, email, password, role}   │
     │  Authorization: Bearer {admin_token}
     │────────────────>│                │
     │                 │                │
     │                 │  1. Verify admin role
     │                 │                │
     │                 │  2. Check email unique
     │                 │────────────────>│
     │                 │                │
     │                 │  3. Hash password
     │                 │  BCrypt.hashpw  │
     │                 │                │
     │                 │  4. Create user
     │                 │────────────────>│
     │                 │                │
     │                 │  5. Log audit event
     │                 │────────────────>│
     │                 │                │
     │  201 Created    │                │
     │  {user data}    │                │
     │<────────────────│                │
```

### 6.3 User Creation Rules

| Rule | Description |
|---|---|
| Admin only | Only admin can create users |
| Email unique | Email must not exist |
| Password policy | Must meet requirements |
| Role required | Must specify valid role |
| Audit logged | Creation is logged with admin ID |

### 6.4 No Public Registration

| Scenario | Behavior |
|---|---|
| POST /api/auth/register | 404 NOT FOUND (endpoint does not exist) |
| POST /api/v1/users (no auth) | 401 UNAUTHORIZED |
| POST /api/v1/users (non-admin) | 403 FORBIDDEN |

---

## 7. Session Management

### 7.1 Session Properties

| Property | Value |
|---|---|
| Type | Stateless (JWT) |
| Storage | Client-side (localStorage) |
| Access token duration | 1 hour |
| Refresh token duration | 7 days |
| Renewal | Automatic via refresh token |

### 7.2 Session Storage

**Client-side (localStorage):**

```javascript
// Store tokens
localStorage.setItem('token', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// Retrieve token
const token = localStorage.getItem('token');

// Remove tokens (logout)
localStorage.removeItem('token');
localStorage.removeItem('refreshToken');
```

### 7.3 Session Timeout

| Scenario | Behavior |
|---|---|
| Access token expires | Use refresh token to get new access token |
| Refresh token expires | 401 response, redirect to login |
| User inactive | No automatic timeout (refresh token handles it) |
| Multiple tabs | Same tokens, no conflict |

### 7.4 Token Refresh

```
┌──────────┐      ┌──────────┐
│  Client  │      │  Server  │
└────┬─────┘      └────┬─────┘
     │                 │
     │  GET /api/...   │
     │  Authorization: Bearer {expired_token}
     │────────────────>│
     │  401 UNAUTHORIZED             │
     │<────────────────│
     │                 │
     │  POST /auth/refresh            │
     │  X-Refresh-Token: {refresh_token}
     │────────────────>│
     │  Validate refresh token      │
     │  Generate new access + refresh
     │                 │
     │  200 OK         │
     │  {token, refreshToken}        │
     │<────────────────│
```

### 7.5 Logout

```
┌──────────┐      ┌──────────┐
│  Client  │      │  Server  │
└────┬─────┘      └────┬─────┘
     │                 │
     │  Delete tokens  │
     │  from localStorage
     │                 │
     │  Redirect to    │
     │  login page     │
```

**Note:** Logout is client-side only. Tokens remain valid until expiration. Future: server-side token blacklist.

---

## 8. Security Considerations

### 8.1 Token Security

| Risk | Mitigation |
|---|---|
| Token theft | Use HTTPS only |
| Token tampering | HMAC signature |
| Token exposure | Short access token (1h), refresh token (7d) |
| Replay attacks | Timestamp validation |
| Refresh token abuse | Separate token type claim, validation check |

### 8.2 OTP Security

| Risk | Mitigation |
|---|---|
| OTP interception | Email delivery to registered address only |
| OTP brute force | Max 3 attempts per code |
| OTP replay | Single-use, marked as used after validation |
| OTP expiration | 5 minute lifetime |
| Rate limiting | 5 requests/hour per IP, 1 resend/60s per email |
| Code generation | Cryptographically secure random 6 digits |

### 8.3 Password Security

| Risk | Mitigation |
|---|---|
| Brute force | Rate limiting (5 attempts/hour) |
| Dictionary attack | Complexity requirements |
| Rainbow table | bcrypt with salt |
| Password reuse | Future: password history |

### 8.3 Implementation Notes

| Consideration | Implementation |
|---|---|
| Secret key | Environment variable, not hardcoded |
| Token storage | localStorage (not cookies for MVP) |
| HTTPS | Required in production |
| CORS | Configure for frontend domain |

---

## 9. API Endpoints

### 9.1 Authentication Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/login-step1` | Público | Validate credentials, send OTP email |
| POST | `/api/v1/auth/login-step2` | Público | Validate OTP, return JWT + refresh token |
| POST | `/api/v1/auth/resend-otp` | Público | Resend OTP (rate limited 60s) |
| POST | `/api/v1/auth/refresh` | Público | Refresh access token using refresh token |
| POST | `/api/v1/auth/login` | Público | Legacy login (backward compatibility) |
| GET | `/api/v1/auth/me` | Bearer | Get current user info |

### 9.2 User Management Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/users` | Create user | Admin |
| GET | `/api/v1/users` | List users | Admin |
| GET | `/api/v1/users/{id}` | Get user | Admin |
| PUT | `/api/v1/users/{id}` | Update user | Admin |
| PUT | `/api/v1/users/{id}/password` | Change password | Admin |

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
