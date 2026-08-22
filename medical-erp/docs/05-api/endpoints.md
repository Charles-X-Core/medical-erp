# API Endpoints

---
Document ID: API-002
Status: Draft
Version: 1.0.0
Owner: API
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [API-001, DOM-SEG-001, DOM-PAC-001, DOM-HCL-001, DOM-CIT-001, DOM-CON-001, DOM-DOC-001, DOM-CON-002]
---

## 1. Authentication Endpoints

### 1.1 POST /api/auth/login

Login and receive JWT token.

**Request:**

```json
{
  "email": "maria@clinica.com",
  "password": "Password123"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": 1,
      "nombre": "Dr. María García",
      "email": "maria@clinica.com",
      "rol": "doctora"
    }
  },
  "message": "Login exitoso",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| INVALID_CREDENTIALS | 401 | Email o contraseña incorrectos |
| USER_INACTIVE | 401 | Cuenta desactivada |

---

### 1.2 GET /api/auth/me

Get current authenticated user.

**Request:**

```
GET /api/auth/me
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "nombre": "Dr. María García",
    "email": "maria@clinica.com",
    "rol": "doctora",
    "activo": true
  },
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

---

### 1.3 PUT /api/auth/perfil

Update current user profile.

**Request:**

```json
{
  "nombre": "Dr. María García López",
  "telefono": "999888777"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "nombre": "Dr. María García López",
    "email": "maria@clinica.com",
    "telefono": "999888777",
    "updated_at": "2026-07-28T12:00:00Z"
  },
  "message": "Perfil actualizado exitosamente",
  "timestamp": "2026-07-28T12:00:00Z"
}
```

---

### 1.4 PUT /api/auth/password

Change current user password.

**Request:**

```json
{
  "password_actual": "Password123",
  "password_nueva": "NewPassword456"
}
```

**Response (200 OK):**

```json
{
  "data": null,
  "message": "Contraseña actualizada exitosamente",
  "timestamp": "2026-07-28T12:00:00Z"
}
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| INVALID_PASSWORD | 400 | Contraseña actual incorrecta |
| PASSWORD_WEAK | 400 | Nueva contraseña no cumple requisitos |

---

## 1.5 Admin User Management

> **⚠️ SECURITY:** These endpoints are **ADMIN ONLY**. No public registration exists.
> Users are created exclusively by the administrator through these endpoints.
> The first admin user is created via SQL seed script during deployment.

---

### 1.5.1 POST /api/v1/users

Create new user (admin only).

**Request:**

```json
{
  "nombre": "Dr. Pedro Sánchez",
  "email": "pedro@clinica.com",
  "password": "TemporaryPass123",
  "rol": "doctora"
}
```

**Response (201 Created):**

```json
{
  "data": {
    "id": 2,
    "nombre": "Dr. Pedro Sánchez",
    "email": "pedro@clinica.com",
    "rol": "doctora",
    "activo": true,
    "created_at": "2026-07-28T10:00:00Z"
  },
  "message": "Usuario creado exitosamente",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| DUPLICATE_EMAIL | 409 | Email ya registrado |
| INVALID_ROLE | 400 | Rol no válido |
| FORBIDDEN | 403 | Solo admin puede crear usuarios |
| PASSWORD_WEAK | 400 | Contraseña no cumple requisitos |

---

### 1.5.2 GET /api/v1/users

List all users (admin only).

**Request:**

```
GET /api/v1/users?page=0&size=20&rol=doctora
Authorization: Bearer {admin_token}
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "nombre": "Admin Sistema",
      "email": "admin@clinica.com",
      "rol": "admin",
      "activo": true,
      "created_at": "2026-07-28T08:00:00Z"
    },
    {
      "id": 2,
      "nombre": "Dr. Pedro Sánchez",
      "email": "pedro@clinica.com",
      "rol": "doctora",
      "activo": true,
      "created_at": "2026-07-28T10:00:00Z"
    }
  ],
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z",
  "pagination": {
    "page": 0,
    "size": 20,
    "total_elements": 3,
    "total_pages": 1
  }
}
```

---

### 1.5.3 GET /api/v1/users/{id}

Get user by ID (admin only).

**Request:**

```
GET /api/v1/users/2
Authorization: Bearer {admin_token}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 2,
    "nombre": "Dr. Pedro Sánchez",
    "email": "pedro@clinica.com",
    "rol": "doctora",
    "activo": true,
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T10:00:00Z"
  },
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

---

### 1.5.4 PUT /api/v1/users/{id}

Update user (admin only).

**Request:**

```json
{
  "nombre": "Dr. Pedro Sánchez López",
  "rol": "enfermera"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 2,
    "nombre": "Dr. Pedro Sánchez López",
    "email": "pedro@clinica.com",
    "rol": "enfermera",
    "activo": true,
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T12:00:00Z"
  },
  "message": "Usuario actualizado exitosamente",
  "timestamp": "2026-07-28T12:00:00Z"
}
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| NOT_FOUND | 404 | Usuario no encontrado |
| INVALID_ROLE | 400 | Rol no válido |
| CANT_DEACTIVATE_SELF | 400 | No puede desactivarse a sí mismo |
| CANT_CHANGE_OWN_ROLE | 400 | No puede cambiar su propio rol |

