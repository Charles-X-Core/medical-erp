package com.medicalerp.agenda.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Bloqueo Response DTO (DOM-AGE-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BloqueoResponse {

    private Long id;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private String motivo;
    private Instant createdAt;
    private Instant updatedAt;

}
