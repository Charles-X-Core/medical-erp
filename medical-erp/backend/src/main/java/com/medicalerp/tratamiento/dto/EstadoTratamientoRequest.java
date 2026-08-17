package com.medicalerp.tratamiento.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Estado Tratamiento Request DTO (DOM-TRAT-001)
 * Para cambiar estado via PATCH /{id}/estado
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstadoTratamientoRequest {

    @NotBlank(message = "La accion es requerida")
    private String accion;

    private String motivo;

    private String resultadoFinal;

}
