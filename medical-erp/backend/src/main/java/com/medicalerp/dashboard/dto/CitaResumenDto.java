package com.medicalerp.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Resumen compacto de una cita para el dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitaResumenDto {

    private Long id;
    private Long pacienteId;
    private String pacienteNombre;
    private Long usuarioId;
    private String usuarioNombre;
    private String tipoCitaNombre;
    private LocalDate fecha;
    private LocalTime hora;
    private String prioridad;
    private Integer duracionMinutos;
    private String motivo;
    private String estado;
    private Long tratamientoId;

}
