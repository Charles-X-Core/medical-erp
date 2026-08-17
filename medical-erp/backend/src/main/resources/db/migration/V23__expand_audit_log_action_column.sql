-- V23__expand_audit_log_action_column.sql
-- Description: Expand audit_log action column from varchar(20) to varchar(100)
-- Author: Medical ERP System
-- Date: 2026-08-04

ALTER TABLE audit_log MODIFY COLUMN action VARCHAR(100) NOT NULL;
