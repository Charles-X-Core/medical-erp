package com.medicalerp.agenda.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Tipo Cita Request DTO (DOM-AGE-001)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TipoCitaRequest {

    @NotBlank(message = "El nombre es requerido")
    private String nombre;

    @NotNull(message = "La duración es requerida")
    @Min(value = 15, message = "La duración mínima es 15 minutos")
    @Max(value = 480, message = "La duración máxima es 480 minutos")
    private Integer duracionMinutos;

    @Min(value = 0, message = "Buffer no puede ser negativo")
    @Max(value = 60, message = "Buffer máximo 60 minutos")
    private Integer bufferMinutos;

    private String prioridadDefault;

    private Boolean requiereTratamiento;

    private String descripcion;

}
