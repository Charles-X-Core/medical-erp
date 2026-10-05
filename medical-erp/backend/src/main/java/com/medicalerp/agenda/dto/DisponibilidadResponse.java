package com.medicalerp.agenda.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalTime;

/**
 * Disponibilidad Response DTO (DOM-AGE-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisponibilidadResponse {

    private Long id;
    private Integer diaSemana;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private Instant createdAt;
    private Instant updatedAt;

}
