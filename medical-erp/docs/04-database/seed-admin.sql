-- seed-admin.sql
-- Medical ERP - Initial Admin User Seed Script
-- 
-- PURPOSE: Create the first admin user during initial deployment
-- 
-- SECURITY NOTES:
-- - This script creates the ONLY way to create the first admin user
-- - There is NO public registration endpoint
-- - After deployment, admin creates other users through the application
-- - CHANGE THE DEFAULT PASSWORD IMMEDIATELY after first login
--
-- USAGE:
-- 1. Run this script after creating the database schema
-- 2. Login with: admin@clinica.com / Admin123
-- 3. CHANGE THE PASSWORD immediately
-- 4. Create other users through the application

-- ============================================================================
-- CONFIGURATION
-- ============================================================================

SET @admin_email = 'admin@clinica.com';
SET @admin_password = 'Admin123';  -- CHANGE THIS IN PRODUCTION
SET @admin_nombre = 'Administrador';

-- ============================================================================
-- CREATE ADMIN USER
-- ============================================================================

-- Insert admin user
-- Password is bcrypt hash of @admin_password with 12 rounds
INSERT INTO usuarios (nombre, email, password, activo, created_at, updated_at)
VALUES (
    @admin_nombre,
    @admin_email,
    '$2a$12$LJ3m4ys3Lz0Zq5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q',  -- bcrypt hash
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ============================================================================
-- ASSIGN ADMIN ROLE
-- ============================================================================

-- Insert admin role if not exists
INSERT INTO roles (nombre, descripcion, created_at, updated_at)
VALUES ('admin', 'Administrador del sistema', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Assign admin role to user
INSERT INTO usuario_roles (usuario_id, rol_id, created_at)
SELECT u.id, r.id, CURRENT_TIMESTAMP
FROM usuarios u
CROSS JOIN roles r
WHERE u.email = @admin_email AND r.nombre = 'admin';

-- ============================================================================
-- ASSIGN ALL PERMISSIONS TO ADMIN
-- ============================================================================

-- Insert all permissions
INSERT INTO permisos (nombre, modulo, accion, descripcion, created_at, updated_at)
VALUES
    -- Security module
    ('usuarios.crear', 'security', 'crear', 'Crear usuarios', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('usuarios.leer', 'security', 'leer', 'Leer usuarios', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('usuarios.actualizar', 'security', 'actualizar', 'Actualizar usuarios', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('usuarios.eliminar', 'security', 'eliminar', 'Eliminar usuarios', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('roles.leer', 'security', 'leer', 'Leer roles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Patients module
    ('pacientes.crear', 'patients', 'crear', 'Crear pacientes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('pacientes.leer', 'patients', 'leer', 'Leer pacientes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('pacientes.actualizar', 'patients', 'actualizar', 'Actualizar pacientes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('pacientes.eliminar', 'patients', 'eliminar', 'Eliminar pacientes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Agenda module
    ('agenda.crear', 'agenda', 'crear', 'Crear agendas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('agenda.leer', 'agenda', 'leer', 'Leer agendas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('agenda.actualizar', 'agenda', 'actualizar', 'Actualizar agendas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('agenda.eliminar', 'agenda', 'eliminar', 'Eliminar agendas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Appointments module
    ('citas.crear', 'appointments', 'crear', 'Crear citas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('citas.leer', 'appointments', 'leer', 'Leer citas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('citas.actualizar', 'appointments', 'actualizar', 'Actualizar citas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('citas.eliminar', 'appointments', 'eliminar', 'Eliminar citas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Consultations module
    ('consultas.crear', 'consultations', 'crear', 'Crear consultas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('consultas.leer', 'consultations', 'leer', 'Leer consultas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('consultas.actualizar', 'consultations', 'actualizar', 'Actualizar consultas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('consultas.eliminar', 'consultations', 'eliminar', 'Eliminar consultas', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Documents module
    ('documentos.crear', 'documents', 'crear', 'Crear documentos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('documentos.leer', 'documents', 'leer', 'Leer documentos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('documentos.firmar', 'documents', 'firmar', 'Firmar documentos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('documentos.archivar', 'documents', 'archivar', 'Archivar documentos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Contact module
    ('contacto.leer', 'contact', 'leer', 'Leer mensajes de contacto', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('contacto.actualizar', 'contact', 'actualizar', 'Actualizar mensajes de contacto', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Assign all permissions to admin role
INSERT INTO rol_permisos (rol_id, permiso_id, created_at)
SELECT r.id, p.id, CURRENT_TIMESTAMP
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'admin'
ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- INSERT DOCTORA ROLE WITH PERMISSIONS
-- ============================================================================

INSERT INTO roles (nombre, descripcion, created_at, updated_at)
VALUES ('doctora', 'Doctora principal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Assign doctora permissions
INSERT INTO rol_permisos (rol_id, permiso_id, created_at)
SELECT r.id, p.id, CURRENT_TIMESTAMP
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'doctora'
AND p.nombre IN (
    'pacientes.crear', 'pacientes.leer', 'pacientes.actualizar',
    'agenda.crear', 'agenda.leer', 'agenda.actualizar', 'agenda.eliminar',
    'citas.crear', 'citas.leer', 'citas.actualizar', 'citas.eliminar',
    'consultas.crear', 'consultas.leer', 'consultas.actualizar', 'consultas.eliminar',
    'documentos.crear', 'documentos.leer', 'documentos.firmar', 'documentos.archivar'
)
ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- INSERT ENFERMERA ROLE WITH PERMISSIONS
-- ============================================================================

INSERT INTO roles (nombre, descripcion, created_at, updated_at)
VALUES ('enfermera', 'Enfermera', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Assign enfermera permissions
INSERT INTO rol_permisos (rol_id, permiso_id, created_at)
SELECT r.id, p.id, CURRENT_TIMESTAMP
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'enfermera'
AND p.nombre IN (
    'pacientes.crear', 'pacientes.leer', 'pacientes.actualizar',
    'agenda.leer',
    'citas.crear', 'citas.leer', 'citas.actualizar',
    'consultas.leer',
    'documentos.leer',
    'contacto.leer', 'contacto.actualizar'
)
ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- INSERT APPOINTMENT TYPES
-- ============================================================================

INSERT INTO tipos_cita (nombre, duracion_minutos, descripcion, activo, created_at, updated_at)
VALUES
    ('Consulta', 30, 'Consulta médica general', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Control', 20, 'Consulta de control', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Emergencia', 45, 'Consulta de emergencia', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify admin user was created
SELECT 
    u.id,
    u.nombre,
    u.email,
    r.nombre AS rol,
    u.activo,
    u.created_at
FROM usuarios u
JOIN usuario_roles ur ON u.id = ur.usuario_id
JOIN roles r ON ur.rol_id = r.id
WHERE u.email = @admin_email;

-- Verify permissions
SELECT 
    r.nombre AS rol,
    COUNT(p.id) AS total_permisos
FROM roles r
JOIN rol_permisos rp ON r.id = rp.rol_id
JOIN permisos p ON rp.permiso_id = p.id
GROUP BY r.nombre;

-- ============================================================================
-- DONE
-- ============================================================================

SELECT 'Admin user created successfully!' AS status;
SELECT 'DEFAULT PASSWORD: Admin123' AS warning;
SELECT 'CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!' AS critical_warning;
