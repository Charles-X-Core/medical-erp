package com.medicalerp.paciente.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PacienteConsentimientoRequest {

    private Long id;

    @NotBlank(message = "El tipo de consentimiento es requerido")
    @Size(max = 50, message = "El tipo de consentimiento no puede exceder 50 caracteres")
    private String tipo;

    private Boolean aceptado;

    private LocalDate fecha;

    @Size(max = 20, message = "La versión no puede exceder 20 caracteres")
    private String version;

    @Size(max = 45, message = "La IP no puede exceder 45 caracteres")
    private String ipAddress;

    @Size(max = 500, message = "El user agent no puede exceder 500 caracteres")
    private String userAgent;
}
