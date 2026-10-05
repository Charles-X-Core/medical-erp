package com.medicalerp.tratamiento.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Protocolo Clinico Response DTO (DOM-TRAT-002)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProtocoloClinicoResponse {

    private Long id;
    private Long tratamientoId;
    private Long clinicaId;
    private Integer frecuenciaDias;
    private Integer duracionSesionMinutos;
    private String notasProtocolo;
    private Instant createdAt;
    private Instant updatedAt;

}