---

### 1.5.5 PUT /api/v1/users/{id}/deactivate

Deactivate user (admin only).

**Request:**

```
PUT /api/v1/users/2/deactivate
Authorization: Bearer {admin_token}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 2,
    "nombre": "Dr. Pedro Sánchez",
    "email": "pedro@clinica.com",
    "rol": "doctora",
    "activo": false,
    "deactivated_at": "2026-07-28T12:00:00Z"
  },
  "message": "Usuario desactivado exitosamente",
  "timestamp": "2026-07-28T12:00:00Z"
}
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| NOT_FOUND | 404 | Usuario no encontrado |
| CANT_DEACTIVATE_SELF | 400 | No puede desactivarse a sí mismo |
| ALREADY_INACTIVE | 400 | Usuario ya está desactivado |

---

### 1.5.6 PUT /api/v1/users/{id}/activate

Activate user (admin only).

**Request:**

```
PUT /api/v1/users/2/activate
Authorization: Bearer {admin_token}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 2,
    "nombre": "Dr. Pedro Sánchez",
    "email": "pedro@clinica.com",
    "rol": "doctora",
    "activo": true,
    "activated_at": "2026-07-28T12:00:00Z"
  },
  "message": "Usuario activado exitosamente",
  "timestamp": "2026-07-28T12:00:00Z"
}
```

---

### 1.5.7 PUT /api/v1/users/{id}/reset-password

Reset user password (admin only).

**Request:**

```json
{
  "password_nueva": "NewSecurePass456"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 2,
    "nombre": "Dr. Pedro Sánchez",
    "email": "pedro@clinica.com",
    "password_reset_at": "2026-07-28T12:00:00Z"
  },
  "message": "Contraseña restablecida exitosamente",
  "timestamp": "2026-07-28T12:00:00Z"
}
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| NOT_FOUND | 404 | Usuario no encontrado |
| PASSWORD_WEAK | 400 | Contraseña no cumple requisitos |

---

### 1.5.8 Security Notes

| Rule | Description |
|---|---|
| No public registration | There is NO public registration endpoint |
| Admin only | Only admin can create users |
| Password assignment | Admin assigns initial password |
| First admin | Created via SQL seed script |
| Audit logged | All user management actions are logged |

---

## 2. Patients Endpoints

### 2.1 POST /api/pacientes

Create new patient.

**Request:**

