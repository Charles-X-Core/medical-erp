package com.medicalerp.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Estadísticas de tratamientos para el dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TratamientosStatsDto {

    private long total;
    private long pendientes;
    private long programados;
    private long activos;
    private long pausados;
    private long finalizados;
    private long cancelados;

}
