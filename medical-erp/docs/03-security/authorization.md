# Authorization

---
Document ID: SEC-003
Status: Draft
Version: 1.0.0
Owner: Security
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [SEC-001, SEC-002, DOM-SEG-001]
---

## 1. Role Definitions

Medical ERP uses RBAC (Role-Based Access Control) with three roles.

| Role | Description | Access Level |
|---|---|---|
| admin | System administrator | Full access to all modules |
| doctora | Primary physician | Full clinical access |
| enfermera | Nursing staff | Limited clinical access |

### 1.1 Role Details

#### admin

| Property | Value |
|---|---|
| Description | System administrator |
| Can manage users | Yes |
| Can manage roles | Yes |
| Can view all data | Yes |
| Can modify system | Yes |

#### doctora

| Property | Value |
|---|---|
| Description | Primary physician |
| Can manage patients | Yes |
| Can manage appointments | Yes |
| Can create consultations | Yes |
| Can sign documents | Yes |
| Can view own data | Yes |

#### enfermera

| Property | Value |
|---|---|
| Description | Nursing staff |
| Can manage patients | Yes (create, read) |
| Can manage appointments | Yes |
| Can view consultations | Read only |
| Can view documents | Read only |
| Can confirm appointments | Yes |

---

## 2. Permission Matrix

### 2.1 Module Permissions

| Module | Resource | admin | doctora | enfermera |
|---|---|---|---|---|
| Security | Users | CRUD | Read (own) | Read (own) |
| Security | Roles | Read | None | None |
| Patients | Patients | CRUD | CRUD | CRU |
| Agenda | Agenda | CRUD | CRUD | CRUD |
| Agenda | Disponibilidad | CRUD | CRUD | CRUD |
| Agenda | Bloqueos | CRUD | CRUD | CRUD |
| Agenda | Tipos Cita | CRUD | CRUD | CRUD |
| Citas | Citas | CRUD | CRUD | CRUD |
| Consultas | Consultas | CRUD | CRUD | R |
| Historias | Historias Clínicas | CRUD | CRUD | R |
| Documentos | Documentos | CRUD | CRUD | R |
| Documentos | Firmas | CRUD | Create | None |
| Contacto | Mensajes | CRUD | R | RU |

**Legend:**
- C = Create
- R = Read
- U = Update
- D = Delete

### 2.2 Action Permissions

| Action | admin | doctora | enfermera |
|---|---|---|---|
| Create user | Yes | No | No |
| Delete user | Yes | No | No |
| Change user role | Yes | No | No |
| Deactivate user | Yes | No | No |
| Create patient | Yes | Yes | Yes |
| Delete patient | Yes | No | No |
| Create appointment | Yes | Yes | Yes |
| Cancel appointment | Yes | Yes | Yes |
| Complete appointment | Yes | Yes | No |
| Create consultation | Yes | Yes | No |
| Delete consultation | Yes | No | No |
| Generate PDF | Yes | Yes | No |
| Sign document | Yes | Yes | No |
| Archive document | Yes | Yes | No |

---

## 3. Route Protection

### 3.1 Public Routes (No Auth Required)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/contact` | Contact form |

### 3.2 Protected Routes (Auth Required)

All routes under `/api/v1/**` except public routes require JWT authentication.

**Header:**

```
Authorization: Bearer {jwt_token}
```

### 3.3 Admin Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/users` | Create user |
| GET | `/api/v1/users` | List users |
| PUT | `/api/v1/users/{id}` | Update user |
| DELETE | `/api/v1/users/{id}` | Delete user |
| PUT | `/api/v1/users/{id}/role` | Change user role |

### 3.4 Doctora Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/consultations` | Create consultation |
| PUT | `/api/v1/consultations/{id}` | Update consultation |
| DELETE | `/api/v1/consultations/{id}` | Delete consultation |
| POST | `/api/v1/documents/{id}/sign` | Sign document |

### 3.5 Enfermera Routes

| Method | Endpoint | Description |
|---|---|---|
| PUT | `/api/v1/appointments/{id}/confirm` | Confirm appointment |
| PUT | `/api/v1/appointments/{id}/checkin` | Check in patient |

---

## 4. Data Access Rules

### 4.1 Data Ownership

| Resource | Owner | Access Rule |
|---|---|---|
| Patients | System | All authenticated users can access |
| Appointments | System | Users can access all |
| Consultations | System | Doctora can create/edit, Enfermera read-only |
| Documents | System | Users can access all |
| Users | Individual | Users can only see own profile |

### 4.2 Data Isolation

| Scenario | Rule |
|---|---|
| User views own profile | Allowed |
| User views other user profile | Denied (except admin) |
| User views patient data | Allowed |
| User modifies patient data | Allowed |
| User deletes patient data | Denied (except admin) |

### 4.3 Admin Data Access

| Resource | Admin Access |
|---|---|
| All users | Full CRUD |
| All patients | Full CRUD |
| All appointments | Full CRUD |
| All consultations | Full CRUD |
| All documents | Full CRUD |
| System config | Full access |

---

## 5. Admin Routes

### 5.1 User Management

| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| POST | `/api/v1/users` | Create user | {name, email, password, role} |
| GET | `/api/v1/users` | List users | — |
| GET | `/api/v1/users/{id}` | Get user | — |
| PUT | `/api/v1/users/{id}` | Update user | {name, email, role} |
| DELETE | `/api/v1/users/{id}` | Delete user | — |
| PUT | `/api/v1/users/{id}/activate` | Activate user | — |
| PUT | `/api/v1/users/{id}/deactivate` | Deactivate user | — |

### 5.2 System Configuration

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/config` | Get system config |
| PUT | `/api/v1/config` | Update system config |

### 5.3 Audit Logs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/audit` | List audit logs |
| GET | `/api/v1/audit/{id}` | Get audit log |

---

## 6. Implementation

### 6.1 Spring Security Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/health").permitAll()
                .requestMatchers("/api/v1/contact").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/users").hasRole("ADMIN")
                .requestMatchers("/api/v1/users/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/audit/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, 
                UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

### 6.2 Method-Level Security

```java
@Service
public class PacienteService {

    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTORA') or hasRole('ENFERMERA')")
    public List<Paciente> findAll() {
        return pacienteRepository.findAll();
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTORA')")
    public Consulta createConsulta(Consulta consulta) {
        return consultaRepository.save(consulta);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
```

---

## 7. Error Responses

### 7.1 Unauthorized (No Token)

```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

### 7.2 Forbidden (Insufficient Permissions)

```json
{
  "error": "Forbidden",
  "code": "FORBIDDEN",
  "message": "You don't have permission to access this resource"
}
```

### 7.3 Token Expired

```json
{
  "error": "Unauthorized",
  "code": "TOKEN_EXPIRED",
  "message": "Token has expired, please login again"
}
```

---

## 8. Security Considerations

### 8.1 Role Management

| Rule | Description |
|---|---|
| Only admin | Can create/modify/delete users |
| Role assignment | Only admin can change roles |
| Self-deactivation | Users cannot deactivate themselves |

### 8.2 Permission Escalation

| Risk | Mitigation |
|---|---|
| User changes own role | Server-side validation |
| Client-side bypass | JWT validation on server |
| Role manipulation | Signed JWT tokens |

### 8.3 Audit Trail

All authorization decisions are logged:

| Event | Logged |
|---|---|
| Login success | Yes |
| Login failure | Yes |
| Access denied | Yes |
| Role change | Yes |

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