```json
{
  "apellido_paterno": "García",
  "apellido_materno": "López",
  "nombres": "María Elena",
  "dni": "12345678",
  "tipo_documento": "dni",
  "telefono": "999888777",
  "email": "maria@email.com",
  "fecha_nacimiento": "1990-05-15",
  "sexo": "F",
  "estado_civil": "soltera",
  "direccion": "Av. Principal 123",
  "lugar_nacimiento": "Lima",
  "lugar_procedencia": "Lima",
  "grado_instruccion": "Universitario",
  "ocupacion": "Ingeniera",
  "nombre_acompanante": "Juan García",
  "contacto_emergencia": "Pedro López",
  "telefono_emergencia": "999777666",
  "alergias": "Penicilina",
  "antecedentes_personales": "Ninguno",
  "antecedentes_familiares": "Diabetes"
}
```

**Response (201 Created):**

```json
{
  "data": {
    "id": 123,
    "apellido_paterno": "García",
    "apellido_materno": "López",
    "nombres": "María Elena",
    "dni": "12345678",
    "tipo_documento": "dni",
    "telefono": "999888777",
    "email": "maria@email.com",
    "fecha_nacimiento": "1990-05-15",
    "sexo": "F",
    "estado_civil": "soltera",
    "direccion": "Av. Principal 123",
    "lugar_nacimiento": "Lima",
    "lugar_procedencia": "Lima",
    "grado_instruccion": "Universitario",
    "ocupacion": "Ingeniera",
    "nombre_acompanante": "Juan García",
    "contacto_emergencia": "Pedro López",
    "telefono_emergencia": "999777666",
    "alergias": "Penicilina",
    "antecedentes_personales": "Ninguno",
    "antecedentes_familiares": "Diabetes",
    "estado": "activo",
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T10:00:00Z"
  },
  "message": "Paciente creado exitosamente",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| VALIDATION_ERROR | 400 | Campos requeridos faltantes |
| DUPLICATE_DNI | 409 | DNI ya registrado |

---

### 2.2 GET /api/pacientes

List all patients with pagination and filters.

**Request:**

```
GET /api/pacientes?page=0&size=20&sort=nombres,asc&estado=activo
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 123,
      "apellido_paterno": "García",
      "apellido_materno": "López",
      "nombres": "María Elena",
      "dni": "12345678",
      "tipo_documento": "dni",
      "telefono": "999888777",
      "email": "maria@email.com",
      "fecha_nacimiento": "1990-05-15",
      "sexo": "F",
      "estado": "activo",
      "created_at": "2026-07-28T10:00:00Z"
    }
  ],
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z",
  "pagination": {
    "page": 0,
    "size": 20,
    "total_elements": 150,
    "total_pages": 8
  }
}
```

---

### 2.3 GET /api/pacientes/buscar

Search patients by name, DNI, or phone.

**Request:**

```
GET /api/pacientes/buscar?q=maria
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 123,
      "apellido_paterno": "García",
      "nombres": "María Elena",
      "dni": "12345678",
      "telefono": "999888777"
    }
  ],
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

---

### 2.4 GET /api/pacientes/{id}

Get patient by ID.

**Request:**

