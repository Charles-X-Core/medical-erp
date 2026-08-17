-- V21__add_permite_inicio_inmediato_to_protocolos_clinicos.sql
-- Description: Add permite_inicio_inmediato to protocolos_clinicos
-- Author: Medical ERP System
-- Date: 2026-08-03

ALTER TABLE protocolos_clinicos
ADD COLUMN permite_inicio_inmediato BOOLEAN NOT NULL DEFAULT TRUE AFTER notas_protocolo;
