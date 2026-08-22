-- V41: Add brute force protection fields to usuarios
-- failed_login_attempts: tracks consecutive failed login attempts
-- locked_until: timestamp when account lockout expires (null = not locked)

ALTER TABLE usuarios
    ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN locked_until DATETIME NULL;