```
GET /api/pacientes/123
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 123,
    "apellido_paterno": "García",
    "apellido_materno": "López",
    "nombres": "María Elena",
    "dni": "12345678",
    "tipo_documento": "dni",
    "telefono": "999888777",
    "email": "maria@email.com",
    "fecha_nacimiento": "1990-05-15",
    "sexo": "F",
    "estado_civil": "soltera",
    "direccion": "Av. Principal 123",
    "lugar_nacimiento": "Lima",
    "lugar_procedencia": "Lima",
    "grado_instruccion": "Universitario",
    "ocupacion": "Ingeniera",
    "nombre_acompanante": "Juan García",
    "contacto_emergencia": "Pedro López",
    "telefono_emergencia": "999777666",
    "alergias": "Penicilina",
    "antecedentes_personales": "Ninguno",
    "antecedentes_familiares": "Diabetes",
    "estado": "activo",
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T10:00:00Z"
  },
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| NOT_FOUND | 404 | Paciente no encontrado |

---

### 2.5 PUT /api/pacientes/{id}

Update patient.

**Request:**

```json
{
  "apellido_paterno": "García",
  "apellido_materno": "López",
  "nombres": "María Elena",
  "dni": "12345678",
  "tipo_documento": "dni",
  "telefono": "999888777",
  "email": "maria@email.com",
  "fecha_nacimiento": "1990-05-15",
  "sexo": "F",
  "estado_civil": "casada",
  "direccion": "Av. Principal 456"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 123,
    "apellido_paterno": "García",
    "apellido_materno": "López",
    "nombres": "María Elena",
    "dni": "12345678",
    "tipo_documento": "dni",
    "telefono": "999888777",
    "email": "maria@email.com",
    "fecha_nacimiento": "1990-05-15",
    "sexo": "F",
    "estado_civil": "casada",
    "direccion": "Av. Principal 456",
    "estado": "activo",
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T12:00:00Z"
  },
  "message": "Paciente actualizado exitosamente",
  "timestamp": "2026-07-28T12:00:00Z"
}
```

---

### 2.6 DELETE /api/pacientes/{id}

Deactivate patient (soft delete).

**Request:**

```
DELETE /api/pacientes/123
Authorization: Bearer {token}
```

**Response (204 No Content):**

```
(empty body)
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| NOT_FOUND | 404 | Paciente no encontrado |
| FORBIDDEN | 403 | Solo admin puede eliminar |

---

## 3. Medical History Endpoints

### 3.1 POST /api/historias

Create medical history for patient.

**Request:**

```json
{
  "paciente_id": 123,
  "alergia_medicamentos": "Penicilina",
  "cardiopatias_personales": "Ninguna",
  "cardiopatias_familiares": "Hipertensión",
  "diabetes_personal": "No",
  "diabetes_familiar": "Madre",
  "hepatitis": "No",
  "otras_enfermedades": "Ninguna",
  "observaciones": "Paciente sana"
}
```

**Response (201 Created):**

```json
{
  "data": {
    "id": 456,
    "paciente_id": 123,
    "numero_historia": "HCL-2026-00001",
    "alergia_medicamentos": "Penicilina",
    "cardiopatias_personales": "Ninguna",
    "cardiopatias_familiares": "Hipertensión",
    "diabetes_personal": "No",
    "diabetes_familiar": "Madre",
    "hepatitis": "No",
    "otras_enfermedades": "Ninguna",
    "observaciones": "Paciente sana",
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T10:00:00Z"
  },
  "message": "Historia clínica creada exitosamente",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| DUPLICATE_HISTORY | 409 | Paciente ya tiene historia clínica |
| PATIENT_NOT_FOUND | 404 | Paciente no encontrado |

---

### 3.2 GET /api/historias/paciente/{pacienteId}

Get medical history by patient ID.

**Request:**

```
GET /api/historias/paciente/123
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 456,
    "paciente_id": 123,
    "numero_historia": "HCL-2026-00001",
    "alergia_medicamentos": "Penicilina",
    "cardiopatias_personales": "Ninguna",
    "cardiopatias_familiares": "Hipertensión",
    "diabetes_personal": "No",
    "diabetes_familiar": "Madre",
    "hepatitis": "No",
    "otras_enfermedades": "Ninguna",
    "observaciones": "Paciente sana",
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T10:00:00Z"
  },
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| NOT_FOUND | 404 | Historia clínica no encontrada |

---

### 3.3 PUT /api/historias/{id}

Update medical history.

**Request:**

```json
{
  "alergia_medicamentos": "Penicilina, Aspirina",
  "cardiopatias_personales": "Ninguna",
  "cardiopatias_familiares": "Hipertensión",
  "diabetes_personal": "No",
  "diabetes_familiar": "Madre",
  "hepatitis": "No",
  "otras_enfermedades": "Ninguna",
  "observaciones": "Paciente sana, actualizado con nuevas alergias"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 456,
    "paciente_id": 123,
    "numero_historia": "HCL-2026-00001",
    "alergia_medicamentos": "Penicilina, Aspirina",
    "cardiopatias_personales": "Ninguna",
    "cardiopatias_familiares": "Hipertensión",
    "diabetes_personal": "No",
    "diabetes_familiar": "Madre",
    "hepatitis": "No",
    "otras_enfermedades": "Ninguna",
    "observaciones": "Paciente sana, actualizado con nuevas alergias",
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T12:00:00Z"
  },
  "message": "Historia clínica actualizada exitosamente",
  "timestamp": "2026-07-28T12:00:00Z"
}
```

