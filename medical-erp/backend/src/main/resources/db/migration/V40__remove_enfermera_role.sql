-- V40__remove_enfermera_role.sql
-- Description: Remove enfermera role and test nurse user
-- Author: Medical ERP System
-- Date: 2026-08-20

-- Remove role permissions for enfermera
DELETE FROM rol_permisos
WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'enfermera');

-- Remove user-role assignments for enfermera
DELETE FROM usuario_roles
WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'enfermera');

-- Remove test nurse user
DELETE FROM usuarios WHERE email = 'enfermera@test.com';

-- Remove the enfermera role
DELETE FROM roles WHERE nombre = 'enfermera';
