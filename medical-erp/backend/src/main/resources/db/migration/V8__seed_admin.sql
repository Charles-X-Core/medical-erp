-- V8__seed_admin.sql
-- Description: Create default admin user (SEC-002, SEED-001)
-- WARNING: Password must be changed immediately after first login!
-- Author: Medical ERP System
-- Date: 2026-07-29

-- Insert admin user
-- Password: Admin123 (bcrypt encoded)
-- IMPORTANT: This password MUST be changed on first login!

INSERT INTO usuarios (nombre, email, password, activo, created_at, updated_at)
VALUES (
    'Administrador',
    'admin@clinica.com',
    '$2b$12$1CR23SXc2ylWaqpusd5.B.IukWZ1JhUJz3kPgBEHnYHu9BsQH3gn6', -- Admin123
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Assign admin role to admin user
INSERT INTO usuario_roles (usuario_id, rol_id, created_at)
VALUES (
    (SELECT id FROM usuarios WHERE email = 'admin@clinica.com'),
    (SELECT id FROM roles WHERE nombre = 'admin'),
    CURRENT_TIMESTAMP
);