---

## 4. Consultations Endpoints

### 4.1 POST /api/consultas

Create new consultation.

**Request:**

```json
{
  "historia_id": 456,
  "cita_id": 789,
  "fecha": "2026-07-28T10:00:00Z",
  "motivo": "Dolor de cabeza recurrente",
  "tiempo_enfermedad": "2 semanas",
  "signos_sintomas": "Cefalea frontal, náuseas leves",
  "relato_cronologico": "Paciente refiere dolor de cabeza desde hace 2 semanas",
  "signos_vitales": {
    "presion_arterial": "120/80",
    "pulso": 72,
    "temperatura": 36.5,
    "peso": 65,
    "talla": 165,
    "saturacion": 98
  },
  "examen_clinico_general": "Paciente consciente, orientada, facies de dolor",
  "diagnostico_lista": [
    {
      "codigo": "G43.9",
      "nombre": "Migraña, no especificada"
    }
  ],
  "plan_tratamiento": {
    "medicamentos": [
      {
        "nombre": "Ibuprofeno",
        "dosis": "400mg",
        "frecuencia": "Cada 8 horas",
        "duracion": "5 días"
      }
    ],
    "indicaciones": "Reposo parcial, hidratación adecuada"
  },
  "notas": "Control en 2 semanas"
}
```

**Response (201 Created):**

```json
{
  "data": {
    "id": 101,
    "historia_id": 456,
    "cita_id": 789,
    "fecha": "2026-07-28T10:00:00Z",
    "motivo": "Dolor de cabeza recurrente",
    "tiempo_enfermedad": "2 semanas",
    "signos_sintomas": "Cefalea frontal, náuseas leves",
    "relato_cronologico": "Paciente refiere dolor de cabeza desde hace 2 semanas",
    "signos_vitales": {
      "presion_arterial": "120/80",
      "pulso": 72,
      "temperatura": 36.5,
      "peso": 65,
      "talla": 165,
      "saturacion": 98
    },
    "examen_clinico_general": "Paciente consciente, orientada, facies de dolor",
    "diagnostico_lista": [
      {
        "codigo": "G43.9",
        "nombre": "Migraña, no especificada"
      }
    ],
    "plan_tratamiento": {
      "medicamentos": [
        {
          "nombre": "Ibuprofeno",
          "dosis": "400mg",
          "frecuencia": "Cada 8 horas",
          "duracion": "5 días"
        }
      ],
      "indicaciones": "Reposo parcial, hidratación adecuada"
    },
    "notas": "Control en 2 semanas",
    "firmado": false,
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T10:00:00Z"
  },
  "message": "Consulta creada exitosamente",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| HISTORY_NOT_FOUND | 404 | Historia clínica no encontrada |
| APPOINTMENT_NOT_FOUND | 404 | Cita no encontrada |
| FORBIDDEN | 403 | Solo doctora puede crear consultas |

---

### 4.2 GET /api/consultas/historia/{historiaId}

List consultations by medical history.

**Request:**

```
GET /api/consultas/historia/456?page=0&size=10&sort=fecha,desc
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 101,
      "historia_id": 456,
      "cita_id": 789,
      "fecha": "2026-07-28T10:00:00Z",
      "motivo": "Dolor de cabeza recurrente",
      "diagnostico_lista": [
        {
          "codigo": "G43.9",
          "nombre": "Migraña, no especificada"
        }
      ],
      "firmado": true,
      "created_at": "2026-07-28T10:00:00Z"
    }
  ],
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z",
  "pagination": {
    "page": 0,
    "size": 10,
    "total_elements": 15,
    "total_pages": 2
  }
}
```

---

### 4.3 GET /api/consultas/{id}

Get consultation by ID.

**Request:**

```
GET /api/consultas/101
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 101,
    "historia_id": 456,
    "cita_id": 789,
    "fecha": "2026-07-28T10:00:00Z",
    "motivo": "Dolor de cabeza recurrente",
    "tiempo_enfermedad": "2 semanas",
    "signos_sintomas": "Cefalea frontal, náuseas leves",
    "relato_cronologico": "Paciente refiere dolor de cabeza desde hace 2 semanas",
    "signos_vitales": {
      "presion_arterial": "120/80",
      "pulso": 72,
      "temperatura": 36.5,
      "peso": 65,
      "talla": 165,
      "saturacion": 98
    },
    "examen_clinico_general": "Paciente consciente, orientada, facies de dolor",
    "diagnostico_lista": [
      {
        "codigo": "G43.9",
        "nombre": "Migraña, no especificada"
      }
    ],
    "plan_tratamiento": {
      "medicamentos": [
        {
          "nombre": "Ibuprofeno",
          "dosis": "400mg",
          "frecuencia": "Cada 8 horas",
          "duracion": "5 días"
        }
      ],
      "indicaciones": "Reposo parcial, hidratación adecuada"
    },
    "notas": "Control en 2 semanas",
    "firmado": true,
    "firmado_at": "2026-07-28T11:00:00Z",
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T11:00:00Z"
  },
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

