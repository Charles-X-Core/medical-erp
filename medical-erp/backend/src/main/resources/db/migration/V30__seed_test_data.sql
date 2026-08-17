-- V30__seed_test_data.sql
-- Description: Seed test data for development (users, patients, agenda, disponibilidad, citas)
-- Author: Medical ERP System
-- Date: 2026-08-12

-- =============================================
-- 1. Test Users
-- =============================================

INSERT INTO usuarios (clinica_id, nombre, email, password, activo, created_at, updated_at)
VALUES
    (1, 'Dra. María López', 'doctora@test.com',
     '$2b$10$0RLOPYXzRl7jG7tZKKlJ/uEEXTQ3/Xjr3XrVgk5OU3hcGE5de6HFy',
     TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (1, 'Enf. Ana García', 'enfermera@test.com',
     '$2b$10$0RLOPYXzRl7jG7tZKKlJ/uEEXTQ3/Xjr3XrVgk5OU3hcGE5de6HFy',
     TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Assign roles
INSERT INTO usuario_roles (usuario_id, rol_id, created_at)
SELECT u.id, r.id, CURRENT_TIMESTAMP
FROM usuarios u, roles r
WHERE u.email = 'doctora@test.com' AND r.nombre = 'doctora';

INSERT INTO usuario_roles (usuario_id, rol_id, created_at)
SELECT u.id, r.id, CURRENT_TIMESTAMP
FROM usuarios u, roles r
WHERE u.email = 'enfermera@test.com' AND r.nombre = 'enfermera';

-- =============================================
-- 2. Test Patients (using correct column names)
-- =============================================

INSERT INTO pacientes (clinica_id, licencia_conducir, nombres, apellido_paterno, apellido_materno,
    fecha_nacimiento, sexo, estado_civil, telefono, email,
    direccion_linea1, ciudad, direccion_pais,
    lugar_nacimiento, lugar_procedencia, grado_instruccion, ocupacion,
    nombre_acompanante, contacto_emergencia, telefono_emergencia, parentesco_emergencia,
    peso, estatura, created_at, updated_at)
VALUES
    (1, 'DNI-1001', 'Carlos', 'Mendoza', 'Ríos',
     '1985-03-15', 'MASCULINO', 'CASADO', '999111222', 'carlos.mendoza@email.com',
     'Av. Los Olivos 123', 'Lima', 'PE',
     'Lima', 'Lima', 'Universitario', 'Ingeniero',
     'María Mendoza', 'María Mendoza', '999333444', 'Esposa', 78.5, 175.0,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (1, 'DNI-1002', 'Lucía', 'Fernández', 'García',
     '1990-07-22', 'FEMENINO', 'SOLTERA', '988777666', 'lucia.fernandez@email.com',
     'Jr. Tacna 456', 'Arequipa', 'PE',
     'Arequipa', 'Arequipa', 'Universitario', 'Abogada',
     'Pedro Fernández', 'Pedro Fernández', '988555444', 'Padre', 55.2, 162.0,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (1, 'DNI-1003', 'Roberto', 'Vargas', 'Torres',
     '1978-11-08', 'MASCULINO', 'DIVORCIADO', '977666555', 'roberto.vargas@email.com',
     'Calle Lima 789', 'Cusco', 'PE',
     'Cusco', 'Cusco', 'Técnico', 'Contador',
     'Ana Torres', 'Ana Torres', '977444333', 'Madre', 82.0, 170.0,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (1, 'DNI-1004', 'Sofía', 'Torres', 'Méndez',
     '1995-01-30', 'FEMENINO', 'CASADO', '966555444', 'sofia.torres@email.com',
     'Av. Javier Prado 1010', 'Surco', 'PE',
     'Trujillo', 'Trujillo', 'Universitario', 'Doctora',
     'Luis Méndez', 'Luis Méndez', '966333222', 'Esposo', 60.0, 168.0,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (1, 'DNI-1005', 'Miguel', 'Ramos', 'Cruz',
     '1982-05-12', 'MASCULINO', 'VIUDO', '955444333', 'miguel.ramos@email.com',
     'Calle Proceres 202', 'La Molina', 'PE',
     'Huancayo', 'Huancayo', 'Universitario', 'Arquitecto',
     'Carmen Cruz', 'Carmen Cruz', '955222111', 'Hermana', 75.0, 178.0,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =============================================
-- 3. Agendas (one per user)
-- =============================================

INSERT INTO agendas (usuario_id, nombre, created_at, updated_at)
SELECT id, 'Agenda Dra. López', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM usuarios WHERE email = 'doctora@test.com';

INSERT INTO agendas (usuario_id, nombre, created_at, updated_at)
SELECT id, 'Agenda Enf. García', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM usuarios WHERE email = 'enfermera@test.com';

-- =============================================
-- 4. Disponibilidad (Mon-Fri 8:00-12:00 + 14:00-18:00, Sat 9:00-13:00)
-- =============================================

-- Dra. López: Monday
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 1, '08:00:00', '12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'doctora@test.com';
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 1, '14:00:00', '18:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'doctora@test.com';

-- Dra. López: Tuesday
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 2, '08:00:00', '12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'doctora@test.com';
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 2, '14:00:00', '18:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'doctora@test.com';

-- Dra. López: Wednesday
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 3, '08:00:00', '12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'doctora@test.com';
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 3, '14:00:00', '18:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'doctora@test.com';

-- Dra. López: Thursday
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 4, '08:00:00', '12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'doctora@test.com';
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 4, '14:00:00', '18:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'doctora@test.com';

-- Dra. López: Friday
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 5, '08:00:00', '12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'doctora@test.com';
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 5, '14:00:00', '18:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'doctora@test.com';

-- Dra. López: Saturday
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 6, '09:00:00', '13:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'doctora@test.com';

-- Enf. García: Mon-Fri
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 1, '08:00:00', '12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'enfermera@test.com';
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 1, '14:00:00', '18:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'enfermera@test.com';
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 2, '08:00:00', '12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'enfermera@test.com';
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 2, '14:00:00', '18:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'enfermera@test.com';
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 3, '08:00:00', '12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'enfermera@test.com';
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 3, '14:00:00', '18:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'enfermera@test.com';
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 4, '08:00:00', '12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'enfermera@test.com';
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 4, '14:00:00', '18:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'enfermera@test.com';
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 5, '08:00:00', '12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'enfermera@test.com';
INSERT INTO disponibilidades (agenda_id, dia_semana, hora_inicio, hora_fin, created_at, updated_at)
SELECT a.id, 5, '14:00:00', '18:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'enfermera@test.com';

-- =============================================
-- 5. Citas (test appointments for this week)
-- =============================================

-- Monday 9:00 - completada
INSERT INTO citas (paciente_id, usuario_id, tipo_cita_id, fecha_hora, duracion_minutos,
    motivo, estado, prioridad, notas, created_at, updated_at)
SELECT p.id, u.id, t.id,
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) + INTERVAL 9 HOUR,
    30, 'Dolor de espalda baja', 'completada', 'NORMAL',
    'Paciente con dolor lumbar crónico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM pacientes p, usuarios u, tipos_cita t
WHERE p.licencia_conducir = 'DNI-1001' AND u.email = 'doctora@test.com' AND t.nombre = 'Consulta General';

-- Monday 10:30 - confirmada
INSERT INTO citas (paciente_id, usuario_id, tipo_cita_id, fecha_hora, duracion_minutos,
    motivo, estado, prioridad, notas, created_at, updated_at)
SELECT p.id, u.id, t.id,
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) + INTERVAL 630 MINUTE,
    60, 'Primera consulta - evaluación general', 'confirmada', 'NORMAL',
    NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM pacientes p, usuarios u, tipos_cita t
WHERE p.licencia_conducir = 'DNI-1002' AND u.email = 'doctora@test.com' AND t.nombre = 'Primera Visita';

-- Monday 15:00 - pendiente
INSERT INTO citas (paciente_id, usuario_id, tipo_cita_id, fecha_hora, duracion_minutos,
    motivo, estado, prioridad, notas, created_at, updated_at)
SELECT p.id, u.id, t.id,
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) + INTERVAL 15 HOUR,
    20, 'Control post-tratamiento', 'pendiente', 'NORMAL',
    NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM pacientes p, usuarios u, tipos_cita t
WHERE p.licencia_conducir = 'DNI-1003' AND u.email = 'doctora@test.com' AND t.nombre = 'Control';

-- Tuesday 9:30 - confirmada URGENTE
INSERT INTO citas (paciente_id, usuario_id, tipo_cita_id, fecha_hora, duracion_minutos,
    motivo, estado, prioridad, notas, created_at, updated_at)
SELECT p.id, u.id, t.id,
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) + INTERVAL 1 DAY + INTERVAL 570 MINUTE,
    30, 'Seguimiento de tratamiento celular', 'confirmada', 'URGENTE',
    'Paciente en seguimiento post-terapia', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM pacientes p, usuarios u, tipos_cita t
WHERE p.licencia_conducir = 'DNI-1004' AND u.email = 'doctora@test.com' AND t.nombre = 'Consulta General';

-- Tuesday 11:00 - pendiente
INSERT INTO citas (paciente_id, usuario_id, tipo_cita_id, fecha_hora, duracion_minutos,
    motivo, estado, prioridad, notas, created_at, updated_at)
SELECT p.id, u.id, t.id,
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) + INTERVAL 1 DAY + INTERVAL 11 HOUR,
    60, 'Sesión de terapia celular', 'pendiente', 'NORMAL',
    NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM pacientes p, usuarios u, tipos_cita t
WHERE p.licencia_conducir = 'DNI-1005' AND u.email = 'doctora@test.com' AND t.nombre = 'Terapia Celular';

-- Wednesday 10:00 - pendiente
INSERT INTO citas (paciente_id, usuario_id, tipo_cita_id, fecha_hora, duracion_minutos,
    motivo, estado, prioridad, notas, created_at, updated_at)
SELECT p.id, u.id, t.id,
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) + INTERVAL 2 DAY + INTERVAL 10 HOUR,
    20, 'Control de evolución', 'pendiente', 'NORMAL',
    NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM pacientes p, usuarios u, tipos_cita t
WHERE p.licencia_conducir = 'DNI-1001' AND u.email = 'doctora@test.com' AND t.nombre = 'Control';

-- Wednesday 15:30 - pendiente
INSERT INTO citas (paciente_id, usuario_id, tipo_cita_id, fecha_hora, duracion_minutos,
    motivo, estado, prioridad, notas, created_at, updated_at)
SELECT p.id, u.id, t.id,
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) + INTERVAL 2 DAY + INTERVAL 930 MINUTE,
    30, 'Resultado de exámenes', 'pendiente', 'NORMAL',
    NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM pacientes p, usuarios u, tipos_cita t
