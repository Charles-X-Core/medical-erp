-- V18__expand_tipos_cita.sql
-- Description: Add buffer_minutos and prioridad_default to tipos_cita
-- Author: Medical ERP System
-- Date: 2026-08-03

ALTER TABLE tipos_cita
ADD COLUMN buffer_minutos INT NOT NULL DEFAULT 0 AFTER duracion_minutos;

ALTER TABLE tipos_cita
ADD COLUMN prioridad_default VARCHAR(20) NOT NULL DEFAULT 'NORMAL' AFTER buffer_minutos;