---

### 4.4 PUT /api/consultas/{id}

Update consultation (only if not signed).

**Request:**

```json
{
  "notas": "Control en 1 semana, ajustar dosis"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 101,
    "historia_id": 456,
    "cita_id": 789,
    "fecha": "2026-07-28T10:00:00Z",
    "motivo": "Dolor de cabeza recurrente",
    "notas": "Control en 1 semana, ajustar dosis",
    "firmado": false,
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T12:00:00Z"
  },
  "message": "Consulta actualizada exitosamente",
  "timestamp": "2026-07-28T12:00:00Z"
}
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| CONSULTA_SIGNED | 400 | No se puede modificar consulta firmada |
| FORBIDDEN | 403 | Solo doctora puede editar |

---

### 4.5 DELETE /api/consultas/{id}

Delete consultation (soft delete).

**Request:**

```
DELETE /api/consultas/101
Authorization: Bearer {token}
```

**Response (204 No Content):**

```
(empty body)
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| CONSULTA_SIGNED | 400 | No se puede eliminar consulta firmada |
| FORBIDDEN | 403 | Solo admin puede eliminar |

---

## 5. Appointments Endpoints

### 5.1 POST /api/citas

Create new appointment.

**Request:**

```json
{
  "paciente_id": 123,
  "usuario_id": 1,
  "tipo_cita_id": 1,
  "fecha": "2026-08-01",
  "hora": "10:00:00",
  "duracion_minutos": 30,
  "motivo": "Consulta de control"
}
```

**Response (201 Created):**