WHERE p.licencia_conducir = 'DNI-1002' AND u.email = 'doctora@test.com' AND t.nombre = 'Consulta General';

-- Thursday 9:00 - pendiente
INSERT INTO citas (paciente_id, usuario_id, tipo_cita_id, fecha_hora, duracion_minutos,
    motivo, estado, prioridad, notas, created_at, updated_at)
SELECT p.id, u.id, t.id,
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) + INTERVAL 3 DAY + INTERVAL 9 HOUR,
    60, 'Evaluación inicial - paciente referido', 'pendiente', 'NORMAL',
    NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM pacientes p, usuarios u, tipos_cita t
WHERE p.licencia_conducir = 'DNI-1003' AND u.email = 'doctora@test.com' AND t.nombre = 'Primera Visita';

-- Friday 8:30 - pendiente URGENTE
INSERT INTO citas (paciente_id, usuario_id, tipo_cita_id, fecha_hora, duracion_minutos,
    motivo, estado, prioridad, notas, created_at, updated_at)
SELECT p.id, u.id, t.id,
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) + INTERVAL 4 DAY + INTERVAL 510 MINUTE,
    45, 'Reacción adversa a medicamento', 'pendiente', 'URGENTE',
    'Paciente con reacción alérgica', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM pacientes p, usuarios u, tipos_cita t
