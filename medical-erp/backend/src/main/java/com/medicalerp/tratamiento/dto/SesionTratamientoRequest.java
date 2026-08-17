package com.medicalerp.tratamiento.dto;

import com.medicalerp.common.valueobject.SignosVitales;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Sesion Tratamiento Request DTO (DOM-TRAT-003)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SesionTratamientoRequest {

    @NotNull(message = "El tipo de sesion es requerido")
    private Long tipoSesionId;

    private Long citaId;

    @NotNull(message = "La fecha es requerida")
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

}
