package com.medicalerp.tarea.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TareaRequest {

    @NotBlank(message = "El destino es requerido")
    private String destinoRol;

    private Long pacienteId;

    @NotBlank(message = "El tipo es requerido")
    private String tipo;

    @NotBlank(message = "El titulo es requerido")
    private String titulo;

    private String descripcion;
}
