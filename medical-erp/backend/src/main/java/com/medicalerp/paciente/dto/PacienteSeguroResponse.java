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
public class PacienteSeguroResponse {

    private Long id;
    private Long pacienteId;
    private Long clinicaId;
    private String tipoSeguro;
    private String provider;
    private String policyNumber;
    private String groupNumber;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
