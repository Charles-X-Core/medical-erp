-- V1__create_usuarios_roles_permisos.sql
-- Description: Create security tables (users, roles, permissions, junction tables)
-- Author: Medical ERP System
-- Date: 2026-07-29

CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_usuarios_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_roles_nombre UNIQUE (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permisos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_permisos_nombre UNIQUE (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuario_roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    rol_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_usuario_roles UNIQUE (usuario_id, rol_id),
    CONSTRAINT fk_usuario_roles_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_roles_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rol_permisos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rol_id BIGINT NOT NULL,
    permiso_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_rol_permisos UNIQUE (rol_id, permiso_id),
    CONSTRAINT fk_rol_permisos_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rol_permisos_permiso FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default roles
INSERT INTO roles (nombre, descripcion) VALUES
('admin', 'Administrador del sistema - Acceso completo'),
('doctora', 'Médico principal - Puede gestionar pacientes, consultas y citas'),
('enfermera', 'Personal de enfermería - Acceso limitado a lectura y registro de signos vitales');

-- Insert default permissions
INSERT INTO permisos (nombre, modulo, accion, descripcion) VALUES
('pacientes:read', 'pacientes', 'read', 'Ver pacientes'),
('pacientes:write', 'pacientes', 'write', 'Crear/Editar pacientes'),
('pacientes:delete', 'pacientes', 'delete', 'Eliminar pacientes'),
('historias:read', 'historias', 'read', 'Ver historias clínicas'),
('historias:write', 'historias', 'write', 'Crear/Editar historias clínicas'),
('consultas:read', 'consultas', 'read', 'Ver consultas'),
('consultas:write', 'consultas', 'write', 'Crear/Editar consultas'),
('citas:read', 'citas', 'read', 'Ver citas'),
('citas:write', 'citas', 'write', 'Crear/Editar citas'),
('citas:delete', 'citas', 'delete', 'Eliminar citas'),
('agendas:read', 'agendas', 'read', 'Ver agendas'),
('agendas:write', 'agendas', 'write', 'Crear/Editar agendas'),
('documentos:read', 'documentos', 'read', 'Ver documentos'),
('documentos:write', 'documentos', 'write', 'Crear/Editar documentos'),
('usuarios:read', 'usuarios', 'read', 'Ver usuarios'),
('usuarios:write', 'usuarios', 'write', 'Crear/Editar usuarios'),
('usuarios:delete', 'usuarios', 'delete', 'Eliminar usuarios'),
('contacto:read', 'contacto', 'read', 'Ver mensajes de contacto'),
('contacto:write', 'contacto', 'write', 'Responder mensajes de contacto'),
('admin:full', 'admin', 'full', 'Acceso completo de administrador');

-- Assign permissions to roles
-- Admin gets all permissions
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p WHERE r.nombre = 'admin';

-- Doctora gets patient, history, consultation, appointment, document permissions
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p 
WHERE r.nombre = 'doctora' 
AND p.nombre IN ('pacientes:read', 'pacientes:write', 'pacientes:delete',
                 'historias:read', 'historias:write',
                 'consultas:read', 'consultas:write',
                 'citas:read', 'citas:write', 'citas:delete',
                 'agendas:read', 'agendas:write',
                 'documentos:read', 'documentos:write');

-- Enfermera gets read-only for patients and limited write
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p 
WHERE r.nombre = 'enfermera' 
AND p.nombre IN ('pacientes:read', 'pacientes:write',
                  'historias:read',
                  'consultas:read', 'consultas:write',
                  'citas:read', 'citas:write');
