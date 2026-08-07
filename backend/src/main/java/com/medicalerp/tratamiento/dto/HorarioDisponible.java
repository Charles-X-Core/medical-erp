package com.medicalerp.tratamiento.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * Horario Disponible DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HorarioDisponible {

    private LocalTime hora;
    private Long usuarioId;
    private String usuarioNombre;
    private Integer duracionMinutos;

}
