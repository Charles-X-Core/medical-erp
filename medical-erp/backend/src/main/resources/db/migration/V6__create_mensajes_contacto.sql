-- V6__create_mensajes_contacto.sql
-- Description: Create mensajes_contacto table
-- Author: Medical ERP System
-- Date: 2026-07-29

CREATE TABLE IF NOT EXISTS mensajes_contacto (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    asunto VARCHAR(255),
    mensaje TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    replied_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_mensajes_estado ON mensajes_contacto(estado);
CREATE INDEX idx_mensajes_email ON mensajes_contacto(email);
