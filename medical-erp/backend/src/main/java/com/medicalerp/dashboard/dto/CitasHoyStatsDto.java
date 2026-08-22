package com.medicalerp.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Estadísticas de citas del día para el dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitasHoyStatsDto {

    private long total;
    private long pendientes;
    private long confirmadas;
    private long asistieron;
    private long completadas;
    private long canceladas;
    private long reprogramadas;
    private long noShow;
    private long esperando;

}
