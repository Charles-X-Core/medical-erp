package com.medicalerp.receta.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecetaResponse {
    private Long id;
    private Long clinicaId;
    private Long pacienteId;
    private Long tratamientoId;
    private Long sesionId;
    private Long consultaId;
    private String medicamento;
    private String dosis;
    private String frecuencia;
    private String duracion;
    private String indicaciones;
    private LocalDateTime fecha;
    private String archivoRuta;
    private Instant createdAt;
}
