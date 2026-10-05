package com.medicalerp.notificacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NotificacionResponse {
    private Long id;
    private Long usuarioDestinoId;
    private Long usuarioOrigenId;
    private String usuarioOrigenNombre;
    private String tipo;
    private String titulo;
    private String mensaje;
    private String referenciaTipo;
    private Long referenciaId;
    private Boolean leida;
    private Instant createdAt;
}