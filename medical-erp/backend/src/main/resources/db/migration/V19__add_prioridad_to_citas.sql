-- V19__add_prioridad_to_citas.sql
-- Description: Add prioridad column to citas
-- Author: Medical ERP System
-- Date: 2026-08-03

ALTER TABLE citas
ADD COLUMN prioridad VARCHAR(20) NOT NULL DEFAULT 'NORMAL' AFTER hora;
