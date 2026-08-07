package com.medicalerp.tratamiento.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Tratamiento Dashboard Response DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TratamientoDashboardResponse {

    private Long totalTratamientos;
    private Long tratamientosPendientes;
    private Long tratamientosActivos;
    private Long tratamientosPausados;
    private Long tratamientosFinalizados;
    private Long tratamientosCancelados;
    private List<TratamientoAlertaResponse> alertas;

}
