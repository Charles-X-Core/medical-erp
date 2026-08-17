package com.medicalerp.dashboard.dto;

import com.medicalerp.tratamiento.dto.TratamientoAlertaResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Respuesta consolidada del dashboard (API-DASH-001)
 * Agrega por clínica los datos operativos del día.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResumenResponse {

    private Long clinicaId;
    private LocalDate fecha;
    private CitasHoyStatsDto citasHoy;
    private List<CitaResumenDto> citasHoyList;
    private List<CitaResumenDto> cola;
    private CitaResumenDto proximoPaciente;
    private List<CitaResumenDto> citasProximas;
    private TratamientosStatsDto tratamientos;
    private List<TratamientoActivoDto> tratamientosActivos;
    private List<TratamientoAlertaResponse> alertas;
    private long pacientesNuevos7d;

}
