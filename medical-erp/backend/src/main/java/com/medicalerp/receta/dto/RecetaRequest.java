package com.medicalerp.receta.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecetaRequest {

    @NotNull(message = "La clínica es requerida")
    private Long clinicaId;

    @NotNull(message = "El paciente es requerido")
    private Long pacienteId;

    private Long tratamientoId;

    private Long sesionId;

    private Long consultaId;

    @NotBlank(message = "El medicamento es requerido")
    private String medicamento;

    private String dosis;

    private String frecuencia;

    private String duracion;

    private String indicaciones;

    private LocalDateTime fecha;
}
