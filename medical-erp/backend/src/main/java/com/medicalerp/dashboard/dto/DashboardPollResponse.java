package com.medicalerp.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardPollResponse {

    private List<CitaResumenDto> citasHoy;
    private List<CitaResumenDto> cola;
    private CitaResumenDto proximoPaciente;
    private CitasHoyStatsDto citasHoyStats;
    private LocalDateTime timestamp;

}