WHERE p.licencia_conducir = 'DNI-1004' AND u.email = 'doctora@test.com' AND t.nombre = 'Emergencia';

-- Friday 14:00 - cancelada
INSERT INTO citas (paciente_id, usuario_id, tipo_cita_id, fecha_hora, duracion_minutos,
    motivo, estado, prioridad, notas, created_at, updated_at)
SELECT p.id, u.id, t.id,
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) + INTERVAL 4 DAY + INTERVAL 14 HOUR,
    30, 'Consulta de seguimiento general', 'cancelada', 'NORMAL',
    'Paciente canceló por viaje', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM pacientes p, usuarios u, tipos_cita t
WHERE p.licencia_conducir = 'DNI-1005' AND u.email = 'doctora@test.com' AND t.nombre = 'Consulta General';

-- =============================================
-- 6. Bloqueos (test blocks for doctora)
-- =============================================

-- Wednesday 12:00-14:00
INSERT INTO bloqueos (agenda_id, fecha_inicio, fecha_fin, motivo, created_at, updated_at)
SELECT a.id,
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) + INTERVAL 2 DAY + INTERVAL 12 HOUR,
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) + INTERVAL 2 DAY + INTERVAL 14 HOUR,
    'Reunión de equipo médico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'doctora@test.com';

-- Friday 16:00-18:00
INSERT INTO bloqueos (agenda_id, fecha_inicio, fecha_fin, motivo, created_at, updated_at)
SELECT a.id,
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) + INTERVAL 4 DAY + INTERVAL 16 HOUR,
    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) + INTERVAL 4 DAY + INTERVAL 18 HOUR,
    'Cita personal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM agendas a JOIN usuarios u ON a.usuario_id = u.id WHERE u.email = 'doctora@test.com';
