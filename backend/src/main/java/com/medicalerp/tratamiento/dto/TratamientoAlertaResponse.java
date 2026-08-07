package com.medicalerp.tratamiento.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Tratamiento Alerta Response DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TratamientoAlertaResponse {

    private String tipoAlerta;
    private Long tratamientoId;
    private Long pacienteId;
    private String pacienteNombre;
    private String tipoTratamiento;
    private String mensaje;
    private String fechaReferencia;
    private String accionSugerida;
    private String severidad;

}
