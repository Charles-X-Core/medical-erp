package com.medicalerp.consulta.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Signos Vitales Value Object (DOM-CON-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignosVitales {

    private String presionArterial;
    private Integer pulso;
    private Double temperatura;
    private Double peso;
    private Integer talla;
    private Integer saturacion;
    private Integer frecuenciaRespiratoria;

}
