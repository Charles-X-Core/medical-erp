package com.medicalerp.cita.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.Instant;
import java.time.LocalTime;

/**
 * Cita Response DTO (DOM-CIT-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitaResponse {

    private Long id;
    private Long pacienteId;
    private String pacienteNombre;
    private Long usuarioId;
    private String usuarioNombre;
    private Long tipoCitaId;
    private String tipoCitaNombre;
    private LocalDate fecha;
    private LocalTime hora;
    private String prioridad;
    private Integer duracionMinutos;
    private String motivo;
    private String motivoEditado;
    private Long tratamientoId;
    private Long sesionId;
    private String estado;
    private Long consultaId;
    private String notas;
    private Instant asistioConfirmedAt;
    private Instant inicioAtencion;
    private Instant finAtencion;
    private Instant canceladoAt;
    private String canceladoMotivo;
    private Long reprogramadaDe;
    private Long solicitadaPorId;
    private String solicitadaPorNombre;
    private Instant createdAt;
    private Instant updatedAt;

}