```json
{
  "data": {
    "id": 201,
    "paciente_id": 123,
    "usuario_id": 1,
    "tipo_cita_id": 1,
    "fecha": "2026-08-01",
    "hora": "10:00:00",
    "duracion_minutos": 30,
    "motivo": "Consulta de control",
    "estado": "pendiente",
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T10:00:00Z"
  },
  "message": "Cita creada exitosamente",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| PATIENT_NOT_FOUND | 404 | Paciente no encontrado |
| DOCTOR_NOT_FOUND | 404 | Doctora no encontrado |
| APPOINTMENT_CONFLICT | 409 | Horario no disponible |
| PAST_DATE | 400 | No se puede agendar en el pasado |

---

### 5.2 GET /api/citas

List all appointments with filters.

**Request:**

```
GET /api/citas?page=0&size=20&fecha=2026-08-01&estado=pendiente
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 201,
      "paciente_id": 123,
      "paciente_nombre": "María García",
      "usuario_id": 1,
      "usuario_nombre": "Dr. María García",
      "tipo_cita_id": 1,
      "tipo_cita_nombre": "Consulta",
      "fecha": "2026-08-01",
      "hora": "10:00:00",
      "duracion_minutos": 30,
      "motivo": "Consulta de control",
      "estado": "pendiente",
      "created_at": "2026-07-28T10:00:00Z"
    }
  ],
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z",
  "pagination": {
    "page": 0,
    "size": 20,
    "total_elements": 50,
    "total_pages": 3
  }
}
```

---

### 5.3 GET /api/citas/hoy

Get today's appointments.

**Request:**

```
GET /api/citas/hoy
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 201,
      "paciente_id": 123,
      "paciente_nombre": "María García",
      "usuario_id": 1,
      "usuario_nombre": "Dr. María García",
      "hora": "10:00:00",
      "duracion_minutos": 30,
      "motivo": "Consulta de control",
      "estado": "pendiente"
    },
    {
      "id": 202,
      "paciente_id": 124,
      "paciente_nombre": "Juan López",
      "usuario_id": 1,
      "usuario_nombre": "Dr. María García",
      "hora": "11:00:00",
      "duracion_minutos": 30,
      "motivo": "Primera consulta",
      "estado": "confirmada"
    }
  ],
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

---

### 5.4 GET /api/citas/{id}

Get appointment by ID.

**Request:**

```
GET /api/citas/201
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 201,
    "paciente_id": 123,
    "paciente_nombre": "María García",
    "usuario_id": 1,
    "usuario_nombre": "Dr. María García",
    "tipo_cita_id": 1,
    "tipo_cita_nombre": "Consulta",
    "fecha": "2026-08-01",
    "hora": "10:00:00",
    "duracion_minutos": 30,
    "motivo": "Consulta de control",
    "notas": "Traer resultados de exámenes",
    "estado": "pendiente",
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T10:00:00Z"
  },
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

---

### 5.5 PUT /api/citas/{id}

Update appointment.

**Request:**

```json
{
  "fecha": "2026-08-02",
  "hora": "14:00:00",
  "notas": "Cita reprogramada por solicitud del paciente"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 201,
    "paciente_id": 123,
    "paciente_nombre": "María García",
    "usuario_id": 1,
    "usuario_nombre": "Dr. María García",
    "tipo_cita_id": 1,
    "tipo_cita_nombre": "Consulta",
    "fecha": "2026-08-02",
    "hora": "14:00:00",
    "duracion_minutos": 30,
    "motivo": "Consulta de control",
    "notas": "Cita reprogramada por solicitud del paciente",
    "estado": "pendiente",
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T12:00:00Z"
  },
  "message": "Cita actualizada exitosamente",
  "timestamp": "2026-07-28T12:00:00Z"
}
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| APPOINTMENT_CONFLICT | 409 | Horario no disponible |
| PAST_DATE | 400 | No se puede agendar en el pasado |
| INVALID_STATE | 400 | No se puede modificar cita en este estado |

---

### 5.6 DELETE /api/citas/{id}

Cancel appointment.

**Request:**

```
DELETE /api/citas/201
Authorization: Bearer {token}
```

**Response (204 No Content):**

