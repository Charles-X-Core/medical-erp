package com.medicalerp.agenda.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Bloqueo Request DTO (DOM-AGE-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BloqueoRequest {

    @NotNull(message = "La fecha de inicio es requerida")
    private LocalDateTime fechaInicio;

    @NotNull(message = "La fecha de fin es requerida")
    private LocalDateTime fechaFin;

    private String motivo;

}
