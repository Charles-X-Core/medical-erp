package com.medicalerp.tratamiento.dto;

import com.medicalerp.common.valueobject.SignosVitales;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Sesion Tratamiento Response DTO (DOM-TRAT-003)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SesionTratamientoResponse {

    private Long id;
    private Long tratamientoId;
    private Long citaId;
    private Long clinicaId;
    private Long tipoSesionId;
    private String tipoSesionNombre;
    private Integer numeroSesion;
    private LocalDateTime fecha;
    private String motivoVisita;
    private SignosVitales signosVitales;
    private String procedimientoRealizado;
    private String medicamentos;
    private String dosis;
    private String observaciones;
    private String evolucion;
    private BigDecimal costoSesion;
    private Boolean requiereCita;
    private List<EvidenciaTratamientoResponse> evidencias;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
