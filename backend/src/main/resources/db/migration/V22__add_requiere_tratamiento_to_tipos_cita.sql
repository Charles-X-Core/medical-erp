-- V22__add_requiere_tratamiento_to_tipos_cita.sql
-- Description: Add requiere_tratamiento to tipos_cita
-- Author: Medical ERP System
-- Date: 2026-08-03

ALTER TABLE tipos_cita
ADD COLUMN requiere_tratamiento BOOLEAN NOT NULL DEFAULT FALSE AFTER prioridad_default;
