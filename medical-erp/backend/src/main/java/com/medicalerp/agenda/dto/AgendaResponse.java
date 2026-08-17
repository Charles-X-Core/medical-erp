package com.medicalerp.agenda.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Agenda Response DTO (DOM-AGE-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgendaResponse {

    private Long id;
    private Long usuarioId;
    private String usuarioNombre;
    private String nombre;
    private List<DisponibilidadResponse> disponibilidades;
    private List<BloqueoResponse> bloqueos;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
