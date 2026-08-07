package com.medicalerp.tratamiento.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Protocolo Clinico Request DTO (DOM-TRAT-002)
 * Todos los campos opcionales (validacion en Service, no BD)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProtocoloClinicoRequest {

    private Integer frecuenciaDias;

    private Integer duracionSesionMinutos;

    private String notasProtocolo;

}