```
(empty body)
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| INVALID_STATE | 400 | No se puede cancelar cita completada |
| PAST_APPOINTMENT | 400 | No se puede cancelar cita pasada |

---

## 6. Documents Endpoints

### 6.1 POST /api/documentos

Create new document.

**Request:**

```json
{
  "paciente_id": 123,
  "cita_id": 201,
  "consulta_id": 101,
  "tipo": "receta",
  "titulo": "Receta Médica - María García",
  "archivo_nombre": "receta_2026_07_28.pdf"
}
```

**Response (201 Created):**

```json
{
  "data": {
    "id": 301,
    "paciente_id": 123,
    "cita_id": 201,
    "consulta_id": 101,
    "usuario_id": 1,
    "tipo": "receta",
    "titulo": "Receta Médica - María García",
    "archivo_ruta": "/pdfs/2026/07/receta_301.pdf",
    "archivo_nombre": "receta_2026_07_28.pdf",
    "hash_sha256": "abc123...",
    "firmado": false,
    "estado": "borrador",
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T10:00:00Z"
  },
  "message": "Documento creado exitosamente",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| PATIENT_NOT_FOUND | 404 | Paciente no encontrado |
| APPOINTMENT_NOT_FOUND | 404 | Cita no encontrada |
| CONSULTATION_NOT_FOUND | 404 | Consulta no encontrada |

---

### 6.2 GET /api/documentos/paciente/{pacienteId}

List documents by patient.

**Request:**

```
GET /api/documentos/paciente/123?page=0&size=10&tipo=receta
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 301,
      "paciente_id": 123,
      "tipo": "receta",
      "titulo": "Receta Médica - María García",
      "archivo_nombre": "receta_2026_07_28.pdf",
      "firmado": true,
      "estado": "firmado",
      "created_at": "2026-07-28T10:00:00Z"
    }
  ],
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z",
  "pagination": {
    "page": 0,
    "size": 10,
    "total_elements": 5,
    "total_pages": 1
  }
}
```

---

### 6.3 GET /api/documentos/{id}

Get document by ID.

**Request:**

```
GET /api/documentos/301
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 301,
    "paciente_id": 123,
    "paciente_nombre": "María García",
    "cita_id": 201,
    "consulta_id": 101,
    "usuario_id": 1,
    "usuario_nombre": "Dr. María García",
    "tipo": "receta",
    "titulo": "Receta Médica - María García",
    "archivo_ruta": "/pdfs/2026/07/receta_301.pdf",
    "archivo_nombre": "receta_2026_07_28.pdf",
    "hash_sha256": "abc123...",
    "firma_imagen": "data:image/png;base64,...",
    "firmado": true,
    "firmado_at": "2026-07-28T11:00:00Z",
    "estado": "firmado",
    "created_at": "2026-07-28T10:00:00Z",
    "updated_at": "2026-07-28T11:00:00Z"
  },
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

---

### 6.4 GET /api/documentos/{id}/pdf

Download document PDF.

**Request:**

```
GET /api/documentos/301/pdf
Authorization: Bearer {token}
```

**Response (200 OK):**

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="receta_2026_07_28.pdf"

[PDF binary data]
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| NOT_FOUND | 404 | Documento no encontrado |
| PDF_NOT_GENERATED | 400 | PDF no generado aún |

---

## 7. Contact Endpoints

### 7.1 POST /api/contact

Send contact message (public).

**Request:**

```json
{
  "nombre": "Pedro López",
  "email": "pedro@email.com",
  "telefono": "999888777",
  "asunto": "Consulta sobre servicios",
  "mensaje": "Me gustaría información sobre sus servicios de ortodoncia."
}
```

**Response (201 Created):**

```json
{
  "data": {
    "id": 401,
    "nombre": "Pedro López",
    "email": "pedro@email.com",
    "telefono": "999888777",
    "asunto": "Consulta sobre servicios",
    "mensaje": "Me gustaría información sobre sus servicios de ortodoncia.",
    "estado": "pendiente",
    "created_at": "2026-07-28T10:00:00Z"
  },
  "message": "Mensaje enviado exitosamente. Nos pondremos en contacto pronto.",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

**Errors:**

| Code | HTTP | Description |
|---|---|---|
| VALIDATION_ERROR | 400 | Campos requeridos faltantes |
| RATE_LIMIT_EXCEEDED | 429 | Demasiadas solicitudes |
| SPAM_DETECTED | 400 | Mensaje detectado como spam |

---

## 8. Health Endpoints

### 8.1 GET /api/health

Health check (public).

**Request:**

```
GET /api/health
```

**Response (200 OK):**

```json
{
  "data": {
    "status": "UP",
    "timestamp": "2026-07-28T10:00:00Z",
    "version": "1.0.0",
    "database": "UP",
    "uptime": 86400
  },
  "message": "System healthy",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
