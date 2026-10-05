package com.medicalerp.agenda.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Tipo Cita Response DTO (DOM-AGE-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TipoCitaResponse {

    private Long id;
    private String nombre;
    private Integer duracionMinutos;
    private Integer bufferMinutos;
    private Integer duracionTotal;
    private String prioridadDefault;
    private Boolean requiereTratamiento;
    private String descripcion;
    private Boolean activo;
    private Long usuarioId;
    private String usuarioNombre;
    private Instant createdAt;
    private Instant updatedAt;

}
