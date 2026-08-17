package com.medicalerp.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Tratamiento activo resumido para el dashboard clínico
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TratamientoActivoDto {

    private Long id;
    private Long pacienteId;
    private String pacienteNombre;
    private String tipoTratamiento;
    private String estado;
    private LocalDate fechaInicio;
    private Integer sesionesRealizadas;
    private Integer sesionesPlaneadas;
    private Integer sesionesRestantes;
    private BigDecimal costoEstimado;

}
