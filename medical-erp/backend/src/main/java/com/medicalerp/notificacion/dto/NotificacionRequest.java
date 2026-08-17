package com.medicalerp.notificacion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NotificacionRequest {
    @NotNull
    private Long usuarioDestinoId;
    @NotBlank
    private String tipo;
    @NotBlank
    private String titulo;
    @NotBlank
    private String mensaje;
    private String referenciaTipo;
    private Long referenciaId;
}