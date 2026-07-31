package com.medicalerp.paciente.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PacienteConsentimientoResponse {

    private Long id;
    private Long pacienteId;
    private Long clinicaId;
    private String tipo;
    private Boolean aceptado;
    private LocalDate fecha;
    private String version;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;
}
