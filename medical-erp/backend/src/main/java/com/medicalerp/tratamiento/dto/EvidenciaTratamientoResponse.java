package com.medicalerp.tratamiento.dto;

import com.medicalerp.tratamiento.enums.TipoEvidencia;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Evidencia Tratamiento Response DTO (DOM-TRAT-004)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvidenciaTratamientoResponse {

    private Long id;
    private Long sesionId;
    private Long clinicaId;
    private TipoEvidencia tipo;
    private String archivoRuta;
    private String archivoNombre;
    private String archivoMimeType;
    private Long archivoTamano;
    private String descripcion;
    private LocalDateTime createdAt;

}
