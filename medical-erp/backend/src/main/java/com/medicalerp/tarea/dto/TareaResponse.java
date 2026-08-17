package com.medicalerp.tarea.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TareaResponse {

    private Long id;
    private Long clinicaId;
    private Long origenUsuarioId;
    private String origenUsuarioNombre;
    private String destinoRol;
    private Long pacienteId;
    private String pacienteNombre;
    private String tipo;
    private String titulo;
    private String descripcion;
    private String estado;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
