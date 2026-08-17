-- V10__create_otp_codes.sql
-- Description: Create table for OTP email verification codes
-- Author: Medical ERP System
-- Date: 2026-07-31

CREATE TABLE otp_codes (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    intentos INT NOT NULL DEFAULT 0,
    expira_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for fast lookups by email and expiration
CREATE INDEX idx_otp_email_expira ON otp_codes(email, expira_at);
CREATE INDEX idx_otp_created ON otp_codes(created_at);
