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
public class PacienteDocumentoResponse {

    private Long id;
    private Long pacienteId;
    private Long clinicaId;
    private String tipoDocumento;
    private String numeroDocumento;
    private String paisEmision;
    private LocalDate fechaVencimiento;
    private Boolean esPrincipal;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
