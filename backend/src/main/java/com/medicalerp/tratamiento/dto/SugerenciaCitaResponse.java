package com.medicalerp.tratamiento.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Sugerencia Cita Response DTO
 * Calculada en tiempo real por SugerenciaCitaService
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SugerenciaCitaResponse {

    private LocalDate fechaRecomendada;
    private List<HorarioDisponible> horariosDisponibles;
    private Integer frecuenciaDias;
    private String notasProtocolo;

}
