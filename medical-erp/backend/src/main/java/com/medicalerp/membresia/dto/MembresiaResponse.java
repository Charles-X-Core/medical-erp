package com.medicalerp.membresia.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MembresiaResponse {

    private Long id;
    private Long pacienteId;
    private String pacienteNombre;
    private Long clinicaId;
    private String tipo;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private String estado;
    private boolean vigente;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
