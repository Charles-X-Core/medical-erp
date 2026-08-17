package com.medicalerp.tratamiento.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Tipo Sesion Tratamiento Response DTO (DOM-TRAT-005)
 * Catalogo de tipos de sesion
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TipoSesionTratamientoResponse {

    private Long id;
    private Long clinicaId;
    private String codigo;
    private String nombre;
    private String descripcion;
    private Integer duracionMinutos;
    private Boolean requiereProtocolo;
    private Boolean activo;
    private Integer orden;

}
