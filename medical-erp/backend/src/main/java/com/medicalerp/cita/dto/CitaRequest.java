package com.medicalerp.cita.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Cita Request DTO (DOM-CIT-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitaRequest {

    @NotNull(message = "El paciente es requerido")
    private Long pacienteId;

    private Long usuarioId;

    private Long tipoCitaId;

    private Long tratamientoId;

    @NotNull(message = "La fecha es requerida")
    private LocalDate fecha;

    private LocalTime hora;

    private String prioridad;

    private Integer duracionMinutos;

    private String motivo;

    private String notas;

}
