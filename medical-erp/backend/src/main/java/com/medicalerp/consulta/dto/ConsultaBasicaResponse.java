package com.medicalerp.consulta.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Consulta Basica Response - Treatment-enriched fields from Consulta
 * Used to enrich TratamientoResponse with parent Consulta context
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultaBasicaResponse {

    private Long id;
    private String motivo;
    private Instant fecha;
    private String tipoTratamiento;
    private Integer sesionesRealizadas;
    private LocalDate fechaInicioTratamiento;
    private String evolucionMejoria;
    private LocalDate proximaFecha;
    private Double costoTotal;
    private String diagnosticoLista;

}
