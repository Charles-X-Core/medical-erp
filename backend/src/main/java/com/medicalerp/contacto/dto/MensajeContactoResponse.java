package com.medicalerp.contacto.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * MensajeContacto Response DTO (DOM-CON-002)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MensajeContactoResponse {

    private Long id;
    private String nombre;
    private String email;
    private String telefono;
    private String asunto;
    private String mensaje;
    private String estado;
    private String ipAddress;
    private LocalDateTime readAt;
    private LocalDateTime repliedAt;
    private LocalDateTime createdAt;

}
