package com.medicalerp.tratamiento.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Tratamiento Request DTO (DOM-TRAT-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TratamientoRequest {

    @NotNull(message = "El paciente es requerido")
    private Long pacienteId;

    private Long historiaClinicaId;

    private Long consultaOrigenId;

    @NotBlank(message = "El tipo de tratamiento es requerido")
    private String tipoTratamiento;

    private String diagnosticoInicial;

    @NotBlank(message = "El objetivo es requerido")
    private String objetivo;

    private Long usuarioAsignadoId;

    @NotNull(message = "Las sesiones planeadas son requeridas")
    @Min(value = 1, message = "Minimo 1 sesion planeada")
    private Integer sesionesPlaneadas;

    private BigDecimal costoEstimado;

    private String observaciones;

    private Boolean iniciarAhora;

    private Long tipoPrimeraSesionId;

}
